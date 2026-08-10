#!/usr/bin/env python
"""Create the schema and seed reference data.

    set DATABASE_URL=postgresql://user:pass@localhost:5432/MWTS
    python setup_db.py ../Raw_data_PLC/register-map/tag-map.json

Reference data comes from the register map, which is the only source for what
a tag means. Threshold bands come from thresholds.py so the database and the
pipeline cannot disagree — two copies of a limit will diverge, and the version
the dashboard uses would stop being the version that raised the alert.

Idempotent: safe to re-run.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path(__file__).parent / "src"))

from mwts_pipeline import registry                                    # noqa: E402
from mwts_pipeline.thresholds import _PLAUSIBLE, _STAGE               # noqa: E402

HERE = Path(__file__).parent


def find_register_map() -> str:
    """Locate Raw_data_PLC/register-map/tag-map.json by walking upwards.

    Hardcoding parent.parent broke the moment this package moved into the
    application repository: the path silently pointed at a directory that does
    not exist, and the failure surfaced as a FileNotFoundError deep in the
    loader rather than as "the default guess was wrong".

    Searching upward survives the layout changing again, and the data folder
    deliberately lives outside the repository.
    """
    here = Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        candidate = parent / "Raw_data_PLC" / "register-map" / "tag-map.json"
        if candidate.exists():
            return str(candidate)
    raise SystemExit(
        "cannot find Raw_data_PLC/register-map/tag-map.json in any parent "
        "directory. Pass the path explicitly as the second argument.")

# Plant names are not in the register map — the map knows tags, not sites.
# In production these come from the client; here they mirror the prototype.
PLANT_NAMES = {
    "WTP-01": ("Chennai WTP-01", "South"),
    "WTP-02": ("Mumbai WTP-02", "West"),
    "WTP-03": ("Delhi WTP-03", "North"),
    "WTP-04": ("Bangalore WTP-04", "South"),
    "WTP-05": ("Hyderabad WTP-05", "South"),
    "WTP-06": ("Pune WTP-06", "West"),
}


def run_sql_file(conn, path: Path) -> None:
    sql = path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print(f"  applied {path.name}")


def seed(conn, tag_map_path: str) -> None:
    tag_map = registry.load(tag_map_path)

    plants = sorted({e.plant_code for e in tag_map.values()})
    with conn.cursor() as cur:
        cur.executemany("""
            INSERT INTO plants (plant_code, name, region, poll_seconds)
            VALUES (%s, %s, %s, 3600)
            ON CONFLICT (plant_code) DO UPDATE
              SET name = EXCLUDED.name, region = EXCLUDED.region
        """, [(p, *PLANT_NAMES.get(p, (p, None))) for p in plants])

        # Gateway id follows the generator's convention; in production it comes
        # from the `gw` field of the first file seen for that plant.
        cur.executemany("""
            INSERT INTO gateways (gateway_id, plant_code, model,
                                  count_low, count_high, quality_family, sends_scaled)
            VALUES (%s, %s, %s, %s, %s, 'DA', false)
            ON CONFLICT (gateway_id) DO NOTHING
        """, [(f"GW-{4471 + int(p.split('-')[1])}-P{p.split('-')[1]}", p,
               'UNCONFIRMED', 5530, 27648) for p in plants])

        cur.executemany("""
            INSERT INTO sensors (sensor_id, plant_code, tag, parameter, unit,
                                 location, stage, data_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (sensor_id) DO UPDATE
              SET parameter = EXCLUDED.parameter, unit = EXCLUDED.unit,
                  location  = EXCLUDED.location,  stage = EXCLUDED.stage,
                  data_type = EXCLUDED.data_type
        """, [(e.sensor_id, e.plant_code, e.tag, e.parameter, e.unit,
               e.location, e.stage, e.data_type) for e in tag_map.values()])

        # Version 1 of the register map. A corrected span later closes this row
        # (valid_to = now()) and opens a new one, rather than overwriting it.
        cur.executemany("""
            INSERT INTO tag_map (tag, plant_code, sensor_id, span_low, span_high,
                                 count_low, count_high, data_type, valid_from, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, '-infinity', %s)
            ON CONFLICT (tag, plant_code, valid_from) DO UPDATE
              SET span_low = EXCLUDED.span_low, span_high = EXCLUDED.span_high,
                  data_type = EXCLUDED.data_type
        """, [(e.tag, e.plant_code, e.sensor_id, e.span_low, e.span_high,
               e.count_low, e.count_high, e.data_type,
               'ASSUMED — reversed from prototype, not confirmed with the plant')
              for e in tag_map.values()])

        # Bands, from thresholds.py. Single source of truth.
        bands = []
        stages = ("raw", "treatment", "filtered", "final")
        for param, plausible in _PLAUSIBLE.items():
            for stage in stages:
                b = _STAGE.get((param, stage), plausible)
                src = ("stage override" if (param, stage) in _STAGE
                       else "parameter plausibility band")
                bands.append((param, stage, *b, src))
        cur.executemany("""
            INSERT INTO threshold_bands
                (parameter, stage, warn_min, warn_max, crit_min, crit_max, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (parameter, stage) DO UPDATE
              SET warn_min = EXCLUDED.warn_min, warn_max = EXCLUDED.warn_max,
                  crit_min = EXCLUDED.crit_min, crit_max = EXCLUDED.crit_max
        """, bands)

    conn.commit()

    with conn.cursor() as cur:
        for t in ("plants", "gateways", "sensors", "tag_map", "threshold_bands"):
            cur.execute(f"SELECT count(*) FROM {t}")
            print(f"  {t:<18} {cur.fetchone()[0]:>6,}")


def main() -> int:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL is not set.")
        return 64
    tag_map_path = sys.argv[1] if len(sys.argv) > 1 else find_register_map()

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT extname FROM pg_extension WHERE extname='timescaledb'")
            timescale = cur.fetchone() is not None
        if not timescale:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM pg_available_extensions "
                            "WHERE name='timescaledb'")
                timescale = cur.fetchone() is not None

        print("SCHEMA")
        run_sql_file(conn, HERE / "schema" / "001_schema.sql")
        part2 = "002_timescaledb.sql" if timescale else "002_plain_postgres.sql"
        run_sql_file(conn, HERE / "schema" / part2)

        print("\nSEED")
        seed(conn, tag_map_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
