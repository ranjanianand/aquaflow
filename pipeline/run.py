#!/usr/bin/env python
"""Run the pipeline over a folder of raw gateway files and report.

    python run.py ../Raw_data_PLC/timeseries ../Raw_data_PLC/register-map/tag-map.json

No database required — this proves the chain end to end and prints exactly what
would be INSERTed, plus what the dashboard would show. Swap the file walk for a
bucket listing and the load for `load.write_file` and it is the production job.
"""
from __future__ import annotations

import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from mwts_pipeline import registry                                  # noqa: E402
from mwts_pipeline.adapters import ParseError, UnknownFormat, parse_file  # noqa: E402
from mwts_pipeline.process import process_envelope, reconcile       # noqa: E402
from mwts_pipeline.thresholds import resolve_band                   # noqa: E402


def main(data_dir: str, map_path: str) -> int:
    tag_map = registry.load(map_path)

    findings = registry.audit(tag_map)
    if findings:
        print("REGISTER MAP AUDIT")
        for msg, tags in findings.items():
            print(f"  {msg:<62} {len(tags)} tag(s)")
        print()

    files = sorted(p for p in Path(data_dir).rglob("*")
                   if p.suffix in (".json", ".jsonl"))

    rows, rejects, counts = [], [], Counter()
    readings_in = 0
    bad_files: list[tuple[str, str]] = []

    for path in files:
        key = str(path.relative_to(data_dir)).replace("\\", "/")
        try:
            envelopes = parse_file(path.read_bytes(), key=key)
        except (ParseError, UnknownFormat) as exc:
            bad_files.append((key, type(exc).__name__))
            counts["unparseable"] += 1
            continue

        for env in envelopes:
            readings_in += len(env.readings)
            r, x, c = process_envelope(env, tag_map, source_file=key)
            rows.extend(r); rejects.extend(x); counts.update(c)

    # ── reconciliation ────────────────────────────────────────────────────
    print("=" * 78)
    print("INGEST")
    print("=" * 78)
    print(f"  files                {len(files):>10,}")
    print(f"  unparseable          {len(bad_files):>10,}")
    print(f"  readings parsed      {readings_in:>10,}")
    print(f"  rows to insert       {len(rows):>10,}")
    for reason, n in counts.most_common():
        if reason != "unparseable":
            print(f"    dropped {reason:<20} {n:>8,}")
    ok = reconcile(readings_in, len(rows), counts)
    print(f"  reconciled           {'OK' if ok else 'FAILED':>10}")
    for key, err in bad_files:
        print(f"    ! {err}: {key}")

    if not rows:
        return 1

    # ── what the dashboard queries ────────────────────────────────────────
    latest: dict[str, object] = {}
    for r in rows:
        cur = latest.get(r.sensor_id)
        if cur is None or r.ts > cur.ts:            # type: ignore[union-attr]
            latest[r.sensor_id] = r

    by_sensor = {e.sensor_id: e for e in tag_map.values()}
    kpi = Counter(r.status for r in latest.values())        # type: ignore[union-attr]

    print()
    print("=" * 78)
    print("DASHBOARD")
    print("=" * 78)
    print(f"\n  KPI  sensors {len(latest)}   normal {kpi['normal']}   "
          f"warning {kpi['warning']}   critical {kpi['critical']}")

    print("\n  ALERTS")
    alerts = sorted(
        (r for r in latest.values() if r.status != "normal"),   # type: ignore[union-attr]
        key=lambda r: (r.status != "critical", r.sensor_id))
    for a in alerts[:8]:
        e = by_sensor[a.sensor_id]
        band = resolve_band(e.parameter, e.stage)
        print(f"    {a.status.upper():9} {e.tag:10} {a.value:9.2f} {e.unit:6} "
              f"limit {band[1]:<6} {e.stage:10} {e.location}")
    if not alerts:
        print("    none")

    # The point of stage-aware limits, in three lines.
    print("\n  SAME PARAMETER, DIFFERENT STAGE")
    seen: dict[str, bool] = {}
    for e in tag_map.values():
        if e.parameter != "turbidity" or e.stage in seen:
            continue
        r = latest.get(e.sensor_id)
        if r is None:
            continue
        seen[e.stage] = True
        band = resolve_band(e.parameter, e.stage)
        print(f"    {e.tag:10} {r.value:8.2f} NTU   stage {e.stage:10} "
              f"limit {band[1]:<5} -> {r.status}")

    print("\n  COVERAGE")
    per_day: defaultdict[str, int] = defaultdict(int)
    for r in rows:
        per_day[r.ts.strftime("%Y-%m-%d")] += 1
    days = sorted(per_day)
    print(f"    {days[0]} -> {days[-1]}   {len(days)} days   "
          f"{len(rows) / len(days):,.0f} rows/day avg")
    thin = min(per_day.items(), key=lambda kv: kv[1])
    print(f"    thinnest day {thin[0]}  {thin[1]:,} rows")
    print()
    return 0 if ok else 2


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(64)
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
