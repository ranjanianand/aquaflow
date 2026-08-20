#!/usr/bin/env python
"""Manual counterparts for the parameters an instrument already measures.

    python add_grab_samples.py --plant WTP-01

An operator with a handheld meter checks the online probe — a grab sample.
This happens constantly in a real plant: before a calibration, after a service,
and whenever a reading looks wrong.

Those readings must NOT go into the instrument's own tag. Mixing a typed figure
into a probe's history makes the trend untrustworthy and, worse, hides the very
thing the grab sample was taken to find.

So each gets its own tag alongside the instrument:

    PH-1001        the probe, continuous
    GRAB-PH-RAW    the handheld, occasional

Both measure pH at the same place, which makes the difference between them
meaningful: that difference IS the probe's drift. A grab sample reading 7.4
against a probe reading 6.9 is a calibration due, and neither number alone
would tell you.
"""
from __future__ import annotations

import argparse
import os
import sys
import uuid

import psycopg

# Parameters worth checking by hand, and where. Only ones a handheld meter can
# actually measure — nobody carries a portable conductivity bridge to a filter.
GRAB = [
    ("pH",        "pH",    "Raw Water Intake",  "raw"),
    ("pH",        "pH",    "Clear Water Tank",  "final"),
    ("turbidity", "NTU",   "Clear Water Tank",  "final"),
    ("turbidity", "NTU",   "Sand Filter 1",     "filtered"),
    ("chlorine",  "mg/L",  "Clear Water Tank",  "final"),
    ("temperature", "°C",  "Raw Water Intake",  "raw"),
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
        for parameter, unit, location, stage in GRAB:
            tag = f"GRAB-{parameter.upper()}-{stage[:3].upper()}"
            sid = f"{args.plant.lower()}-grab-" \
                  f"{uuid.uuid5(uuid.NAMESPACE_DNS, tag + args.plant).hex[:8]}"
            cur.execute("""
                INSERT INTO sensors (sensor_id, plant_code, tag, parameter, unit,
                                     location, stage, data_type, manual_entry)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'analog', true)
                ON CONFLICT (sensor_id) DO UPDATE SET manual_entry = true
                RETURNING (xmax = 0) AS inserted
            """, (sid, args.plant, tag, parameter, unit, location, stage))
            if cur.fetchone()[0]:
                added += 1

    print(f"  {args.plant}: {added} grab-sample points added ({len(GRAB)} defined)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
