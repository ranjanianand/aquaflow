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

import sys
from pathlib import Path

import psycopg
from fastapi import Body, FastAPI, File, HTTPException, Query, UploadFile

# The pipeline package sits beside this module in the image.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from mwts_pipeline import registry                                    # noqa: E402
from mwts_pipeline.adapters import ParseError, UnknownFormat, parse_file  # noqa: E402
from mwts_pipeline.models import TagMapEntry                          # noqa: E402
from mwts_pipeline.process import process_envelope                    # noqa: E402
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
    allow_methods=["GET", "POST", "PATCH"],
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
    # Beyond water quality. These arrive from the same gateway in the same
    # payload — they were simply never in the register map before.
    "energy": "energy", "power": "power",
    "run_status": "run_status", "fault": "fault",
    "run_hours": "run_hours", "start_count": "start_count",
    "valve_open": "valve_open", "valve_closed": "valve_closed",
    # Laboratory parameters. Entered by hand, never by an instrument, but a
    # reading is a reading — they belong on the same charts as the rest.
    "COD": "COD",
    "BOD": "BOD",
    "TSS": "TSS",
    "coliform": "coliform",
    "hardness": "hardness",
    "alkalinity": "alkalinity",
    "iron": "iron",
    "manganese": "manganese",
    "fluoride": "fluoride",
    "nitrate": "nitrate",
}

