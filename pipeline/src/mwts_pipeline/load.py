"""Postgres writes.

Two rules, both non-negotiable:

  1. One transaction per file. The rows and the processed_files marker commit
     together, or neither does. A crash mid-file must leave no partial rows.

     THE CONNECTION MUST BE autocommit=True. psycopg opens an implicit
     transaction on the first statement otherwise, and `conn.transaction()`
     then degrades to a savepoint inside it — so nothing commits until the
     whole run ends, and a failure at file 2,000 discards the first 1,999.
  2. Idempotent. ON CONFLICT DO NOTHING on (sensor_id, ts) means re-delivering
     a file is a no-op rather than a duplicate — and Airflow WILL re-run tasks,
     on retry, on backfill, and on an operator clearing a task by hand.

Row-by-row INSERT at 500,000 rows takes minutes. Batched executemany takes
seconds — psycopg 3 pipelines these, so it is no longer necessary to reach for
psycopg2's execute_values.

COPY is faster still, but it cannot express ON CONFLICT DO NOTHING, and
idempotency is worth more here than the last 30% of throughput.
"""
from __future__ import annotations

import logging
from collections import Counter
from typing import Iterable, Sequence

from .models import Reading, Rejection

log = logging.getLogger(__name__)

_READING_COLS = ("sensor_id", "ts", "value", "raw_count", "quality",
                 "status", "source_file")

INSERT_READINGS = f"""
INSERT INTO readings ({", ".join(_READING_COLS)})
VALUES (%s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (sensor_id, ts) DO NOTHING
"""

INSERT_REJECTS = """
INSERT INTO rejected_readings
    (ts, tag, plant_code, raw_value, quality, reason, source_file)
VALUES (%s, %s, %s, %s, %s, %s, %s)
"""

# Keeps the dashboard's most frequent query off the hypertable. Guarded on ts
# so an out-of-order replay of old data cannot overwrite a newer value.
UPSERT_LATEST = """
INSERT INTO latest_readings (sensor_id, ts, value, status, quality, raw_count)
VALUES (%s, %s, %s, %s, %s, %s)
ON CONFLICT (sensor_id) DO UPDATE
SET ts = EXCLUDED.ts, value = EXCLUDED.value, status = EXCLUDED.status,
    quality = EXCLUDED.quality, raw_count = EXCLUDED.raw_count
WHERE latest_readings.ts < EXCLUDED.ts
"""

MARK_PROCESSED = """
INSERT INTO processed_files
    (object_key, etag, plant_code, gateway_id, seq,
     readings_in, readings_out, run_id)
VALUES (%(key)s, %(etag)s, %(plant)s, %(gateway)s, %(seq)s,
        %(rin)s, %(rout)s, %(run_id)s)
ON CONFLICT (object_key) DO NOTHING
"""

ALREADY_PROCESSED = "SELECT 1 FROM processed_files WHERE object_key = %s"


def is_processed(cur, object_key: str) -> bool:
    """Checked before parsing. Cheap, and skips the whole file."""
    cur.execute(ALREADY_PROCESSED, (object_key,))
    return cur.fetchone() is not None


def write_file(
    conn,
    *,
    object_key: str,
    readings: Sequence[Reading],
    rejections: Sequence[Rejection],
    gateway_id: str,
    plant_code: str,
    seq: int | None,
    readings_in: int,
    run_id: str,
    etag: str | None = None,
) -> int:
    """Load one file atomically. Returns rows actually inserted.

    Note the return is the count psycopg reports, which excludes rows skipped
    by ON CONFLICT — so a re-delivered file correctly reports 0.
    """
    if not conn.autocommit:
        raise RuntimeError(
            "connection must be autocommit=True — otherwise this transaction "
            "is only a savepoint and nothing commits until the run ends")

    with conn.transaction():                         # psycopg 3, one transaction
        with conn.cursor() as cur:
            inserted = 0
            if readings:
                cur.executemany(INSERT_READINGS, [
                    (r.sensor_id, r.ts, r.value, r.raw_count, r.quality,
                     r.status, r.source_file) for r in readings
                ])
                inserted = cur.rowcount

                cur.executemany(UPSERT_LATEST, [
                    (r.sensor_id, r.ts, r.value, r.status, r.quality, r.raw_count)
                    for r in _latest_per_sensor(readings)
                ])

            if rejections:
                cur.executemany(INSERT_REJECTS, [
                    (x.ts, x.tag, x.plant_code, x.raw_value, x.quality,
                     x.reason, x.source_file) for x in rejections
                ])

            # Same transaction as the rows. If this fails, the rows roll back
            # and the file is retried — rather than being marked done with
            # nothing loaded.
            cur.execute(MARK_PROCESSED, {
                "key": object_key, "etag": etag, "plant": plant_code,
                "gateway": gateway_id, "seq": seq,
                "rin": readings_in, "rout": len(readings), "run_id": run_id,
            })
    return inserted


def _latest_per_sensor(readings: Iterable[Reading]) -> list[Reading]:
    newest: dict[str, Reading] = {}
    for r in readings:
        cur = newest.get(r.sensor_id)
        if cur is None or r.ts > cur.ts:
            newest[r.sensor_id] = r
    return list(newest.values())


def finish_run(conn, run_id: str, *, files_seen: int, files_skipped: int,
               readings_in: int, readings_out: int, counts: Counter,
               reconciled: bool | None, error: str | None = None) -> None:
    """Close the run record. Alert on `reconciled = false`, not only on error —
    a run that completes while silently dropping rows raises nothing else.
    """
    import json as _json
    with conn.transaction(), conn.cursor() as cur:
        cur.execute("""
            UPDATE ingest_runs
               SET finished_at = now(), files_seen = %s, files_skipped = %s,
                   readings_in = %s, readings_out = %s, rejections = %s,
                   reconciled = %s, error = %s
             WHERE run_id = %s
        """, (files_seen, files_skipped, readings_in, readings_out,
              _json.dumps(dict(counts)), reconciled, error, run_id))
