#!/usr/bin/env python
"""Create the lab parameters a plant records by hand.

    python add_lab_params.py --plant WTP-01

These have no tag, no gateway and no instrument span, because nobody installs
an inline COD analyser. They are still sensors as far as the rest of the system
is concerned: a plant, a parameter, a unit and a stage is everything a chart or
an alarm needs.

Marked manual_entry, so the freshness logic does not mark a daily sample
"offline" three hours after it was taken.
"""
from __future__ import annotations

import argparse
import os
import sys
import uuid
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path(__file__).parent / "src"))

# parameter, unit, where the sample is drawn, treatment stage
LAB = [
    ("COD",        "mg/L",        "Raw Water Intake",     "raw"),
    ("BOD",        "mg/L",        "Raw Water Intake",     "raw"),
    ("TSS",        "mg/L",        "Raw Water Intake",     "raw"),
    ("COD",        "mg/L",        "Outlet Chamber",       "final"),
    ("BOD",        "mg/L",        "Outlet Chamber",       "final"),
    ("TSS",        "mg/L",        "Outlet Chamber",       "final"),
    # Regulatory parameters on finished water. Coliform is the one a utility
    # is judged on, and it is always a laboratory result.
    ("coliform",   "CFU/100mL",   "Clear Water Tank",     "final"),
    ("iron",       "mg/L",        "Clear Water Tank",     "final"),
    ("manganese",  "mg/L",        "Clear Water Tank",     "final"),
    ("fluoride",   "mg/L",        "Clear Water Tank",     "final"),
    ("nitrate",    "mg/L",        "Clear Water Tank",     "final"),
    ("hardness",   "mg/L",        "Clear Water Tank",     "final"),
    ("alkalinity", "mg/L",        "Flash Mixer",          "treatment"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plant", default="WTP-01")
    args = ap.parse_args()

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL is not set.")
        return 64

    added = 0
    with psycopg.connect(dsn, autocommit=True) as conn, conn.cursor() as cur:
        cur.execute("SELECT 1 FROM plants WHERE plant_code = %s", (args.plant,))
        if cur.fetchone() is None:
            print(f"no such plant: {args.plant}")
            return 1

        for parameter, unit, location, stage in LAB:
            # LAB- prefix, so a lab result is distinguishable from an
            # instrument tag at a glance in any table or export.
            tag = f"LAB-{parameter.upper()}-{stage[:3].upper()}"
            sensor_id = f"{args.plant.lower()}-lab-{uuid.uuid5(uuid.NAMESPACE_DNS, tag + args.plant).hex[:8]}"
            cur.execute("""
                INSERT INTO sensors (sensor_id, plant_code, tag, parameter, unit,
                                     location, stage, data_type, manual_entry)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'analog', true)
                ON CONFLICT (sensor_id) DO UPDATE
                  SET manual_entry = true, unit = EXCLUDED.unit
                RETURNING (xmax = 0) AS inserted
            """, (sensor_id, args.plant, tag, parameter, unit, location, stage))
            if cur.fetchone()[0]:
                added += 1

    print(f"  {args.plant}: {added} lab parameters added ({len(LAB)} defined)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
