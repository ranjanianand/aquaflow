"""Read-only API over the readings database.

    set DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/MWTS
    uvicorn api.main:app --reload --port 8000 --host 0.0.0.0

Bind 0.0.0.0, and prefer 127.0.0.1 over "localhost" in every URL. On Windows
"localhost" resolves to ::1 first; a server bound only to IPv4 leaves each
request stalling ~2 seconds before the client falls back. It looks exactly
like a slow database and is not one.

Returns exactly the shapes `src/types/index.ts` already declares, so the
dashboard's components need no changes — only their data source does.

Read-only by design. There is no write path back to the plant, and an endpoint
that looks like one would invite a command that silently never arrives.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any

import psycopg
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row

DSN = os.environ.get("DATABASE_URL", "")

# One connection per request.
#
# psycopg_pool is the right answer in production — Postgres forks a backend
# process per connection at ~9 MB each, so an unpooled API exhausts the server
# long before it exhausts CPU. But its background maintenance threads deadlock
# on Windows: the pool neither opens nor closes, and uvicorn hangs on startup.
#
# At development scale a connect per request costs ~2 ms and is entirely
# reliable. Restore the pool when this is deployed to Linux, which is the only
# place it needs to hold a real connection count.
@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DSN:
        raise RuntimeError("DATABASE_URL is not set")
    with psycopg.connect(DSN, connect_timeout=5) as c, c.cursor() as cur:
        cur.execute("SELECT 1")          # fail at startup, not on first request
    yield


app = FastAPI(title="MWTS readings API", version="0.1.0", lifespan=lifespan)

# Origins come from the environment so a deploy does not need a code change.
#
#   CORS_ORIGINS=https://aquaflow.up.railway.app
#
# Comma-separated. Defaults to local development only — the safe direction to
# fail, since a missing variable then blocks a deployed frontend loudly rather
# than quietly serving the database to any origin that asks.
_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Database parameter names -> the union in src/types/index.ts. A parameter with
# no entry here is dropped rather than guessed: an unrecognised type would
# render as an empty card with no indication anything is wrong.
SENSOR_TYPE = {
    "pH": "pH", "flow": "flow", "pressure": "pressure",
    "temperature": "temperature", "turbidity": "turbidity",
    "chlorine": "chlorine", "DO": "DO", "level": "level",
    "conductivity": "conductivity", "ORP": "ORP",
}

# Which readings matter most when several alarm at once. Turbidity and chlorine
# are the regulatory control points on treated water; a level sensor is not.
PRIORITY = {
    "turbidity": "critical", "chlorine": "critical", "pH": "high",
    "conductivity": "high", "flow": "medium", "pressure": "medium",
    "DO": "medium", "ORP": "medium", "temperature": "low", "level": "low",
}

PLANT_META = {
    "WTP-01": ("Chennai, Tamil Nadu", 13.0827, 80.2707),
    "WTP-02": ("Mumbai, Maharashtra", 19.0760, 72.8777),
    "WTP-03": ("New Delhi", 28.6139, 77.2090),
    "WTP-04": ("Bengaluru, Karnataka", 12.9716, 77.5946),
    "WTP-05": ("Hyderabad, Telangana", 17.3850, 78.4867),
    "WTP-06": ("Pune, Maharashtra", 18.5204, 73.8567),
}


def q(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    """Run a query and return dict rows.

    Passes None rather than an empty tuple when there are no parameters.
    psycopg only scans for placeholders when params is not None, and a query
    containing a LIKE pattern such as '%outlet%' otherwise fails with
    "only '%s', '%b', '%t' are allowed as placeholders". Escaping every literal
    percent to %% works too, but it is easy to forget and fails at runtime
    rather than at import.
    """
    with psycopg.connect(DSN, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql, params or None)
        return cur.fetchall()


def plant_id(code: str) -> str:
    """'WTP-01' -> 'plant-1'. The dashboard's ids predate the plant codes."""
    return f"plant-{int(code.split('-')[1])}"


def plant_code(pid: str) -> str:
    return f"WTP-{int(pid.split('-')[-1]):02d}"


