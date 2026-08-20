"""Vendor format -> canonical.

This module is the ONLY place that knows what a gateway's JSON looks like.
Everything after it is format-blind, so when MWTS confirms their real shape,
one function changes here and nothing else moves.

"Custom JSON" has no specification. Every vendor invents its own field names,
nesting, timestamp format and value type. The eight shapes below are the ones
seen in the field; sample files for each are in Raw_data_PLC/formats/.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from .models import Envelope, RawReading

log = logging.getLogger(__name__)


class UnknownFormat(Exception):
    """No adapter recognised the payload. Do not guess — fail the file."""


class ParseError(Exception):
    """The bytes are not valid JSON, or the envelope is malformed."""


# ── timestamps ────────────────────────────────────────────────────────────
def _to_dt(v: object) -> datetime:
    """Epoch seconds, epoch milliseconds, or ISO 8601.

    Always returns tz-aware UTC. A naive datetime in a pipeline is a bug
    waiting for the first DST boundary.
    """
    if isinstance(v, str):
        s = v.strip()
        # Epoch as a string is common — shape G quotes every field, including
        # the timestamp. Check this before fromisoformat, which rejects digits.
        if not (s.lstrip("-").replace(".", "", 1).isdigit()):
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        v = s
    n = float(v)                                    # type: ignore[arg-type]
    if n > 1e11:                                    # milliseconds
        n /= 1000.0
    return datetime.fromtimestamp(n, tz=timezone.utc)


def _num(v: object) -> float:
    """Values arrive as strings more often than anyone expects.

    "017632" is valid JSON and int() handles it; "0012.80" needs float() or it
    silently becomes 12. Leading zeros are NOT octal here.
    """
    if isinstance(v, str):
        return float(v.strip() or "nan")
    return float(v)                                 # type: ignore[arg-type]


_QUALITY_WORDS = {
    "GOOD": 192, "OK": 192, "VALID": 192,
    "UNCERTAIN": 64, "DOUBTFUL": 64, "SUSPECT": 64,
    "BAD": 0, "ERROR": 0, "FAULT": 0,
}


def _quality(v: object) -> int | None:
    """Numeric OPC DA code, or a word. None means no quality was reported."""
    if v is None:
        return None
    if isinstance(v, str):
        return _QUALITY_WORDS.get(v.strip().upper())
    return int(v)                                   # type: ignore[arg-type]


# ── shape A: {gw, ts, seq, d:[{t,v,q}]} — Moxa, Teltonika, most gateways ──
def _shape_a(p: dict) -> Envelope:
    ts = _to_dt(p["ts"])
    return Envelope(
        gateway_id=p.get("gw") or p.get("gateway") or "unknown",
        ts=ts, seq=p.get("seq"), rssi=p.get("rssi"),
        vin=p.get("vin"), temp=p.get("temp"),
        readings=tuple(
            RawReading(tag=r["t"], raw=_num(r["v"]), quality=_quality(r.get("q")),
                       ts=_to_dt(r["ts"]) if "ts" in r else ts, unit=r.get("u"))
            for r in p["d"]
        ),
    )


# ── shape B: {deviceName, tagList:[{tagName, value, quality}]} — Advantech ─
def _shape_b(p: dict) -> Envelope:
    ts = _to_dt(p.get("publishTime") or p.get("timestamp"))
    return Envelope(
        gateway_id=p.get("deviceName") or p.get("device") or "unknown",
        ts=ts, seq=p.get("seq"),
        readings=tuple(
            RawReading(tag=r["tagName"], raw=_num(r["value"]),
                       quality=_quality(r.get("quality")),
                       ts=_to_dt(r["timestamp"]) if r.get("timestamp") else ts)
            for r in p["tagList"]
        ),
    )


# ── shape C: {values:{TAG:v}, qualities:{TAG:q}} — REST-posting gateways ──
def _shape_c(p: dict) -> Envelope:
    """Two parallel objects. They can drift out of alignment with no error,
    which is why a missing quality is recorded as None rather than assumed good.
    """
    ts = _to_dt(p.get("timestamp") or p.get("ts"))
    quals = p.get("qualities", {})
    return Envelope(
        gateway_id=p.get("device") or p.get("gw") or "unknown",
        ts=ts,
        readings=tuple(
            RawReading(tag=tag, raw=_num(v), quality=_quality(quals.get(tag)), ts=ts)
            for tag, v in p["values"].items()
        ),
    )


# ── shape D: {cols:[...], rows:[[tag,v,q]]} — positional, smallest payload ─
def _shape_d(p: dict) -> Envelope:
    """Column order is implicit. Resolve indices from `cols` rather than
    hardcoding — a vendor reordering them otherwise breaks this silently.
    """
    cols = p["cols"]
    i_tag = next(i for i, c in enumerate(cols) if c in ("tag", "t", "name"))
    i_val = next(i for i, c in enumerate(cols) if c in ("value", "v", "val"))
    i_qua = next((i for i, c in enumerate(cols) if c in ("quality", "q")), None)
    ts = _to_dt(p.get("t") or p.get("ts"))
    return Envelope(
        gateway_id=p.get("id") or p.get("gw") or "unknown", ts=ts,
        readings=tuple(
            RawReading(tag=row[i_tag], raw=_num(row[i_val]),
                       quality=_quality(row[i_qua]) if i_qua is not None else None,
                       ts=ts)
            for row in p["rows"]
        ),
    )


# ── shape E: {areas:[{area, tags:[...]}]} — mirrors plant hierarchy ───────
def _shape_e(p: dict) -> Envelope:
    """The `area` here is NOT authoritative. Location comes from the register
    map; a gateway's idea of plant structure is configuration, not fact.
    """
    ts = _to_dt(p.get("collectedAt") or p.get("ts"))
    return Envelope(
        gateway_id=p.get("gateway") or "unknown", ts=ts,
        readings=tuple(
            RawReading(tag=t["tag"], raw=_num(t.get("val", t.get("value"))),
                       quality=_quality(t.get("qual", t.get("quality"))), ts=ts)
            for area in p["areas"] for t in area["tags"]
        ),
    )


# ── shape G: every value a zero-padded string ─────────────────────────────
def _shape_g(p: dict) -> Envelope:
    ts = _to_dt(p["ts"])
    return Envelope(
        gateway_id=p.get("gateway_id") or "unknown", ts=ts,
        readings=tuple(
            RawReading(tag=r["tag_name"], raw=_num(r["tag_value"]),
                       quality=_quality(r.get("tag_quality")), ts=ts)
            for r in p["data"]
        ),
    )


# ── shape H: word quality, per-tag scan times that drift ──────────────────
def _shape_h(p: dict) -> Envelope:
    ts = _to_dt(p["batchTime"])
    return Envelope(
        gateway_id=p.get("source") or "unknown", ts=ts,
        readings=tuple(
            RawReading(tag=r["point"], raw=_num(r["reading"]),
                       quality=_quality(r.get("status")),
                       ts=_to_dt(r["scanTime"]) if r.get("scanTime") else ts)
            for r in p["readings"]
        ),
    )


# ── Sparkplug B — the only shape that carries its own register map ────────
def _sparkplug(p: dict) -> Envelope:
    """`engUnit`/`engLow`/`engHigh` arrive in the birth certificate, so unit
    and span travel with the data and the register map is not needed for
    these tags. Values are already engineering units, not counts.
    """
    ts = _to_dt(p["timestamp"])
    out = []
    for m in p["metrics"]:
        props = m.get("properties", {})

        def prop(k):
            v = props.get(k)
            return v.get("value") if isinstance(v, dict) else v

        lo, hi = prop("engLow"), prop("engHigh")
        out.append(RawReading(
            tag=m["name"].split("/")[-1],
            raw=_num(m["value"]),
            quality=_quality(prop("quality")) or 192,
            ts=_to_dt(m["timestamp"]) if m.get("timestamp") else ts,
            unit=prop("engUnit"),
            span=(float(lo), float(hi)) if lo is not None and hi is not None else None,
        ))
    return Envelope(gateway_id=p.get("topic", "/").split("/")[-1], ts=ts,
                    readings=tuple(out))


# ── OPC UA PubSub — quality convention is INVERTED ───────────────────────
def _opcua(p: dict) -> Envelope:
    """StatusCode 0 means GOOD here, the opposite of OPC DA where 0 is bad.
    Normalised to the DA convention on the way in so nothing downstream has
    to know which family the file came from.
    """
    msg = p["Messages"][0]
    ts = _to_dt(msg["Timestamp"])
    out = []
    for tag, item in msg["Payload"].items():
        code = item.get("StatusCode", {}).get("Code", 0)
        out.append(RawReading(
            tag=tag, raw=_num(item["Value"]["Body"]),
            quality=192 if code == 0 else (64 if code == 0x40000000 else 0),
            ts=_to_dt(item["SourceTimestamp"]) if item.get("SourceTimestamp") else ts,
        ))
    return Envelope(gateway_id=p.get("PublisherId", "unknown"), ts=ts,
                    readings=tuple(out))


# ── detection ─────────────────────────────────────────────────────────────
# Ordered most specific first. Never guess: an unrecognised payload raises
# rather than being coerced into the closest-looking shape.
_DETECT = (
    ("metrics",   _sparkplug),
    ("Messages",  _opcua),
    ("tagList",   _shape_b),
    ("values",    _shape_c),
    ("rows",      _shape_d),
    ("areas",     _shape_e),
    ("data",      _shape_g),
    ("readings",  _shape_h),
    ("d",         _shape_a),
)


def adapt(payload: dict) -> Envelope:
    """Detect the vendor shape and return the canonical envelope."""
    # USGS nests everything under value.timeSeries. Checked first because a
    # bare "value" key is too generic to sit in the table below.
    if isinstance(payload.get("value"), dict) and "timeSeries" in payload["value"]:
        return _usgs(payload)

    for key, fn in _DETECT:
        if key in payload:
            return fn(payload)
    raise UnknownFormat(f"no adapter for keys: {sorted(payload)[:8]}")


def parse_file(raw: bytes | str, *, key: str = "") -> list[Envelope]:
    """Parse one object's bytes. Returns a list because NDJSON holds many.

    Gzip is handled by the caller (storage layer), not here — this function
    stays pure so it is testable with a literal.
    """
    text = raw.decode("utf-8") if isinstance(raw, bytes) else raw
    text = text.lstrip("﻿").strip()            # gateways emit BOMs
    if not text:
        raise ParseError(f"{key}: empty file")

    # NDJSON: one JSON object per line, no envelope. json.loads() fails on it.
    if key.endswith(".jsonl") or key.endswith(".ndjson"):
        rows = [json.loads(ln) for ln in text.splitlines() if ln.strip()]
        if rows and "tag" in rows[0]:               # flat readings, no envelope
            ts = _to_dt(rows[0].get("ts") or rows[0].get("timestamp"))
            return [Envelope(
                gateway_id=rows[0].get("gw", "unknown"), ts=ts,
                readings=tuple(
                    RawReading(tag=r["tag"], raw=_num(r["value"]),
                               quality=_quality(r.get("q")),
                               ts=_to_dt(r.get("ts") or r.get("timestamp")))
                    for r in rows),
            )]
        return [adapt(r) for r in rows]

    try:
        payload = json.loads(text)
    except json.JSONDecodeError as e:
        # Truncated mid-write is common: the gateway lost power. Fail the whole
        # file — a partially ingested file is worse than a missing one.
        raise ParseError(f"{key}: {e}") from e

    if isinstance(payload, list):
        return [adapt(p) for p in payload]
    if "polls" in payload:                          # batched multi-poll file
        return [adapt(p) for p in payload["polls"]]
    return [adapt(payload)]


# ── USGS Water Services — real public monitoring data ────────────────────
# https://waterservices.usgs.gov/docs/instantaneous-values/
#
# Not a PLC gateway. Included because it is real: live instruments at real
# sites, with a quality convention, sentinel values and formatting habits that
# nobody here invented. Everything else this pipeline parses was either
# written from a specification or generated by us, and both share the same
# blind spot — they only contain what we already thought to handle.
#
# Structural differences worth knowing:
#   * one object per site AND parameter, rather than one per poll
#   * values are strings: "0.00", never 0.0
#   * quality is a list of letter codes, not a number
#   * missing data is an explicit noDataValue per series, not a global sentinel
#   * timestamps carry a real UTC offset that changes with daylight saving

# USGS qualifier codes -> OPC DA quality. Sources: the agency's own
# documentation of provisional versus approved data.
_USGS_QUALITY = {
    "A": 192,    # approved for publication
    "P": 192,    # provisional — normal for real-time, not a fault
    "e": 64,     # estimated
    "Rat": 64,   # affected by a rating change
    "Mnt": 64,   # under maintenance — reading exists but is not trustworthy
    "Eqp": 0,    # equipment malfunction
    "Dis": 0,    # discontinued
    "Ice": 0,    # ice-affected
    "Bkw": 64,   # backwater-affected
    "Ssn": 64,   # seasonal, outside the operating period
}

# USGS parameter codes -> the names this pipeline uses.
_USGS_PARAM = {
    "00010": "temperature",
    "00060": "flow",
    "00095": "conductivity",
    "00300": "DO",
    "00400": "pH",
    "63680": "turbidity",
}


def _usgs(payload: dict) -> Envelope:
    """One USGS instantaneous-values response -> one envelope per timestamp.

    Flattens site+parameter series into tag-style readings: `02228500:00060`
    identifies the site and what it measures, which is the same information a
    register map supplies for a PLC tag.
    """
    series = payload["value"]["timeSeries"]
    out: list[RawReading] = []
    latest = None

    for s in series:
        site = s["sourceInfo"]["siteCode"][0]["value"]
        code = s["variable"]["variableCode"][0]["value"]
        # Per-series, not global. A series that uses -999999 says so here;
        # assuming one sentinel for every source is how a real reading of
        # -999999 would get discarded, or a missing one kept.
        no_data = float(s["variable"].get("noDataValue", -999999))

        for block in s["values"]:
            for p in block["value"]:
                ts = _to_dt(p["dateTime"])
                if latest is None or ts > latest:
                    latest = ts

                quals = p.get("qualifiers") or []
                # Worst qualifier wins. A reading marked both provisional and
                # equipment-malfunction is a malfunction.
                q = min((_USGS_QUALITY.get(x, 64) for x in quals), default=None)

                raw = _num(p["value"])
                out.append(RawReading(
                    tag=f"{site}:{code}",
                    raw=raw if raw != no_data else 32767,   # normalise to a sentinel we drop
                    quality=q,
                    ts=ts,
                    unit=s["variable"]["unit"]["unitCode"],
                ))

    return Envelope(
        gateway_id=payload["value"]["queryInfo"].get("queryURL", "usgs"),
        ts=latest or datetime.now(timezone.utc),
        readings=tuple(out),
    )


def usgs_tag_map(payload: dict) -> dict:
    """Build a register map from the response itself.

    USGS publishes what each series measures, its unit and its site — so for
    this source the register map travels with the data. That is exactly what
    MWTS's gateway does NOT do, and the contrast is the clearest illustration
    of why their map is the blocking item.
    """
    from .models import TagMapEntry
    from .thresholds import classify_stage

    entries = {}
    for s in payload["value"]["timeSeries"]:
        site = s["sourceInfo"]["siteCode"][0]["value"]
        code = s["variable"]["variableCode"][0]["value"]
        param = _USGS_PARAM.get(code)
        if param is None:
            continue
        tag = f"{site}:{code}"
        name = s["sourceInfo"]["siteName"]
        entries[tag] = TagMapEntry(
            tag=tag,
            plant_code="USGS",
            sensor_id=f"usgs-{site}-{code}",
            parameter=param,
            unit=s["variable"]["unit"]["unitCode"],
            location=name,
            # A river gauge is raw water by definition — upstream of any
            # treatment. Applying finished-water limits to it would alarm on
            # every reading.
            stage="raw",
            # Values arrive already in engineering units, so the span is only
            # used for the plausibility check. Taken wide deliberately.
            span_low=-100.0,
            span_high=1_000_000.0,
            count_low=0,
            count_high=1,
        )
    return entries