# Which readings matter most when several alarm at once. Turbidity and chlorine
# are the regulatory control points on treated water; a level sensor is not.
PRIORITY = {
    # A fault bit outranks any measurement: a stopped pump is not a reading
    # drifting toward a limit, it is equipment that has failed.
    "fault": "critical",
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


def comm_status(age_seconds: int | None, poll_seconds: int,
                manual: bool = False) -> str:
    """online / stale / offline, judged against how often data is expected.

    Hardcoding 30 and 60 seconds — as the prototype did — marks every sensor
    offline the moment data arrives hourly instead of by live session. The
    thresholds have to come from how often readings actually arrive.

    A hand-entered parameter is judged against a daily sampling round, not the
    gateway's poll rate. A COD result taken this morning is current; calling it
    offline three hours later would be nonsense, and worse, it would put a
    perfectly healthy lab programme in the same list as a failed gateway.
    """
    if age_seconds is None:
        return "offline"
    if manual:
        one_day = 86400
        if age_seconds <= one_day * 1.5:
            return "online"
        if age_seconds <= one_day * 3:
            return "stale"
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
               s.location, s.stage, s.manual_entry,
               l.ts, l.value, l.status, l.quality,
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
            "commStatus": comm_status(age, r["poll_seconds"], r["manual_entry"]),
            "lastUpdated": r["ts"].isoformat() if r["ts"] else None,
            "history": [],
            "priority": PRIORITY.get(r["parameter"], "medium"),
            "location": r["location"],
            "tag": r["tag"],
            "dataSource": "manual" if r["manual_entry"] else "file",
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
               s.manual_entry,
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
            "commStatus": comm_status(age, r["poll_seconds"], r["manual_entry"]),
            "lastUpdated": r["ts"].isoformat() if r["ts"] else None,
            "history": history.get(r["sensor_id"], []),
            "priority": PRIORITY.get(r["parameter"], "medium"),
            "location": r["location"],
            "tag": r["tag"],
            # Every reading here came from a gateway file, never a live
            # session. The dashboard shows this so a stale value is not read
            # as a real-time one.
            "dataSource": "manual" if r["manual_entry"] else "file",
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
def alerts_trend(days: int = Query(7, ge=1, le=90),
                 plant: str | None = Query(None)) -> list[dict]:
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
    # Optional plant scope. Without it a filtered screen shows a fleet-wide
    # trend beside plant-specific counts — two numbers on one page that
    # describe different things.
    code = plant_code(plant) if plant else None
    rows = q("""
        SELECT date_trunc('day', h.bucket)      AS day,
               sum(h.n_critical)::int           AS critical,
               sum(h.n_warning)::int            AS warning,
               count(DISTINCT h.sensor_id)::int AS sensors
        FROM readings_hourly h
        JOIN sensors s USING (sensor_id)
        WHERE h.bucket >= %s AND (%s::text IS NULL OR s.plant_code = %s)
        GROUP BY date_trunc('day', h.bucket)
        ORDER BY day
    """, (since, code, code))
    return [{
        "date": r["day"].date().isoformat(),
        "critical": r["critical"] or 0,
        "warning": r["warning"] or 0,
        "alerts": (r["critical"] or 0) + (r["warning"] or 0),
        "sensors": int(r["sensors"] or 0),
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


@app.get("/gateways")
def gateways() -> list[dict]:
    """The gateways, with whether each is actually delivering.

    `lastFile` and `lastSeq` come from processed_files, so "online" here means
    a file has arrived recently — not that a TCP session is open. With file
    delivery there is no session to be up or down; the only honest signal is
    whether data appeared.

    seqGaps counts missing sequence numbers. A gateway increments seq on every
    poll, so a gap means a file was produced and never arrived — the one
    failure that leaves no error anywhere.
    """
    rows = q("""
        SELECT g.gateway_id, g.plant_code, g.model, g.count_low, g.count_high,
               g.quality_family, g.sends_scaled, p.name AS plant_name,
               p.poll_seconds,
               count(f.object_key)              AS files,
               max(f.processed_at)              AS last_file,
               max(f.seq)                       AS last_seq,
               min(f.seq)                       AS first_seq
        FROM gateways g
        JOIN plants p USING (plant_code)
        LEFT JOIN processed_files f ON f.gateway_id = g.gateway_id
        GROUP BY g.gateway_id, g.plant_code, g.model, g.count_low, g.count_high,
                 g.quality_family, g.sends_scaled, p.name, p.poll_seconds
        ORDER BY g.gateway_id
    """)
    now = datetime.now(timezone.utc)
    out = []
    for r in rows:
        last = r["last_file"]
        age = int((now - last).total_seconds()) if last else None
        expected = (r["last_seq"] - r["first_seq"] + 1) if r["last_seq"] else 0
        out.append({
            "id": r["gateway_id"],
            "plantId": plant_id(r["plant_code"]),
            "plantName": r["plant_name"],
            "model": r["model"],
            "countRange": [r["count_low"], r["count_high"]],
            "qualityFamily": r["quality_family"],
            "sendsScaled": r["sends_scaled"],
            "filesReceived": r["files"],
            "lastFile": last.isoformat() if last else None,
            "status": comm_status(age, r["poll_seconds"]),
            "lastSeq": r["last_seq"],
            # Files produced by the gateway that never reached us.
            "seqGaps": max(0, expected - r["files"]) if r["files"] else 0,
        })
    return out


# The smallest payload the pipeline can act on. Everything else a gateway
# sends — sequence number, signal strength, supply voltage — is diagnostic.
UPLOAD_SHAPE = {
    "gw": "any identifier for the source. Shown in the audit trail.",
    "ts": "epoch seconds or ISO 8601. When the poll was taken.",
    "d": [{
        "t": "the tag, as it appears in the register map. REQUIRED.",
        "v": "the value. Raw counts for an analogue tag, unless the source "
             "sends engineering units. REQUIRED.",
        "q": "OPC quality: 192 good, 64 uncertain, 0 bad. Optional — omitted "
             "means the source did not report quality, which is recorded as "
             "such rather than assumed good.",
    }],
}


def _tag_map_from_db(plant: str | None = None) -> dict[str, TagMapEntry]:
    """The register map as the pipeline expects it, read from the database.

    Scoped to one plant when the source identifies one.

    Tags are unique per plant, not globally. Most integrators number from 1 at
    every site, so PH-1001 existing at six plants is normal — and a map keyed
    on tag alone would keep whichever row happened to be read last and file
    every reading against the wrong site. Nothing would error; the numbers
    would simply belong to somebody else's plant.

    Which is why an upload must say where it came from.
    """
    rows = q("""
        SELECT t.tag, t.plant_code, t.sensor_id, t.span_low, t.span_high,
               t.count_low, t.count_high, t.data_type,
               s.parameter, s.unit, s.location, s.stage
        FROM tag_map t JOIN sensors s USING (sensor_id)
        WHERE t.valid_to IS NULL AND (%s::text IS NULL OR t.plant_code = %s)
    """, (plant, plant))

    # Ambiguity here is not recoverable: two plants, one tag, no way to know
    # which was meant. Refuse rather than pick.
    if plant is None:
        seen: dict[str, str] = {}
        clash = sorted({r["tag"] for r in rows
                        if seen.setdefault(r["tag"], r["plant_code"]) != r["plant_code"]})
        if clash:
            raise HTTPException(409,
                f"{len(clash)} tag(s) exist at more than one plant "
                f"({', '.join(clash[:5])}). Identify the plant in the upload.")

    return {r["tag"]: TagMapEntry(
        tag=r["tag"], plant_code=r["plant_code"], sensor_id=r["sensor_id"],
        parameter=r["parameter"], unit=r["unit"], location=r["location"],
        stage=r["stage"], span_low=r["span_low"], span_high=r["span_high"],
        count_low=r["count_low"], count_high=r["count_high"],
        data_type=r["data_type"],
    ) for r in rows}


@app.get("/upload/shape")
def upload_shape() -> dict:
    """What an uploaded file must contain, and an example of it."""
    return {
        "required": ["d[].t", "d[].v"],
        "optional": ["ts", "gw", "d[].q", "seq"],
        "fields": UPLOAD_SHAPE,
        "example": {
            "gw": "LAB-EXPORT", "ts": 1786420800, "seq": 1,
            "d": [
                {"t": "PH-1001", "v": 17252, "q": 192},
                {"t": "TUR-1003", "v": 7609, "q": 192},
            ],
        },
        "note": "Any of the gateway formats the ingest already reads is "
                "accepted — this is the simplest of them.",
    }


@app.post("/upload/readings")
async def upload_readings(
    file: UploadFile = File(...),
    commit: bool = Query(False),
    entered_by: str = Query("upload"),
    plant: str | None = Query(None,
        description="plant-1 style id. Required when the same tag exists at "
                    "more than one plant, which is usual."),
) -> dict:
    """Load readings from an uploaded file.

    Runs the same parser and the same cleaning rules as an automatic ingest.
    That is the point: a file somebody uploads is held to identical standards,
    so an operator cannot get a reading past the checks by routing it through
    the browser.

    Dry run by default. `commit=false` reports exactly what would happen —
    what parses, what is rejected and why — without writing anything, because
    the moment to discover a file is wrong is before it is in the database.
    """
    raw = await file.read()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(413, "file is larger than 8 MB")

    try:
        envelopes = parse_file(raw, key=file.filename or "upload.json")
    except (ParseError, UnknownFormat) as exc:
        raise HTTPException(400, f"could not read the file: {exc}")

    # The plant comes from the query, or from the gateway that sent the file —
    # a gateway belongs to exactly one plant, so its id is enough.
    code = plant_code(plant) if plant else None
    if code is None and envelopes:
        gw = envelopes[0].gateway_id
        found = q("SELECT plant_code FROM gateways WHERE gateway_id = %s", (gw,))
        if found:
            code = found[0]["plant_code"]

    tag_map = _tag_map_from_db(code)
    if not tag_map:
        raise HTTPException(
            409, f"no register map entries for {code or 'any plant'} — "
                 "nothing in this file can be interpreted")

    accepted, rejected = [], []
    counts: dict[str, int] = {}
    for env in envelopes:
        rows, rejects, c = process_envelope(
            env, tag_map, source_file=f"upload/{file.filename}")
        accepted.extend(rows)
        rejected.extend(rejects)
        for k, v in c.items():
            counts[k] = counts.get(k, 0) + v

    written = 0
    batch_id = None
    if commit and accepted:
        with psycopg.connect(DSN, row_factory=dict_row) as conn, conn.cursor() as cur:
            # Dated by the earliest reading in the file rather than by now: the
            # sample time of an upload is when the plant measured it.
            earliest = min(r.ts for r in accepted)
            cur.execute("""
                INSERT INTO manual_batches (plant_code, sample_ts, entered_by, note)
                VALUES (%s, %s, %s, %s)
                RETURNING batch_id
            """, (code, earliest, entered_by, f"uploaded {file.filename}"))
            batch_id = cur.fetchone()["batch_id"]

            cur.executemany("""
                INSERT INTO readings (sensor_id, ts, value, raw_count, quality,
                                      status, source, source_file, entered_by,
                                      entered_at, batch_id)
                VALUES (%s, %s, %s, %s, %s, %s, 'manual', %s, %s, now(), %s)
                ON CONFLICT (sensor_id, ts) DO NOTHING
            """, [(r.sensor_id, r.ts, r.value, r.raw_count, r.quality, r.status,
                   f"upload/{file.filename}", entered_by, batch_id)
                  for r in accepted])
            written = cur.rowcount
            if written == 0:
                cur.execute("DELETE FROM manual_batches WHERE batch_id = %s",
                            (batch_id,))
                batch_id = None
            cur.executemany("""
                INSERT INTO latest_readings (sensor_id, ts, value, status, quality)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (sensor_id) DO UPDATE
                  SET ts = EXCLUDED.ts, value = EXCLUDED.value,
                      status = EXCLUDED.status, quality = EXCLUDED.quality
                WHERE latest_readings.ts < EXCLUDED.ts
            """, [(r.sensor_id, r.ts, r.value, r.status, r.quality)
                  for r in accepted])
            conn.commit()

    by_tag = {}
    for r in rejected:
        by_tag.setdefault(r.reason, []).append(r.tag)

    return {
        "filename": file.filename,
        "batchId": batch_id,
        "reference": "BS-%04d" % batch_id if batch_id else None,
        # Stated back, so a file loaded against the wrong site is visible in
        # the response rather than discovered in a chart weeks later.
        "plant": code,
        "committed": commit,
        "parsed": sum(len(e.readings) for e in envelopes),
        "accepted": len(accepted),
        "written": written,
        "rejected": len(rejected),
        "reasons": counts,
        # Which tags failed, so the sender can fix their file rather than
        # guessing. Capped, because a wholly mis-mapped file would otherwise
        # return every tag it contains.
        "rejectedTags": {k: sorted(set(v))[:10] for k, v in by_tag.items()},
        "preview": [{
            "sensorId": r.sensor_id, "ts": r.ts.isoformat(),
            "value": r.value, "status": r.status,
        } for r in accepted[:10]],
    }


@app.get("/manual/drift")
def manual_drift(hours: int = Query(72, ge=1, le=8760)) -> list[dict]:
    """Grab samples compared against the instrument that measures the same thing.

    An operator with a handheld meter checks the online probe. Neither reading
    means much alone — but the difference between them is the probe's drift,
    and that is the number a calibration decision actually rests on.

    Matching is by parameter and location, because that is what makes two
    readings comparable: the same water, at the same point, measured two ways.
    Comparing a filter probe against a raw-water grab sample would produce a
    large difference that means nothing.

    The instrument reading used is the one closest in time to the sample, not
    the latest — a grab taken yesterday must be compared with what the probe
    said yesterday.
    """
    rows = q("""
        WITH grabs AS (
            SELECT r.sensor_id, r.ts, r.value, r.entered_by, r.note,
                   s.parameter, s.location, s.unit, s.plant_code, s.stage
            FROM readings r
            JOIN sensors s USING (sensor_id)
            WHERE r.source = 'manual'
              AND s.tag LIKE 'GRAB-%%'
              AND r.ts > now() - make_interval(hours => %s)
        )
        SELECT g.ts, g.value AS grab_value, g.entered_by, g.note,
               g.parameter, g.location, g.unit, g.plant_code, g.stage,
               p.name AS plant_name,
               inst.tag        AS instrument_tag,
               inst.value      AS instrument_value,
               inst.ts         AS instrument_ts
        FROM grabs g
        JOIN plants p ON p.plant_code = g.plant_code
        LEFT JOIN LATERAL (
            SELECT s2.tag, r2.value, r2.ts
            FROM sensors s2
            JOIN readings r2 USING (sensor_id)
            WHERE s2.plant_code = g.plant_code
              AND s2.parameter  = g.parameter
              AND s2.location   = g.location
              AND NOT s2.manual_entry
            ORDER BY abs(extract(epoch FROM (r2.ts - g.ts)))
            LIMIT 1
        ) inst ON TRUE
        ORDER BY g.ts DESC
        LIMIT 100
    """, (hours,))

    out = []
    for r in rows:
        inst = r["instrument_value"]
        grab = r["grab_value"]
        diff = None if inst is None else round(grab - inst, 4)
        # Relative to the reading, because an absolute difference means
        # different things at 0.2 NTU and at 20 NTU.
        pct = (None if inst in (None, 0)
               else round(abs(grab - inst) / abs(inst) * 100, 1))
        out.append({
            "ts": r["ts"].isoformat(),
            "plantName": r["plant_name"],
            "parameter": r["parameter"],
            "location": r["location"],
            "unit": r["unit"],
            "grabValue": round(grab, 4),
            "enteredBy": r["entered_by"],
            "note": r["note"],
            "instrumentTag": r["instrument_tag"],
            "instrumentValue": round(inst, 4) if inst is not None else None,
            "instrumentTs": r["instrument_ts"].isoformat() if r["instrument_ts"] else None,
            "difference": diff,
            "differencePct": pct,
            # A working guide, not a standard. The real threshold comes from the
            # instrument's manual and the plant's calibration procedure — this
            # only says which comparisons are worth a person's attention.
            "verdict": ("unknown" if pct is None
                        else "agrees" if pct <= 5
                        else "check" if pct <= 15
                        else "calibrate"),
        })
    return out


@app.get("/insights")
def insights(days: int = Query(30, ge=1, le=365), plant: str | None = Query(None)) -> dict:
    """Analytics over sensor data. Observations, not recommendations.

    Every figure here is counted from readings. Nothing is modelled, so nothing
    can be advised: telling a plant to change a coagulant dose needs a process
    model, and a dashboard that guesses at one is worse than one that stays
    quiet.
    """
    code = plant_code(plant) if plant else None

    # Breach rate by parameter and stage. Stage matters more than parameter:
    # 20 NTU is normal raw water and a failure in final water, so pooling them
    # would hide the only one that counts.
    params = q("""
        SELECT s.parameter, s.stage,
               sum(h.n)          AS samples,
               sum(h.n_critical) AS critical,
               sum(h.n_warning)  AS warning
        FROM readings_hourly h
        JOIN sensors s USING (sensor_id)
        WHERE h.bucket > now() - make_interval(days => %s)
          AND (%s::text IS NULL OR s.plant_code = %s)
        GROUP BY 1, 2
        HAVING sum(h.n) >= 20
        ORDER BY (sum(h.n_critical) + sum(h.n_warning))::float / sum(h.n) DESC,
                 sum(h.n_critical) DESC
        LIMIT 20
    """, (days, code, code))

    estate = {(r["parameter"], r["stage"]): r for r in q("""
        SELECT parameter, stage, count(*) AS sensors,
               count(DISTINCT plant_code) AS plants
        FROM sensors
        WHERE %s::text IS NULL OR plant_code = %s
        GROUP BY 1, 2
    """, (code, code))}

    # Individual instruments, so a single bad probe is not averaged away by the
    # five beside it reading correctly.
    sensors = q("""
        SELECT s.sensor_id, s.tag, s.parameter, s.location, s.stage,
               p.name AS plant_name, s.plant_code,
               sum(h.n)          AS samples,
               sum(h.n_critical) AS critical,
               sum(h.n_warning)  AS warning,
               round(avg(h.avg_value)::numeric, 3) AS avg_value,
               s.unit, b.warn_min, b.warn_max, b.crit_min, b.crit_max
        FROM readings_hourly h
        JOIN sensors s USING (sensor_id)
        JOIN plants  p USING (plant_code)
        LEFT JOIN threshold_bands b
               ON b.parameter = s.parameter AND b.stage = s.stage
        WHERE h.bucket > now() - make_interval(days => %s)
          AND (%s::text IS NULL OR s.plant_code = %s)
        GROUP BY s.sensor_id, s.tag, s.parameter, s.location, s.stage,
                 p.name, s.plant_code, s.unit,
                 b.warn_min, b.warn_max, b.crit_min, b.crit_max
        HAVING sum(h.n) >= 50 AND (sum(h.n_critical) + sum(h.n_warning)) > 0
        ORDER BY (sum(h.n_critical) + sum(h.n_warning))::float / sum(h.n) DESC,
                 sum(h.n) DESC
        LIMIT 12
    """, (days, code, code))

    # Configured but silent. An instrument nobody is receiving is invisible on
    # every other screen — it simply has no tile — so it is worth counting in
    # one place.
    cover = q("""
        SELECT count(*) FILTER (WHERE l.ts IS NULL)                       AS never,
               count(*) FILTER (WHERE l.ts < now() - interval '24 hours') AS stopped,
               count(*)                                                   AS total
        FROM sensors s
        LEFT JOIN latest_readings l USING (sensor_id)
        WHERE NOT s.manual_entry AND (%s::text IS NULL OR s.plant_code = %s)
    """, (code, code))[0]

    by_plant = q("""
        WITH silent AS (
            SELECT s.plant_code,
                   count(*) FILTER (WHERE l.ts IS NULL)                       AS never,
                   count(*) FILTER (WHERE l.ts < now() - interval '24 hours') AS stopped,
                   count(*)                                                   AS configured
            FROM sensors s
            LEFT JOIN latest_readings l USING (sensor_id)
            WHERE NOT s.manual_entry AND (%s::text IS NULL OR s.plant_code = %s)
            GROUP BY 1
        ),
        gw AS (
            -- processed_files records the gateway that sent each file, so the
            -- delivery record is a direct join rather than a guess at the key.
            SELECT g.plant_code,
                   min(g.gateway_id)                 AS gateway_id,
                   count(pf.object_key)              AS files,
                   max(pf.processed_at)              AS last_file
            FROM gateways g
            LEFT JOIN processed_files pf USING (gateway_id)
            GROUP BY g.plant_code
        )
        SELECT s.plant_code, p.name AS plant_name, s.never, s.stopped, s.configured,
               gw.gateway_id, gw.files, gw.last_file
        FROM silent s
        JOIN plants p USING (plant_code)
        LEFT JOIN gw USING (plant_code)
        WHERE s.never + s.stopped > 0
        ORDER BY (s.never + s.stopped) DESC
    """, (code, code))

    silent = q("""
        SELECT s.sensor_id, s.tag, s.parameter, s.location, s.plant_code,
               p.name AS plant_name, l.ts AS last_seen
        FROM sensors s
        JOIN plants p USING (plant_code)
        LEFT JOIN latest_readings l USING (sensor_id)
        WHERE NOT s.manual_entry
          AND (l.ts IS NULL OR l.ts < now() - interval '24 hours')
          AND (%s::text IS NULL OR s.plant_code = %s)
        ORDER BY l.ts NULLS FIRST
        LIMIT 12
    """, (code, code))

    # A reading that never moves within an hour, hour after hour, is the
    # signature of a held value: the probe has failed but the PLC keeps
    # publishing its last number, so nothing looks wrong anywhere else.
    flat = q("""
        SELECT s.sensor_id, s.tag, s.parameter, s.location, s.unit, s.plant_code,
               p.name AS plant_name,
               count(*)                            AS flat_hours,
               round(max(h.avg_value)::numeric, 3) AS stuck_at
        FROM readings_hourly h
        JOIN sensors s USING (sensor_id)
        JOIN plants  p USING (plant_code)
        WHERE h.bucket > now() - make_interval(days => %s)
          AND h.min_value = h.max_value AND h.n > 1
          AND (%s::text IS NULL OR s.plant_code = %s)
        GROUP BY s.sensor_id, s.tag, s.parameter, s.location, s.unit,
                 s.plant_code, p.name
        HAVING count(*) >= 6
        ORDER BY count(*) DESC
        LIMIT 12
    """, (days, code, code))

    # How much the plant actually removes. The one number a treatment works
    # exists to produce: what came in against what went out, per parameter.
    # Only meaningful where a parameter is measured at both ends.
    removal = q("""
        WITH stage_avg AS (
            SELECT s.plant_code, p.name AS plant_name, s.parameter, s.stage, s.unit,
                   avg(h.avg_value) AS avg_value, sum(h.n) AS samples
            FROM readings_hourly h
            JOIN sensors s USING (sensor_id)
            JOIN plants  p USING (plant_code)
            WHERE h.bucket > now() - make_interval(days => %s)
              AND s.stage IN ('raw', 'final')
              -- Removal only means something for a contaminant the works is
              -- there to take out. pH is corrected, chlorine is added, and
              -- flow and pressure are not removed at all — a "removal
              -- efficiency" for any of those is a category error.
              AND s.parameter IN ('turbidity', 'TSS', 'COD', 'BOD', 'coliform',
                                  'iron', 'manganese', 'hardness')
              AND (%s::text IS NULL OR s.plant_code = %s)
            GROUP BY 1, 2, 3, 4, 5
        )
        SELECT r.plant_code, r.plant_name, r.parameter, r.unit,
               r.avg_value  AS raw_avg,
               f.avg_value  AS final_avg,
               least(r.samples, f.samples) AS samples
        FROM stage_avg r
        JOIN stage_avg f
          ON f.plant_code = r.plant_code AND f.parameter = r.parameter
         AND f.stage = 'final'
        WHERE r.stage = 'raw' AND r.avg_value <> 0
        ORDER BY r.plant_name, r.parameter
    """, (days, code, code))

    # Why readings were discarded on the way in — a property of the
    # instruments and the gateway, not of the water.
    rejects = q("""
        SELECT reason, count(*) AS n
        FROM rejected_readings
        WHERE ts > now() - make_interval(days => %s)
        GROUP BY 1 ORDER BY 2 DESC
    """, (days,))

    def rate(c, w, n) -> float:
        c, w, n = int(c or 0), int(w or 0), int(n or 0)
        return round(100.0 * (c + w) / n, 2) if n else 0.0

    return {
        "days": days,
        "parameters": [{
            "parameter": r["parameter"], "stage": r["stage"],
            "samples": int(r["samples"] or 0), "critical": int(r["critical"] or 0),
            "warning": int(r["warning"] or 0),
            "sensors": int(estate.get((r["parameter"], r["stage"]), {}).get("sensors", 0)),
            "plants": int(estate.get((r["parameter"], r["stage"]), {}).get("plants", 0)),
            "breachPct": rate(r["critical"], r["warning"], r["samples"]),
        } for r in params],
        "sensors": [{
            "id": r["sensor_id"], "tag": r["tag"], "parameter": r["parameter"],
            "location": r["location"], "stage": r["stage"], "unit": r["unit"],
            "plantId": plant_id(r["plant_code"]), "plantName": r["plant_name"],
            "samples": int(r["samples"] or 0), "critical": int(r["critical"] or 0),
            "warning": int(r["warning"] or 0), "avgValue": float(r["avg_value"]),
            # The limit it broke, so the screen can say "22.5 against a limit
            # of 5" rather than a percentage with nothing to compare against.
            "warnMin": r["warn_min"], "warnMax": r["warn_max"],
            "critMin": r["crit_min"], "critMax": r["crit_max"],
            "breachPct": rate(r["critical"], r["warning"], r["samples"]),
        } for r in sensors],
        "coverage": {
            "total": cover["total"], "never": cover["never"],
            "stopped": cover["stopped"],
            "reporting": cover["total"] - cover["never"] - cover["stopped"],
            # One entry per plant, because a whole site going quiet is one
            # fact rather than forty.
            "byPlant": [{
                "plantId": plant_id(r["plant_code"]), "plantName": r["plant_name"],
                "never": int(r["never"] or 0), "stopped": int(r["stopped"] or 0),
                "configured": int(r["configured"] or 0),
                "gatewayId": r["gateway_id"],
                "gatewayFiles": int(r["files"] or 0),
                "gatewayLastFile": r["last_file"].isoformat() if r["last_file"] else None,
            } for r in by_plant],
            "examples": [{
                "id": r["sensor_id"], "tag": r["tag"], "parameter": r["parameter"],
                "location": r["location"], "plantName": r["plant_name"],
                "plantId": plant_id(r["plant_code"]),
                "lastSeen": r["last_seen"].isoformat() if r["last_seen"] else None,
            } for r in silent],
        },
        "flatlined": [{
            "id": r["sensor_id"], "tag": r["tag"], "parameter": r["parameter"],
            "location": r["location"], "unit": r["unit"],
            "plantName": r["plant_name"], "plantId": plant_id(r["plant_code"]),
            "flatHours": int(r["flat_hours"]), "stuckAt": float(r["stuck_at"] or 0),
        } for r in flat],
        "removal": [{
            "plantId": plant_id(r["plant_code"]), "plantName": r["plant_name"],
            "parameter": r["parameter"], "unit": r["unit"],
            "rawAvg": round(float(r["raw_avg"]), 3),
            "finalAvg": round(float(r["final_avg"]), 3),
            # Negative means the parameter rose across the works. For turbidity
            # that is a failure; for chlorine it is dosing, which is the point.
            "removalPct": round(
                (float(r["raw_avg"]) - float(r["final_avg"])) / float(r["raw_avg"]) * 100, 1),
            "samples": int(r["samples"] or 0),
        } for r in removal],
        "rejected": [{"reason": r["reason"], "count": int(r["n"])} for r in rejects],
    }


@app.get("/insights/acknowledgements/history")
def acknowledgement_history(limit: int = Query(50, ge=1, le=200)) -> list[dict]:
    """Every acknowledgement, newest first.

    The only history this screen can honestly show. Nothing was applied to the
    plant — there is no write path — so what happened is that observations were
    raised and people said they had read them.

    Insight ids carry their own meaning ("breach:plant-1-sensor-5"), so the
    instrument is resolved here rather than leaving the screen to parse strings.
    """
    rows = q("""
        SELECT a.ack_id, a.insight_id, a.acknowledged_by, a.acknowledged_at, a.note,
               split_part(a.insight_id, ':', 1) AS kind,
               s.parameter, s.location, p.name AS plant_name
        FROM insight_acknowledgements a
        LEFT JOIN sensors s ON s.sensor_id = split_part(a.insight_id, ':', 2)
        LEFT JOIN plants  p ON p.plant_code = s.plant_code
        ORDER BY a.acknowledged_at DESC
        LIMIT %s
    """, (limit,))
    return [{
        "id": r["ack_id"],
        "insightId": r["insight_id"],
        "kind": r["kind"],
        # A plant-wide coverage observation has no sensor, so it resolves to
        # nothing — say what it was rather than showing a blank row.
        "subject": (f"{r['parameter']} at {r['location']}" if r["parameter"]
                    else r["insight_id"].split(":", 1)[-1]),
        "plantName": r["plant_name"],
        "acknowledgedBy": r["acknowledged_by"],
        "acknowledgedAt": r["acknowledged_at"].isoformat(),
        "note": r["note"],
    } for r in rows]


@app.get("/insights/acknowledgements")
def insight_acknowledgements() -> dict:
    """Current acknowledgement state, keyed by insight id.

    The latest row per insight. Earlier ones are kept — an insight raised again
    on a later shift is acknowledged again, and who saw it the first time is
    still worth having.
    """
    rows = q("""
        SELECT DISTINCT ON (insight_id)
               insight_id, acknowledged_by, acknowledged_at, note
        FROM insight_acknowledgements
        ORDER BY insight_id, acknowledged_at DESC
    """)
    return {r["insight_id"]: {
        "acknowledgedBy": r["acknowledged_by"],
        "acknowledgedAt": r["acknowledged_at"].isoformat(),
        "note": r["note"],
    } for r in rows}


@app.post("/insights/acknowledgements", status_code=201)
def acknowledge_insight(payload: dict = Body(...)) -> dict:
    """Record that somebody has seen an insight.

    An acknowledgement changes nothing at the plant — there is no write path,
    and this deliberately does not pretend to be one. It records that a person
    read the observation, which is the part a shift handover actually needs.
    """
    insight_id = (payload.get("insightId") or "").strip()
    by = (payload.get("acknowledgedBy") or "").strip()
    note = (payload.get("note") or "").strip() or None

    if not insight_id or not by:
        raise HTTPException(400, "insightId and acknowledgedBy are required")
    if len(insight_id) > 200 or len(by) > 200:
        raise HTTPException(400, "insightId and acknowledgedBy must be under 200 characters")

    with psycopg.connect(DSN, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO insight_acknowledgements (insight_id, acknowledged_by, note)
            VALUES (%s, %s, %s)
            RETURNING acknowledged_at
        """, (insight_id, by, note))
        at = cur.fetchone()["acknowledged_at"]
        conn.commit()

    return {
        "insightId": insight_id,
        "acknowledgedBy": by,
        "acknowledgedAt": at.isoformat(),
        "note": note,
    }


@app.get("/manual/sensors")
def manual_sensors(plant: str | None = Query(None)) -> list[dict]:
    """Parameters that accept a hand-entered reading.

    Lab results, mostly. They have no tag on any gateway, so the only way a
    figure arrives is somebody typing it.
    """
    code = plant_code(plant) if plant else None
    rows = q("""
        SELECT s.sensor_id, s.tag, s.parameter, s.unit, s.location, s.stage,
               s.plant_code, p.name AS plant_name,
               b.warn_min, b.warn_max, b.crit_min, b.crit_max,
               l.ts AS last_ts, l.value AS last_value
        FROM sensors s
        JOIN plants p USING (plant_code)
        LEFT JOIN threshold_bands b
               ON b.parameter = s.parameter AND b.stage = s.stage
        LEFT JOIN latest_readings l USING (sensor_id)
        WHERE s.manual_entry AND (%s::text IS NULL OR s.plant_code = %s)
        ORDER BY p.name, s.parameter, s.location
    """, (code, code))
    return [{
        "id": r["sensor_id"], "tag": r["tag"], "parameter": r["parameter"],
        "unit": r["unit"], "location": r["location"], "stage": r["stage"],
        "plantId": plant_id(r["plant_code"]), "plantName": r["plant_name"],
        "warnMin": r["warn_min"], "warnMax": r["warn_max"],
        "critMin": r["crit_min"], "critMax": r["crit_max"],
        "lastReading": r["last_ts"].isoformat() if r["last_ts"] else None,
        "lastValue": round(r["last_value"], 4) if r["last_value"] is not None else None,
    } for r in rows]


@app.post("/manual/readings", status_code=201)
def create_manual_reading(payload: dict = Body(...)) -> dict:
    """Record a reading somebody measured by hand.

    Held to the same rules as an automatic one. A lab result is not exempt from
    the plausibility check or the alarm band — if anything it needs them more,
    because a transposed digit in a typed number has nothing upstream to catch
    it.

    Rejects rather than overwrites when a reading already exists for that
    sensor and time. Correcting a figure is a deliberate act, and should not
    happen by somebody submitting a form twice.
    """
    sensor_id = (payload.get("sensorId") or "").strip()
    entered_by = (payload.get("enteredBy") or "").strip()
    ts_text = payload.get("ts")
    note = (payload.get("note") or "").strip() or None

    if not sensor_id or not entered_by:
        raise HTTPException(400, "sensorId and enteredBy are required")
    try:
        value = float(payload.get("value"))
    except (TypeError, ValueError):
        raise HTTPException(400, "value must be a number")
    if value != value or value in (float("inf"), float("-inf")):
        raise HTTPException(400, "value must be finite")

    try:
        ts = (datetime.fromisoformat(str(ts_text).replace("Z", "+00:00"))
              if ts_text
              # Rounded to the minute. At microsecond precision a
              # double-clicked form produces two readings seconds apart rather
              # than colliding on the primary key — and nobody records a lab
              # sample to the microsecond anyway.
              else datetime.now(timezone.utc).replace(second=0, microsecond=0))
    except ValueError:
        raise HTTPException(400, "ts is not a valid timestamp")
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    # A sample cannot have been taken in the future. Usually a mistyped year.
    if ts > datetime.now(timezone.utc) + timedelta(minutes=5):
        raise HTTPException(400, "the sample time is in the future")

    rows = q("""
        SELECT s.parameter, s.unit, s.stage, s.manual_entry,
               b.warn_min, b.warn_max, b.crit_min, b.crit_max
        FROM sensors s
        LEFT JOIN threshold_bands b
               ON b.parameter = s.parameter AND b.stage = s.stage
        WHERE s.sensor_id = %s
    """, (sensor_id,))
    if not rows:
        raise HTTPException(404, "no such sensor")
    r = rows[0]
    if not r["manual_entry"]:
        # An instrument tag receives its readings from the gateway. Letting a
        # typed figure land among them would make the trend untrustworthy and
        # the discrepancy invisible.
        raise HTTPException(409, "that is an instrument tag — it does not accept manual entry")

    # Classified from the same bands as an automatic reading.
    if r["crit_min"] is None:
        status = "normal"
    elif value < r["crit_min"] or value > r["crit_max"]:
        status = "critical"
    elif value < r["warn_min"] or value > r["warn_max"]:
        status = "warning"
    else:
        status = "normal"

    with psycopg.connect(DSN, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO readings (sensor_id, ts, value, status, source,
                                  entered_by, entered_at, note, quality)
            VALUES (%s, %s, %s, %s, 'manual', %s, now(), %s, 192)
            ON CONFLICT (sensor_id, ts) DO NOTHING
            RETURNING ts
        """, (sensor_id, ts, round(value, 4), status, entered_by, note))
        if cur.fetchone() is None:
            raise HTTPException(409, "a reading already exists for that sensor and time")

        # Keep the dashboard's current-value table in step, but only when this
        # is newer — back-filling last week's sample must not overwrite today's.
        cur.execute("""
            INSERT INTO latest_readings (sensor_id, ts, value, status, quality)
            VALUES (%s, %s, %s, %s, 192)
            ON CONFLICT (sensor_id) DO UPDATE
              SET ts = EXCLUDED.ts, value = EXCLUDED.value, status = EXCLUDED.status
            WHERE latest_readings.ts < EXCLUDED.ts
        """, (sensor_id, ts, round(value, 4), status))
        conn.commit()

    return {
        "sensorId": sensor_id, "ts": ts.isoformat(), "value": round(value, 4),
        "status": status, "parameter": r["parameter"], "unit": r["unit"],
        "enteredBy": entered_by, "note": note,
    }


@app.post("/manual/readings/batch", status_code=201)
def create_manual_batch(payload: dict = Body(...)) -> dict:
    """Record a round of samples: one sample time, many parameters.

    A technician draws one sample and measures a dozen things from it. Those
    readings share a time because they describe the same water, and entering
    them one at a time would not only be tedious — it would give each one a
    slightly different timestamp, so a chart could not line them up.

    Reported per row rather than all-or-nothing. If one figure is a duplicate
    the other eleven are still recorded, because discarding a round of typing
    over one bad cell is how people stop using a form.
    """
    entered_by = (payload.get("enteredBy") or "").strip()
    note = (payload.get("note") or "").strip() or None
    rows_in = payload.get("readings") or []

    if not entered_by:
        raise HTTPException(400, "enteredBy is required")
    if not isinstance(rows_in, list) or not rows_in:
        raise HTTPException(400, "readings must be a non-empty list")
    if len(rows_in) > 200:
        raise HTTPException(400, "no more than 200 readings in one submission")

    ts_text = payload.get("ts")
    try:
        ts = (datetime.fromisoformat(str(ts_text).replace("Z", "+00:00"))
              if ts_text else datetime.now(timezone.utc))
    except ValueError:
        raise HTTPException(400, "ts is not a valid timestamp")
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    if ts > datetime.now(timezone.utc) + timedelta(minutes=5):
        raise HTTPException(400, "the sample time is in the future")
    # To the minute, so submitting the same round twice collides rather than
    # landing a second copy microseconds away from the first.
    ts = ts.replace(second=0, microsecond=0)

    wanted = [str(r.get("sensorId") or "").strip() for r in rows_in]
    known = {r["sensor_id"]: r for r in q("""
        SELECT s.sensor_id, s.parameter, s.unit, s.location, s.manual_entry,
               b.warn_min, b.warn_max, b.crit_min, b.crit_max
        FROM sensors s
        LEFT JOIN threshold_bands b
               ON b.parameter = s.parameter AND b.stage = s.stage
        WHERE s.sensor_id = ANY(%s)
    """, (wanted,))}

    results, to_write = [], []
    for raw in rows_in:
        sid = str(raw.get("sensorId") or "").strip()
        meta = known.get(sid)
        try:
            value = float(raw.get("value"))
            if value != value or value in (float("inf"), float("-inf")):
                raise ValueError
        except (TypeError, ValueError):
            results.append({"sensorId": sid, "ok": False, "error": "not a number"})
            continue
        if meta is None:
            results.append({"sensorId": sid, "ok": False, "error": "no such sensor"})
            continue
        if not meta["manual_entry"]:
            results.append({"sensorId": sid, "ok": False,
                            "error": "instrument tag — does not accept manual entry"})
            continue

        if meta["crit_min"] is None:
            status = "normal"
        elif value < meta["crit_min"] or value > meta["crit_max"]:
            status = "critical"
        elif value < meta["warn_min"] or value > meta["warn_max"]:
            status = "warning"
        else:
            status = "normal"

        value = round(value, 4)
        to_write.append((sid, value, status))
        results.append({"sensorId": sid, "ok": True, "value": value,
                        "status": status, "parameter": meta["parameter"],
                        "unit": meta["unit"], "location": meta["location"]})

    written = 0
    batch_id = None
    if to_write:
        # The plant the round was taken at. Every sensor in a submission
        # belongs to one plant — the form only offers one — so the first is
        # authoritative.
        first = q("SELECT plant_code FROM sensors WHERE sensor_id = %s",
                  (to_write[0][0],))
        plant = first[0]["plant_code"] if first else None

        with psycopg.connect(DSN, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO manual_batches (plant_code, sample_ts, entered_by, note)
                VALUES (%s, %s, %s, %s)
                RETURNING batch_id
            """, (plant, ts, entered_by, note))
            batch_id = cur.fetchone()["batch_id"]

            for sid, value, status in to_write:
                cur.execute("""
                    INSERT INTO readings (sensor_id, ts, value, status, source,
                                          entered_by, entered_at, note, quality,
                                          batch_id)
                    VALUES (%s, %s, %s, %s, 'manual', %s, now(), %s, 192, %s)
                    ON CONFLICT (sensor_id, ts) DO NOTHING
                    RETURNING ts
                """, (sid, ts, value, status, entered_by, note, batch_id))
                if cur.fetchone() is None:
                    for r in results:
                        if r["sensorId"] == sid and r.get("ok"):
                            r["ok"] = False
                            r["error"] = "already recorded at that time"
                    continue
                written += 1
                cur.execute("""
                    INSERT INTO latest_readings (sensor_id, ts, value, status, quality)
                    VALUES (%s, %s, %s, %s, 192)
                    ON CONFLICT (sensor_id) DO UPDATE
                      SET ts = EXCLUDED.ts, value = EXCLUDED.value,
                          status = EXCLUDED.status
                    WHERE latest_readings.ts < EXCLUDED.ts
                """, (sid, ts, value, status))
            if written == 0:
                cur.execute("DELETE FROM manual_batches WHERE batch_id = %s",
                            (batch_id,))
                batch_id = None
            conn.commit()

    return {
        "batchId": batch_id,
        "ts": ts.isoformat(),
        "submitted": len(rows_in),
        "recorded": written,
        "failed": sum(1 for r in results if not r["ok"]),
        "results": results,
    }


@app.get("/manual/batches")
def manual_batches(limit: int = Query(30, ge=1, le=200)) -> list[dict]:
    """Bench sheet submissions, newest first.

    One row per round rather than per reading. A technician who entered twelve
    results entered them once, and a log that lists them twelve times makes it
    look like twelve separate acts.
    """
    rows = q("""
        SELECT b.batch_id, b.plant_code, p.name AS plant_name, b.sample_ts,
               b.entered_by, b.entered_at, b.note,
               count(r.*)                                        AS readings,
               count(*) FILTER (WHERE r.status = 'critical')      AS critical,
               count(*) FILTER (WHERE r.status = 'warning')       AS warning,
               (SELECT count(*) FROM manual_reading_edits e
                 WHERE e.batch_id = b.batch_id)                   AS edits,
               (SELECT e.edited_by FROM manual_reading_edits e
                 WHERE e.batch_id = b.batch_id
                 ORDER BY e.edited_at DESC LIMIT 1)               AS last_edited_by,
               (SELECT e.edited_at FROM manual_reading_edits e
                 WHERE e.batch_id = b.batch_id
                 ORDER BY e.edited_at DESC LIMIT 1)               AS last_edited_at
        FROM manual_batches b
        JOIN plants p USING (plant_code)
        LEFT JOIN readings r USING (batch_id)
        GROUP BY b.batch_id, b.plant_code, p.name, b.sample_ts,
                 b.entered_by, b.entered_at, b.note
        ORDER BY b.entered_at DESC
        LIMIT %s
    """, (limit,))
    if not rows:
        return []

    ids = [r["batch_id"] for r in rows]
    detail = q("""
        SELECT r.batch_id, r.sensor_id, s.parameter, s.location, s.unit,
               r.value, r.status
        FROM readings r
        JOIN sensors s USING (sensor_id)
        WHERE r.batch_id = ANY(%s)
        ORDER BY s.location, s.parameter
    """, (ids,))
    by_batch: dict[int, list[dict]] = {}
    for d in detail:
        by_batch.setdefault(d["batch_id"], []).append({
            "sensorId": d["sensor_id"], "parameter": d["parameter"],
            "location": d["location"], "unit": d["unit"],
            "value": round(d["value"], 4), "status": d["status"],
        })

    return [{
        "id": r["batch_id"],
        # A reference somebody can read out over a radio.
        "reference": "BS-%04d" % r["batch_id"],
        "plantId": plant_id(r["plant_code"]), "plantName": r["plant_name"],
        "sampleTs": r["sample_ts"].isoformat(),
        "enteredBy": r["entered_by"],
        "enteredAt": r["entered_at"].isoformat(),
        "note": r["note"],
        "readings": int(r["readings"] or 0),
        "critical": int(r["critical"] or 0),
        "warning": int(r["warning"] or 0),
        "edits": int(r["edits"] or 0),
        "lastEditedBy": r["last_edited_by"],
        "lastEditedAt": (r["last_edited_at"].isoformat()
                         if r["last_edited_at"] else None),
        "values": by_batch.get(r["batch_id"], []),
    } for r in rows]


@app.patch("/manual/batches/{batch_id}")
def edit_manual_batch(batch_id: int, payload: dict = Body(...)) -> dict:
    """Correct values in a submission.

    A mistyped lab result has to be fixable — the alternative is a wrong figure
    in a compliance record forever. But every change is written to
    manual_reading_edits first: a value that can be altered without a trace is
    worse than one that cannot be altered at all.

    Corrections are re-graded against the same bands, so fixing a digit also
    fixes whether it counts as a breach.
    """
    edited_by = (payload.get("editedBy") or "").strip()
    reason = (payload.get("reason") or "").strip() or None
    changes = payload.get("readings") or []

    if not edited_by:
        raise HTTPException(400, "editedBy is required")
    if not isinstance(changes, list) or not changes:
        raise HTTPException(400, "readings must be a non-empty list")

    batch = q("SELECT batch_id, sample_ts FROM manual_batches WHERE batch_id = %s",
              (batch_id,))
    if not batch:
        raise HTTPException(404, "no such submission")
    ts = batch[0]["sample_ts"]

    wanted = [str(c.get("sensorId") or "").strip() for c in changes]
    meta = {r["sensor_id"]: r for r in q("""
        SELECT s.sensor_id, s.parameter, s.unit,
               b.warn_min, b.warn_max, b.crit_min, b.crit_max
        FROM sensors s
        LEFT JOIN threshold_bands b
               ON b.parameter = s.parameter AND b.stage = s.stage
        WHERE s.sensor_id = ANY(%s)
    """, (wanted,))}

    results, updated = [], 0
    with psycopg.connect(DSN, row_factory=dict_row) as conn, conn.cursor() as cur:
        for c in changes:
            sid = str(c.get("sensorId") or "").strip()
            m = meta.get(sid)
            if m is None:
                results.append({"sensorId": sid, "ok": False, "error": "no such sensor"})
                continue
            try:
                value = round(float(c.get("value")), 4)
                if value != value or value in (float("inf"), float("-inf")):
                    raise ValueError
            except (TypeError, ValueError):
                results.append({"sensorId": sid, "ok": False, "error": "not a number"})
                continue

            cur.execute("""SELECT value FROM readings
                           WHERE batch_id = %s AND sensor_id = %s AND ts = %s""",
                        (batch_id, sid, ts))
            row = cur.fetchone()
            if row is None:
                results.append({"sensorId": sid, "ok": False,
                                "error": "not part of this submission"})
                continue
            old = row["value"]
            if old == value:
                results.append({"sensorId": sid, "ok": True, "value": value,
                                "changed": False})
                continue

            if m["crit_min"] is None:
                status = "normal"
            elif value < m["crit_min"] or value > m["crit_max"]:
                status = "critical"
            elif value < m["warn_min"] or value > m["warn_max"]:
                status = "warning"
            else:
                status = "normal"

            # The trail is written before the value moves, so a failure part
            # way through leaves a record of intent rather than a silent gap.
            cur.execute("""
                INSERT INTO manual_reading_edits
                    (batch_id, sensor_id, ts, old_value, new_value, edited_by, reason)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (batch_id, sid, ts, old, value, edited_by, reason))
            try:
                cur.execute("""UPDATE readings SET value = %s, status = %s
                               WHERE batch_id = %s AND sensor_id = %s AND ts = %s""",
                            (value, status, batch_id, sid, ts))
            except psycopg.errors.Error as exc:
                conn.rollback()
                raise HTTPException(409,
                    "this reading is in compressed storage and cannot be corrected "
                    "in place — readings are compressed after 30 days") from exc
            cur.execute("""UPDATE latest_readings SET value = %s, status = %s
                           WHERE sensor_id = %s AND ts = %s""", (value, status, sid, ts))
            updated += 1
            results.append({"sensorId": sid, "ok": True, "value": value,
                            "status": status, "changed": True, "previous": old,
                            "parameter": m["parameter"], "unit": m["unit"]})
        conn.commit()

    return {"batchId": batch_id, "updated": updated, "results": results}


@app.get("/manual/batches/{batch_id}/edits")
def manual_batch_edits(batch_id: int) -> list[dict]:
    """Every correction made to a submission, oldest first."""
    rows = q("""
        SELECT e.sensor_id, s.parameter, s.location, s.unit,
               e.old_value, e.new_value, e.edited_by, e.edited_at, e.reason
        FROM manual_reading_edits e
        JOIN sensors s USING (sensor_id)
        WHERE e.batch_id = %s
        ORDER BY e.edited_at
    """, (batch_id,))
    return [{
        "sensorId": r["sensor_id"], "parameter": r["parameter"],
        "location": r["location"], "unit": r["unit"],
        "from": r["old_value"], "to": r["new_value"],
        "editedBy": r["edited_by"], "editedAt": r["edited_at"].isoformat(),
        "reason": r["reason"],
    } for r in rows]


@app.get("/manual/readings")
def manual_readings(limit: int = Query(50, ge=1, le=200)) -> list[dict]:
    """Recently entered readings, newest first — the entry log."""
    rows = q("""
        SELECT r.sensor_id, s.tag, s.parameter, s.unit, s.location,
               p.name AS plant_name, r.ts, r.value, r.status,
               r.entered_by, r.entered_at, r.note
        FROM readings r
        JOIN sensors s USING (sensor_id)
        JOIN plants  p USING (plant_code)
        WHERE r.source = 'manual'
        ORDER BY r.entered_at DESC NULLS LAST
        LIMIT %s
    """, (limit,))
    return [{
        "sensorId": r["sensor_id"], "tag": r["tag"], "parameter": r["parameter"],
        "unit": r["unit"], "location": r["location"], "plantName": r["plant_name"],
        "ts": r["ts"].isoformat(), "value": round(r["value"], 4),
        "status": r["status"], "enteredBy": r["entered_by"],
        "enteredAt": r["entered_at"].isoformat() if r["entered_at"] else None,
        "note": r["note"],
    } for r in rows]


@app.get("/users")
def users() -> list[dict]:
    """Accounts on this system.

    Ours, not the client's — nobody sends a users table. It is seeded with the
    one account that exists and grows as administrators add people.

    password_hash is never returned. It is not shown, not exported, and not
    available to the browser even for the account making the request.
    """
    rows = q("""
        SELECT user_id, email, name, role, status, plant_codes,
               last_login, created_at,
               (password_hash IS NOT NULL) AS can_sign_in
        FROM app_users ORDER BY name
    """)
    return [{
        "id": str(r["user_id"]),
        "email": r["email"],
        "name": r["name"],
        "role": r["role"],
        "status": r["status"],
        # Empty means every plant — a fleet role rather than a site one.
        "plants": r["plant_codes"] or [],
        "lastLogin": r["last_login"].isoformat() if r["last_login"] else None,
        "createdAt": r["created_at"].isoformat(),
        # False until real authentication exists. An account an administrator
        # created but nobody can sign into is worth showing as exactly that.
        "canSignIn": r["can_sign_in"],
    } for r in rows]


@app.get("/knowledge")
def knowledge(q_text: str | None = Query(None, alias="q"),
              limit: int = Query(50, ge=1, le=200)) -> list[dict]:
    """Procedures and troubleshooting notes.

    Content the client authors and we store. Empty until somebody writes
    something, which is the honest state for a new deployment — the fixture
    that stood here contained articles nobody had written.
    """
    if q_text:
        rows = q("""
            SELECT article_id, title, category, tags, plant_code, author,
                   updated_at, left(body, 240) AS excerpt
            FROM kb_articles
            WHERE to_tsvector('english', title || ' ' || body)
                  @@ plainto_tsquery('english', %s)
            ORDER BY updated_at DESC LIMIT %s
        """, (q_text, limit))
    else:
        rows = q("""
            SELECT article_id, title, category, tags, plant_code, author,
                   updated_at, left(body, 240) AS excerpt
            FROM kb_articles ORDER BY updated_at DESC LIMIT %s
        """, (limit,))
    return [{
        "id": str(r["article_id"]),
        "title": r["title"],
        "category": r["category"],
        "tags": r["tags"] or [],
        "plantCode": r["plant_code"],
        "author": r["author"],
        "updatedAt": r["updated_at"].isoformat(),
        "excerpt": r["excerpt"],
    } for r in rows]


@app.get("/audit")
def audit(limit: int = Query(100, ge=1, le=500)) -> list[dict]:
    """What this system did, and when.

    Not plant commands — there is no write path, so there are none to record.
    This is the ingest's own history: what ran, what it loaded, whether the
    row counts reconciled, and what it refused.

    That is the audit trail an operator actually needs to answer "why does the
    chart change" — and unlike an equipment log, every input already exists.
    """
    rows = q("""
        SELECT run_id, started_at, finished_at, files_seen, files_skipped,
               readings_in, readings_out, reconciled, error, rejections
        FROM ingest_runs
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT %s
    """, (limit,))
    out = []
    for r in rows:
        dropped = (r["readings_in"] or 0) - (r["readings_out"] or 0)
        out.append({
            "id": str(r["run_id"]),
            "action": "ingest",
            "startedAt": r["started_at"].isoformat() if r["started_at"] else None,
            "finishedAt": r["finished_at"].isoformat() if r["finished_at"] else None,
            "durationSeconds": (
                round((r["finished_at"] - r["started_at"]).total_seconds(), 1)
                if r["started_at"] and r["finished_at"] else None),
            "filesSeen": r["files_seen"],
            "filesSkipped": r["files_skipped"],
            "readingsIn": r["readings_in"],
            "readingsOut": r["readings_out"],
            "dropped": dropped,
            # null means the run was not checked — every file was already
            # loaded, so there was nothing to reconcile. Distinct from false.
            "reconciled": r["reconciled"],
            "error": r["error"],
            "rejections": r["rejections"],
            "outcome": ("error" if r["error"]
                        else "failed" if r["reconciled"] is False
                        else "no-op" if r["readings_out"] == 0
                        else "ok"),
        })
    return out


@app.get("/energy")
def energy(hours: int = Query(24, ge=1, le=8760)) -> dict:
    """Consumption per motor control centre, plus instantaneous load.

    Consumption comes from counter differences, never from the counter itself:
    a kWh meter reports a lifetime total, so energy used is the change between
    two readings. Storing the total rather than the delta means a missed poll
    costs nothing — the next difference spans the gap and is still correct.
    """
    newest = q("SELECT max(ts) AS t FROM readings")[0]["t"]
    if newest is None:
        return {"meters": [], "totalKwh": None, "hours": hours}
    since = newest - timedelta(hours=hours)

    rows = q("""
        SELECT s.sensor_id, s.tag, s.location, s.plant_code, p.name AS plant_name,
               sum(c.delta)          AS kwh,
               max(c.total)::bigint  AS lifetime,
               count(*)              AS points
        FROM counter_deltas c
        JOIN sensors s USING (sensor_id)
        JOIN plants  p USING (plant_code)
        WHERE s.parameter = 'energy' AND c.ts > %s AND c.delta IS NOT NULL
        GROUP BY s.sensor_id, s.tag, s.location, s.plant_code, p.name
        ORDER BY s.tag
    """, (since,))

    # Instantaneous load, which is a genuine analogue input rather than a total.
    load = {r["location"]: r["kw"] for r in q("""
        SELECT s.location, round(l.value::numeric, 1) AS kw
        FROM latest_readings l JOIN sensors s USING (sensor_id)
        WHERE s.parameter = 'power'
    """)}

    meters = [{
        "id": r["sensor_id"], "tag": r["tag"], "location": r["location"],
        "plantId": plant_id(r["plant_code"]), "plantName": r["plant_name"],
        "kwh": round(r["kwh"], 1) if r["kwh"] is not None else None,
        "lifetimeKwh": r["lifetime"],
        "currentKw": float(load[r["location"]]) if r["location"] in load else None,
        "readings": r["points"],
    } for r in rows]

    total = sum(m["kwh"] or 0 for m in meters)
    return {
        "meters": meters,
        "totalKwh": round(total, 1) if meters else None,
        "hours": hours,
    }


@app.get("/equipment")
def equipment() -> list[dict]:
    """Pumps, blowers and valves, assembled from their tags.

    There is no equipment table. A plant's asset register lives in a CMMS, and
    we have not been given one — but the PLC already tells us which equipment
    exists and how it is behaving, because every pump carries a run bit, a
    fault bit and an hours-run counter under a shared tag suffix.

    XS-P-101 / XA-P-101 / KQ-P-101 are three views of one pump. Grouping by the
    suffix reconstructs the asset without inventing anything.
    """
    rows = q("""
        SELECT s.tag, s.parameter, s.location, s.plant_code, s.stage,
               p.name AS plant_name, l.value, l.ts, l.status
        FROM sensors s
        JOIN plants p USING (plant_code)
        LEFT JOIN latest_readings l USING (sensor_id)
        WHERE s.parameter IN ('run_status','fault','run_hours','start_count',
                              'valve_open','valve_closed')
        ORDER BY s.tag
    """)

    assets: dict[str, dict] = {}
    for r in rows:
        # XS-P-101 -> P-101.  KQ-P-101S is the start counter for the same asset.
        parts = r["tag"].split("-", 1)
        if len(parts) != 2:
            continue
        key = parts[1].rstrip("S") if r["parameter"] == "start_count" else parts[1]
        a = assets.setdefault(key, {
            "id": key, "name": r["location"], "plantId": plant_id(r["plant_code"]),
            "plantName": r["plant_name"], "stage": r["stage"],
            "kind": "valve" if key.startswith("V-") else
                    "blower" if key.startswith("B-") else "pump",
            "running": None, "fault": None, "runHours": None,
            "startCount": None, "valveOpen": None, "valveClosed": None,
            "lastSeen": None,
        })
        v = r["value"]
        if r["parameter"] == "run_status":   a["running"] = bool(v) if v is not None else None
        elif r["parameter"] == "fault":      a["fault"] = bool(v) if v is not None else None
        elif r["parameter"] == "run_hours":  a["runHours"] = int(v) if v is not None else None
        elif r["parameter"] == "start_count":a["startCount"] = int(v) if v is not None else None
        elif r["parameter"] == "valve_open": a["valveOpen"] = bool(v) if v is not None else None
        elif r["parameter"] == "valve_closed":a["valveClosed"] = bool(v) if v is not None else None
        if r["ts"] and (a["lastSeen"] is None or r["ts"].isoformat() > a["lastSeen"]):
            a["lastSeen"] = r["ts"].isoformat()

    out = []
    for a in assets.values():
        # A valve reporting neither open nor closed is travelling; reporting
        # both means a limit switch has failed. Only visible because they are
        # two separate tags.
        if a["kind"] == "valve" and a["valveOpen"] and a["valveClosed"]:
            a["health"] = "fault"
            a["note"] = "both limit switches set — one has failed"
        elif a["fault"]:
            a["health"] = "fault"
            a["note"] = "fault bit set"
        elif a["runHours"] is not None and a["runHours"] > 30000:
            # A conventional overhaul interval. The real figure comes from the
            # manufacturer's manual, which we do not have.
            a["health"] = "due"
            a["note"] = f"{a['runHours']:,} hours run — service interval assumed"
        else:
            a["health"] = "ok"
            a["note"] = None
        out.append(a)
    return sorted(out, key=lambda a: (a["health"] != "fault", a["id"]))


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