def comm_status(age_seconds: int | None, poll_seconds: int) -> str:
    """online / stale / offline, judged against the plant's own poll rate.

    Hardcoding 30 and 60 seconds — as the prototype did — marks every sensor
    offline the moment data arrives hourly instead of by live session. The
    thresholds have to come from how often the plant actually publishes.
    """
    if age_seconds is None:
        return "offline"
    if age_seconds <= poll_seconds * 1.5:
        return "online"
    if age_seconds <= poll_seconds * 3:
        return "stale"
    return "offline"


@app.get("/health")
def health() -> dict:
    rows = q("SELECT count(*) AS n FROM readings")
    return {"ok": True, "readings": rows[0]["n"]}


@app.get("/plants")
def plants() -> list[dict]:
    rows = q("""
        SELECT p.plant_code, p.name, p.region, p.poll_seconds,
               count(s.sensor_id)                             AS sensor_count,
               max(l.ts)                                      AS last_updated,
               count(*) FILTER (WHERE l.status = 'critical')  AS n_critical,
               count(*) FILTER (WHERE l.status = 'warning')   AS n_warning
        FROM plants p
        LEFT JOIN sensors s USING (plant_code)
        LEFT JOIN latest_readings l USING (sensor_id)
        GROUP BY p.plant_code, p.name, p.region, p.poll_seconds
        ORDER BY p.plant_code
    """)
    now = datetime.now(timezone.utc)
    out = []
    for r in rows:
        loc, lat, lng = PLANT_META.get(r["plant_code"], ("", None, None))
        last = r["last_updated"]
        age = (now - last).total_seconds() if last else None

        # A plant with no recent data is offline regardless of what its last
        # readings said. Reporting "online" from stale rows is the failure
        # mode that makes a monitoring screen worse than none.
        if age is None or age > r["poll_seconds"] * 3:
            status = "offline"
        elif r["n_critical"] or r["n_warning"]:
            status = "warning"
        else:
            status = "online"

        out.append({
            "id": plant_id(r["plant_code"]),
            "name": r["name"],
            "location": loc,
            "region": r["region"] or "",
            "status": status,
            "sensorCount": r["sensor_count"],
            "lastUpdated": last.isoformat() if last else None,
            "coordinates": {"lat": lat, "lng": lng} if lat else None,
        })
    return out


@app.get("/sensors")
def all_sensors() -> list[dict]:
    """Every configured sensor, across all plants.

    No history — the fleet views that need this render counts and status, not
    sparklines, and 250 sensors x 25 points is payload nobody draws.

    Sensors at plants with no readings yet still appear, with a null value and
    commStatus 'offline'. Omitting them would understate how much of the estate
    is configured but not reporting, which is the number a fleet view exists
    to show.
    """
    rows = q("""
        SELECT s.sensor_id, s.plant_code, s.tag, s.parameter, s.unit,
               s.location, s.stage, l.ts, l.value, l.status, l.quality,
               b.warn_min, b.warn_max, b.crit_min, b.crit_max, p.poll_seconds
        FROM sensors s
        JOIN plants p USING (plant_code)
        LEFT JOIN latest_readings l USING (sensor_id)
        LEFT JOIN threshold_bands b
               ON b.parameter = s.parameter AND b.stage = s.stage
        ORDER BY s.plant_code, s.tag
    """)
    now = datetime.now(timezone.utc)
    out = []
    for r in rows:
        stype = SENSOR_TYPE.get(r["parameter"])
        if stype is None:
            continue
        age = int((now - r["ts"]).total_seconds()) if r["ts"] else None
        out.append({
            "id": r["sensor_id"],
            "plantId": plant_id(r["plant_code"]),
            "name": f"{r['parameter']} - {r['location']}",
            "type": stype,
            "unit": r["unit"],
            "currentValue": round(r["value"], 4) if r["value"] is not None else 0,
            "minThreshold": r["warn_min"] if r["warn_min"] is not None else 0.0,
            "maxThreshold": r["warn_max"] if r["warn_max"] is not None else 0.0,
            "critMin": r["crit_min"],
            "critMax": r["crit_max"],
            "status": r["status"] or "normal",
            "commStatus": comm_status(age, r["poll_seconds"]),
            "lastUpdated": r["ts"].isoformat() if r["ts"] else None,
            "history": [],
            "priority": PRIORITY.get(r["parameter"], "medium"),
            "location": r["location"],
            "tag": r["tag"],
            "dataSource": "file",
            "stage": r["stage"],
        })
    return out


