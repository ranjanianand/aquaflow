#!/usr/bin/env python
"""Query the database the way the dashboard will.

    set DATABASE_URL=postgresql://user:pass@localhost:5432/MWTS
    python verify.py

Every query here is one an API endpoint would run. If these are fast and
correct, the dashboard is a rendering problem rather than a data problem.
"""
from __future__ import annotations

import os
import sys
import time

import psycopg

QUERIES: list[tuple[str, str]] = [
    ("Row counts", """
        SELECT 'readings' AS what, count(*) AS n FROM readings
        UNION ALL SELECT 'rejected', count(*) FROM rejected_readings
        UNION ALL SELECT 'files',    count(*) FROM processed_files
        UNION ALL SELECT 'sensors',  count(*) FROM sensors
        ORDER BY 1
    """),

    ("Reconciliation (last run)", """
        SELECT files_seen, readings_in, readings_out,
               readings_in - readings_out AS dropped, reconciled
        FROM ingest_runs ORDER BY started_at DESC LIMIT 1
    """),

    ("Why readings were dropped", """
        SELECT reason, count(*) AS n
        FROM rejected_readings GROUP BY reason ORDER BY n DESC
    """),

    # The dashboard's most frequent query. Hits a 250-row table, not history.
    ("KPI strip -- status of every sensor now", """
        SELECT status, count(*) AS sensors
        FROM latest_readings GROUP BY status ORDER BY 1
    """),

    # Ranked by severity, with the limit shown. "4.80 NTU" alone is not
    # actionable; "4.80 NTU (limit 0.3)" is.
    ("Alerts panel", """
        SELECT tag, round(value::numeric, 2) AS value, unit,
               stage, warn_max AS limit_val, status, location
        FROM sensor_current
        WHERE status <> 'normal'
        ORDER BY (status = 'critical') DESC, tag
        LIMIT 10
    """),

    # The point of stage-aware limits: near-identical values, opposite verdicts.
    ("Same parameter, different stage", """
        SELECT DISTINCT ON (stage)
               tag, round(value::numeric, 2) AS value, stage,
               warn_max AS limit_val, status
        FROM sensor_current
        WHERE parameter = 'turbidity' AND value IS NOT NULL
        ORDER BY stage, tag
    """),

    # Chart data. Never raw points -- 90 days at hourly is 2,160 per sensor.
    ("Trend from the continuous aggregate (last 8 hours)", """
        SELECT bucket, round(avg_value::numeric, 2) AS avg,
               round(min_value::numeric, 2) AS min,
               round(max_value::numeric, 2) AS max, n
        FROM readings_hourly
        WHERE sensor_id = (SELECT sensor_id FROM sensors WHERE tag = 'TUR-1003')
        ORDER BY bucket DESC LIMIT 8
    """),

    ("Daily aggregate -- 90 days downsampled to 90 rows", """
        SELECT count(*) AS buckets,
               min(bucket)::date AS from_day, max(bucket)::date AS to_day
        FROM readings_daily
        WHERE sensor_id = (SELECT sensor_id FROM sensors WHERE tag = 'TUR-1003')
    """),

    # A gateway that quietly stops publishing raises nothing. This is how you
    # see it.
    ("Data completeness -- worst 5 days", """
        SELECT plant_code, day::date, polls_received, polls_expected, pct
        FROM plant_completeness ORDER BY pct ASC LIMIT 5
    """),

    ("Provenance -- one reading traced to its source object", """
        SELECT s.tag, r.ts, r.value, r.raw_count, r.quality, r.status,
               r.source_file
        FROM readings r JOIN sensors s USING (sensor_id)
        WHERE s.tag = 'TUR-1003' ORDER BY r.ts DESC LIMIT 3
    """),

    ("Storage -- hypertable size and chunks", """
        SELECT pg_size_pretty(hypertable_size('readings')) AS total,
               (SELECT count(*) FROM show_chunks('readings')) AS chunks,
               (SELECT count(*) FROM timescaledb_information.chunks
                 WHERE hypertable_name = 'readings' AND is_compressed) AS compressed
    """),

    # Cost per row, which is what actually decides the database sizing.
    ("Bytes per reading", """
        SELECT count(*) AS rows,
               pg_size_pretty(hypertable_size('readings')) AS on_disk,
               round(hypertable_size('readings')::numeric / count(*), 0) AS bytes_per_row,
               pg_size_pretty((hypertable_size('readings')::numeric / count(*)
                               * 95000000)::bigint) AS projected_10_plants_1yr
        FROM readings
    """),
]


def main() -> int:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL is not set.")
        return 64

    with psycopg.connect(dsn) as conn, conn.cursor() as cur:
        for title, sql in QUERIES:
            print("\n" + "-" * 78)
            print(title)
            print("-" * 78)
            t0 = time.perf_counter()
            try:
                cur.execute(sql)
                rows = cur.fetchall()
                ms = (time.perf_counter() - t0) * 1000
            except Exception as exc:                  # noqa: BLE001
                print(f"  ! {type(exc).__name__}: {str(exc).splitlines()[0]}")
                conn.rollback()
                continue

            if not rows:
                print("  (no rows)")
                continue
            cols = [d.name for d in cur.description]
            w = [max(len(c), *(len(str(r[i])) for r in rows))
                 for i, c in enumerate(cols)]
            print("  " + "  ".join(c.ljust(w[i]) for i, c in enumerate(cols)))
            print("  " + "  ".join("-" * x for x in w))
            for r in rows:
                print("  " + "  ".join(str(v).ljust(w[i]) for i, v in enumerate(r)))
            print(f"  [{ms:.1f} ms]")
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
