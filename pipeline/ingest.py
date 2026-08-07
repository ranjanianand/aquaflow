#!/usr/bin/env python
"""Ingest raw gateway files into Postgres.

    set DATABASE_URL=postgresql://user:pass@localhost:5432/MWTS
    python ingest.py ../Raw_data_PLC/timeseries

Idempotent: a file already in processed_files is skipped without being read.
Re-running this over the same folder inserts nothing and reports 0 new rows.

Swap the file walk for a bucket listing and this is the production job — the
parsing, cleaning and loading below do not change.
"""
from __future__ import annotations

import logging
import os
import sys
import time
import uuid
from collections import Counter
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path(__file__).parent / "src"))

from mwts_pipeline import load, registry                              # noqa: E402
from mwts_pipeline.adapters import ParseError, UnknownFormat, parse_file  # noqa: E402
from mwts_pipeline.process import process_envelope, reconcile         # noqa: E402

logging.basicConfig(level=logging.WARNING,
                    format="%(levelname)s %(name)s %(message)s")
log = logging.getLogger("ingest")


def _refresh_aggregates(conn) -> None:
    with conn.cursor() as cur:
        try:
            cur.execute("SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'")
            if cur.fetchone():
                for view in ("readings_hourly", "readings_daily"):
                    cur.execute(
                        "CALL refresh_continuous_aggregate(%s, NULL, NULL)", (view,))
            else:
                cur.execute("SELECT refresh_aggregates()")
        except Exception as exc:                              # noqa: BLE001
            # A stale rollup is a display problem; a failed ingest is a data
            # problem. Never let the former undo the latter.
            log.warning("aggregate refresh failed: %s", exc)


def main(data_dir: str, tag_map_path: str) -> int:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL is not set.")
        return 64

    tag_map = registry.load(tag_map_path)
    # sensor_id -> plant, so a rejection can be attributed to a plant even when
    # the tag itself is unmapped.
    plant_of = {e.tag: e.plant_code for e in tag_map.values()}

    files = sorted(p for p in Path(data_dir).rglob("*")
                   if p.suffix in (".json", ".jsonl"))
    run_id = str(uuid.uuid4())
    t0 = time.time()

    seen = skipped = readings_in = rows_out = 0
    counts: Counter = Counter()

    # autocommit so each file gets a real transaction of its own. Without it
    # psycopg holds one implicit transaction for the whole run and a failure
    # near the end discards everything loaded before it.
    with psycopg.connect(dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO ingest_runs (run_id) VALUES (%s)", (run_id,))

        with conn.cursor() as cur:
            for path in files:
                key = str(path.relative_to(data_dir)).replace("\\", "/")
                seen += 1

                # Cheap, and skips reading the file entirely.
                if load.is_processed(cur, key):
                    skipped += 1
                    continue

                try:
                    envelopes = parse_file(path.read_bytes(), key=key)
                except (ParseError, UnknownFormat) as exc:
                    counts["unparseable"] += 1
                    log.warning("unreadable file", extra={"key": key, "err": str(exc)})
                    continue

                for env in envelopes:
                    rows, rejects, c = process_envelope(
                        env, tag_map, source_file=key)
                    readings_in += len(env.readings)
                    counts.update(c)

                    plant = next((plant_of[r.tag] for r in env.readings
                                  if r.tag in plant_of), None)

                    rows_out += load.write_file(
                        conn, object_key=key, readings=rows, rejections=rejects,
                        gateway_id=env.gateway_id, plant_code=plant,
                        seq=env.seq, readings_in=len(env.readings), run_id=run_id)

                if seen % 500 == 0:
                    print(f"  {seen:>6,}/{len(files):,} files   "
                          f"{rows_out:>8,} rows   {time.time() - t0:5.1f}s")

        # Roll-ups must be refreshed after a load or the dashboard reads
        # stale aggregates. TimescaleDB has a policy for this; plain Postgres
        # does not, so it is done here for both — cheap when nothing changed.
        if rows_out:
            _refresh_aggregates(conn)

        ok = reconcile(readings_in, rows_out, counts) if skipped == 0 else None
        # Pass None through rather than bool(None) -> False. A run that skipped
        # everything was not checked; recording it as "failed reconciliation"
        # makes an idempotent re-run look like a data loss incident.
        load.finish_run(conn, run_id, files_seen=seen, files_skipped=skipped,
                        readings_in=readings_in, readings_out=rows_out,
                        counts=counts, reconciled=ok)

    dt = time.time() - t0
    print(f"\n  files seen       {seen:>10,}")
    print(f"  already loaded   {skipped:>10,}")
    print(f"  readings parsed  {readings_in:>10,}")
    print(f"  rows inserted    {rows_out:>10,}")
    for reason, n in counts.most_common():
        print(f"    dropped {reason:<20} {n:>8,}")
    print(f"  reconciled       {('OK' if ok else 'n/a (resumed run)' if ok is None else 'FAILED'):>10}")
    print(f"  elapsed          {dt:>9.1f}s   ({rows_out / dt:,.0f} rows/s)")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(64)
    default_map = str(Path(__file__).parent.parent / "Raw_data_PLC" /
                      "register-map" / "tag-map.json")
    raise SystemExit(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else default_map))