@app.get("/plants/{pid}/sensors")
def plant_sensors(pid: str, history_hours: int = Query(24, ge=0, le=168)) -> list[dict]:
    """Every sensor at a plant, with enough recent history to draw a sparkline.

    History is fetched in ONE query for all sensors rather than per sensor.
    Fifty-two round trips to render one screen is the difference between a
    page that loads and one that feels broken.
    """
    code = plant_code(pid)
    rows = q("""
        SELECT s.sensor_id, s.tag, s.parameter, s.unit, s.location, s.stage,
               l.ts, l.value, l.status, l.quality,
               b.warn_min, b.warn_max, b.crit_min, b.crit_max,
               p.poll_seconds
        FROM sensors s
        JOIN plants p USING (plant_code)
        LEFT JOIN latest_readings l USING (sensor_id)
        LEFT JOIN threshold_bands b
               ON b.parameter = s.parameter AND b.stage = s.stage
        WHERE s.plant_code = %s
        ORDER BY s.tag
    """, (code,))
    if not rows:
        raise HTTPException(404, f"no sensors for {pid}")

    history: dict[str, list[dict]] = {}
    if history_hours:
        # Anchor the window to the newest reading this plant has, not to the
        # wall clock. These are two different questions: "is this sensor
        # reporting right now" (commStatus, below, which stays clock-based and
        # will say offline) versus "show me its last 24 hours of data". Using
        # now() for both leaves every chart empty whenever ingestion is behind,
        # which is exactly when someone needs to look at the history.
        newest = max((r["ts"] for r in rows if r["ts"]), default=None)
        since = (newest or datetime.now(timezone.utc)) - timedelta(hours=history_hours)
        # The hourly rollup, not the raw table. Same shape, a fraction of the
        # rows, and it is what the aggregate exists for.
        for h in q("""
            SELECT r.sensor_id, r.bucket, r.avg_value
            FROM readings_hourly r
            JOIN sensors s USING (sensor_id)
            WHERE s.plant_code = %s AND r.bucket >= %s
            ORDER BY r.sensor_id, r.bucket
        """, (code, since)):
            history.setdefault(h["sensor_id"], []).append({
                "timestamp": h["bucket"].isoformat(),
                "value": round(h["avg_value"], 4) if h["avg_value"] is not None else None,
            })

    now = datetime.now(timezone.utc)
    out = []
    for r in rows:
        stype = SENSOR_TYPE.get(r["parameter"])
        if stype is None:
            continue

        age = int((now - r["ts"]).total_seconds()) if r["ts"] else None
        warn_min = r["warn_min"] if r["warn_min"] is not None else 0.0
        warn_max = r["warn_max"] if r["warn_max"] is not None else 0.0

        out.append({
            "id": r["sensor_id"],
            "plantId": pid,
            "name": f"{r['parameter']} - {r['location']}",
            "type": stype,
            "unit": r["unit"],
            "currentValue": round(r["value"], 4) if r["value"] is not None else 0,
            "minThreshold": warn_min,
            "maxThreshold": warn_max,
            "critMin": r["crit_min"],
            "critMax": r["crit_max"],
            "status": r["status"] or "normal",
            "commStatus": comm_status(age, r["poll_seconds"]),
            "lastUpdated": r["ts"].isoformat() if r["ts"] else None,
            "history": history.get(r["sensor_id"], []),
            "priority": PRIORITY.get(r["parameter"], "medium"),
            "location": r["location"],
            "tag": r["tag"],
            # Every reading here came from a gateway file, never a live
            # session. The dashboard shows this so a stale value is not read
            # as a real-time one.
            "dataSource": "file",
            "stage": r["stage"],
            "quality": ("good" if r["quality"] is None or r["quality"] >= 192
                        else "uncertain" if r["quality"] >= 64 else "bad"),
        })
    return out


@app.get("/sensors/{sensor_id}/history")
def sensor_history(
    sensor_id: str,
    hours: int = Query(24, ge=1, le=8760),
    resolution: str = Query("auto", pattern="^(auto|raw|hourly|daily)$"),
) -> dict:
    """Trend data, downsampled to something a chart can actually draw.

    Ninety days of hourly readings is 2,160 points for one sensor. A browser
    will render that and the user will see a smear. `auto` picks the rollup
    that keeps the series near 300 points.
    """
    if resolution == "auto":
        resolution = "raw" if hours <= 48 else "hourly" if hours <= 24 * 45 else "daily"

    # Anchored to this sensor's newest reading, not the wall clock.
    #
    # With ingestion three days behind, a now()-relative 24-hour window is
    # empty — so a chart reported "no data" while the KPI strip beside it
    # showed a current value from the same sensor. Whether a sensor is
    # reporting *now* is commStatus's job; a history window should return the
    # most recent history that exists.
    newest = q("SELECT max(ts) AS t FROM readings WHERE sensor_id = %s",
               (sensor_id,))[0]["t"]
    if newest is None:
        return {"sensorId": sensor_id, "resolution": resolution, "points": []}
    since = newest - timedelta(hours=hours)
    if resolution == "raw":
        rows = q("""SELECT ts AS bucket, value AS avg_value,
                           value AS min_value, value AS max_value
                    FROM readings WHERE sensor_id = %s AND ts >= %s
                    ORDER BY ts""", (sensor_id, since))
    else:
        table = "readings_hourly" if resolution == "hourly" else "readings_daily"
        rows = q(f"""SELECT bucket, avg_value, min_value, max_value
                     FROM {table} WHERE sensor_id = %s AND bucket >= %s
                     ORDER BY bucket""", (sensor_id, since))

    return {
        "sensorId": sensor_id,
        "resolution": resolution,
        "points": [{
            "timestamp": r["bucket"].isoformat(),
            "value": round(r["avg_value"], 4) if r["avg_value"] is not None else None,
            # min/max let the chart draw a band. An average alone hides the
            # excursion the operator opened the chart to find.
            "min": round(r["min_value"], 4) if r["min_value"] is not None else None,
            "max": round(r["max_value"], 4) if r["max_value"] is not None else None,
        } for r in rows],
    }


@app.get("/alerts")
def alerts(limit: int = Query(50, ge=1, le=500)) -> list[dict]:
    """Sensors currently outside their band, worst first.

    Derived from current state rather than the alerts table, which is not
    populated yet. Swap the source once alarm events are being written; the
    shape does not change.
    """
    rows = q("""
        SELECT s.sensor_id, s.plant_code, s.tag, s.parameter, s.unit,
               s.location, s.stage, l.ts, l.value, l.status, p.name AS plant_name,
               b.warn_min, b.warn_max, b.crit_min, b.crit_max
        FROM latest_readings l
        JOIN sensors s USING (sensor_id)
        JOIN plants  p USING (plant_code)
        LEFT JOIN threshold_bands b
               ON b.parameter = s.parameter AND b.stage = s.stage
        WHERE l.status <> 'normal'
        ORDER BY (l.status = 'critical') DESC, s.tag
        LIMIT %s
    """, (limit,))
    out = []
    for r in rows:
        high = r["warn_max"] is not None and r["value"] > r["warn_max"]
        limit_val = (r["warn_max"] if high else r["warn_min"])
        out.append({
            "id": f"alert-{r['sensor_id']}",
            "plantId": plant_id(r["plant_code"]),
            # The banner shows this to an operator. "plant-1" is an internal
            # key; "Chennai WTP-01" is the thing on the wall.
            "plantName": r["plant_name"],
            "sensorId": r["sensor_id"],
            "sensorName": f"{r['parameter']} - {r['location']}",
            "tag": r["tag"],
            "severity": "critical" if r["status"] == "critical" else "warning",
            "status": "active",
            # States the limit, not just the reading. "0.94 NTU" is not
            # actionable; "0.94 NTU against a limit of 0.3" is.
            "message": (f"{r['parameter']} {'above' if high else 'below'} "
                        f"{limit_val} {r['unit']} at {r['location']}"),
            "value": round(r["value"], 4) if r["value"] is not None else None,
            "limit": limit_val,
            "unit": r["unit"],
            "stage": r["stage"],
            "timestamp": r["ts"].isoformat() if r["ts"] else None,
        })
    return out


@app.get("/alerts/trend")
def alerts_trend(days: int = Query(7, ge=1, le=90)) -> list[dict]:
    """Breaches per day, from the hourly rollup.

    Real counts, not a shape. The continuous aggregate already stores
    n_critical and n_warning per bucket, so this is a cheap read rather than a
    scan of the readings table.

    Anchored to the newest bucket rather than now(): with ingestion two days
    behind, a now()-relative window returns an empty chart precisely when
    someone is looking for what happened.
    """
    newest = q("SELECT max(bucket) AS b FROM readings_hourly")[0]["b"]
    if newest is None:
        return []
    since = newest - timedelta(days=days)
    rows = q("""
        SELECT date_trunc('day', bucket)      AS day,
               sum(n_critical)::int           AS critical,
               sum(n_warning)::int            AS warning,
               count(DISTINCT sensor_id)::int AS sensors
        FROM readings_hourly
        WHERE bucket >= %s
        GROUP BY date_trunc('day', bucket)
        ORDER BY day
    """, (since,))
    return [{
        "date": r["day"].date().isoformat(),
        "critical": r["critical"] or 0,
        "warning": r["warning"] or 0,
        "alerts": (r["critical"] or 0) + (r["warning"] or 0),
        "sensors": r["sensors"],
    } for r in rows]


@app.get("/alerts/hourly")
def alerts_hourly(hours: int = Query(24, ge=1, le=168)) -> list[dict]:
    """Breaches per hour over the most recent window of data.

    Anchored to the newest bucket, not now(): with ingestion behind, a
    clock-relative window is empty and the chart reads as "no alarms" rather
    than "no recent data".
    """
    newest = q("SELECT max(bucket) AS b FROM readings_hourly")[0]["b"]
    if newest is None:
        return []
    since = newest - timedelta(hours=hours - 1)
    rows = q("""
        SELECT bucket,
               sum(n_critical)::int AS critical,
               sum(n_warning)::int  AS warning
        FROM readings_hourly
        WHERE bucket >= %s
        GROUP BY bucket ORDER BY bucket
    """, (since,))
    return [{
        "hour": r["bucket"].strftime("%H:00"),
        "timestamp": r["bucket"].isoformat(),
        "high": r["critical"] or 0,
        "medium": r["warning"] or 0,
        # No informational tier exists: alarms are derived from threshold
        # breaches, and an "info" alert would come from operator annotation.
        "low": 0,
        "total": (r["critical"] or 0) + (r["warning"] or 0),
    } for r in rows]


@app.get("/kpis/quality")
def kpis_quality(hours: int = Query(24, ge=1, le=168)) -> dict:
    """Compliance: the share of readings inside their alarm band.

    A defensible Water Quality Index needs a definition — which parameters,
    what weighting, whose standard. This is not that. It is the plainer
    statement "what proportion of readings were within limits", which is
    computable from what we hold and means exactly what it says.

    Restricted to the parameters a regulator actually cares about on treated
    water. Including tank level would let a full tank offset a turbidity
    breach, which is nonsense.
    """
    rows = q("""
        SELECT count(*)                                     AS total,
               count(*) FILTER (WHERE r.status = 'normal')  AS ok
        FROM readings r
        JOIN sensors s USING (sensor_id)
        WHERE s.parameter IN ('turbidity','pH','chlorine','conductivity')
          AND r.ts > (SELECT max(ts) FROM readings) - make_interval(hours => %s)
    """, (hours,))
    t, ok = rows[0]["total"], rows[0]["ok"]
    return {
        "compliancePct": round(100.0 * ok / t, 1) if t else None,
        "readings": t,
        "inRange": ok,
        "parameters": ["turbidity", "pH", "chlorine", "conductivity"],
    }


@app.get("/kpis/live")
def kpis_live() -> dict:
    """Plant-floor KPI strip: current average per parameter, across the estate.

    Averages only sensors that are actually reporting. Including silent ones as
    zero would drag every figure toward nothing and read as a process problem
    rather than a communications one.
    """
    rows = q("""
        SELECT s.parameter,
               avg(l.value)                                   AS avg_value,
               count(*)                                       AS n,
               count(*) FILTER (WHERE l.status <> 'normal')   AS n_bad,
               max(s.unit)                                    AS unit
        FROM latest_readings l
        JOIN sensors s USING (sensor_id)
        WHERE l.value IS NOT NULL
        GROUP BY s.parameter
    """)
    return {
        r["parameter"]: {
            "value": round(r["avg_value"], 2),
            "unit": r["unit"],
            "sensors": r["n"],
            # Drives the strip's amber/red state. A parameter with any sensor
            # out of band should not read as normal just because the mean is.
            "status": "warning" if r["n_bad"] else "normal",
        }
        for r in rows
    }


@app.get("/kpis")
def kpis() -> dict:
    p = q("""SELECT count(*) AS total,
                    count(*) FILTER (WHERE ok) AS online
             FROM (SELECT p.plant_code,
                          max(l.ts) > now() - make_interval(secs => p.poll_seconds * 3) AS ok
                   FROM plants p
                   LEFT JOIN sensors s USING (plant_code)
                   LEFT JOIN latest_readings l USING (sensor_id)
                   GROUP BY p.plant_code, p.poll_seconds) x""")[0]
    s = q("""SELECT count(*) AS total,
                    count(*) FILTER (WHERE status = 'critical') AS critical,
                    count(*) FILTER (WHERE status = 'warning')  AS warning
             FROM latest_readings""")[0]
    # The last run that actually loaded something. A re-run over already-
    # ingested files correctly loads zero rows, and reporting that as the
    # latest ingest reads as "nothing is arriving" when the truth is
    # "nothing new was there".
    # Volume treated, integrated from ONE flow meter.
    #
    # Deliberately not a sum. Final-stage flow meters sit in series — at this
    # plant a chlorine contact tank feeds an outlet chamber — so adding them
    # counts the same water twice. The first version of this did exactly that
    # and reported 17,479 m3 where the plant treated about 8,650.
    #
    # The most downstream meter carries the full treated flow, so one sensor is
    # the whole answer. Preference order: an explicitly named outlet, then any
    # final-stage meter.
    #
    # Hourly averages in m3/h summed over 24 buckets give m3, because each
    # bucket is one hour of flow.
    vol = q("""
        WITH outlet AS (
            SELECT s.sensor_id, s.tag
            FROM sensors s
            WHERE s.parameter = 'flow' AND s.stage = 'final'
            ORDER BY (s.location ILIKE '%outlet%'
                   OR s.location ILIKE '%distribution%'
                   OR s.location ILIKE '%dispatch%') DESC,
                     s.tag
            LIMIT 1
        )
        SELECT o.tag, sum(h.avg_value) AS m3
        FROM outlet o
        JOIN readings_hourly h ON h.sensor_id = o.sensor_id
        WHERE h.bucket > (SELECT max(bucket) FROM readings_hourly)
                         - INTERVAL '24 hours'
        GROUP BY o.tag
    """)
    volume = vol[0]["m3"] if vol and vol[0]["m3"] is not None else None
    volume_tag = vol[0]["tag"] if vol else None

    ing = q("""SELECT readings_out, finished_at, reconciled
               FROM ingest_runs
               WHERE finished_at IS NOT NULL AND readings_out > 0
               ORDER BY finished_at DESC LIMIT 1""")
    return {
        "plantsTotal": p["total"], "plantsOnline": p["online"],
        "sensorsTotal": s["total"],
        # None means no outlet flow meter is mapped, not zero flow. The
        # dashboard shows "no source" for null and a figure for a number, so
        # the tile lights up on its own the day such a tag appears in the
        # register map — no code change needed.
        "volume24h": round(volume) if volume is not None else None,
        # Which meter it came from. A volume with no stated source cannot be
        # checked, and this one is a judgement about plant layout rather than
        # a direct reading.
        "volumeSource": volume_tag,
        "alertsCritical": s["critical"], "alertsWarning": s["warning"],
        # Surfaced deliberately: a dashboard that cannot say when it last
        # received data is asking to be trusted without evidence.
        "lastIngest": ing[0]["finished_at"].isoformat() if ing else None,
        "lastIngestRows": ing[0]["readings_out"] if ing else 0,
        "lastIngestReconciled": ing[0]["reconciled"] if ing else None,
    }
