"""Normalise, clean, convert.

Pure functions: no I/O, no database, no clock. That is what makes them
testable with literals and safe to re-run over historical data.

The order of the cleaning steps is not arbitrary — each assumes the one before
it has run. Converting before checking quality would scale a dead probe's zero
into a plausible reading.
"""
from __future__ import annotations

import logging
from collections import Counter

from .models import Envelope, RawReading, Reading, Rejection, TagMapEntry
from .thresholds import evaluate, resolve_band

log = logging.getLogger(__name__)

# Values that are not measurements. A gateway reports over-range by sending the
# register limit, and a 0 with bad quality is a dead probe — but a 0 with GOOD
# quality can be a genuine zero (a stopped pump), so quality is checked first.
SENTINELS = frozenset({32767, -32768, 9999, -9999, 999, -999})

GOOD, UNCERTAIN = 192, 64


def convert(counts: float, entry: TagMapEntry) -> float:
    """Raw counts -> engineering units.

    The span belongs to the *instrument*, not the parameter. A raw-water
    turbidity meter is ranged 0-100 NTU; a filter-effluent meter 0-10. Applying
    the wrong one turns 0.31 NTU into 3.10 — ten times the regulatory limit,
    from one wrong column, with nothing looking wrong.
    """
    frac = (counts - entry.count_low) / (entry.count_high - entry.count_low)
    return entry.span_low + frac * (entry.span_high - entry.span_low)


def looks_like_counts(value: float, entry: TagMapEntry) -> bool:
    """Heuristic for the mixed-scaling case: some tags raw, some pre-scaled,
    with no flag saying which (see Raw_data_PLC/edge-cases/12).

    Only used when the gateway's `sends_scaled` setting is unknown. It is a
    guess, and it is why "does the gateway scale, or send raw counts?" is on
    the list of questions for the plant — one sentence from them removes it.
    """
    if entry.span_high >= entry.count_low:
        return False                       # spans overlap counts; cannot tell
    return value > entry.span_high * 1.5


def process_envelope(
    env: Envelope,
    tag_map: dict[str, TagMapEntry],
    *,
    source_file: str,
    sends_scaled: bool | None = False,
    drop_uncertain: bool = True,
) -> tuple[list[Reading], list[Rejection], Counter]:
    """One file's readings -> rows ready to INSERT, plus what was dropped and why.

    Returns rejections rather than discarding them: a rising bad-quality rate is
    a failing instrument, and it is one of the few predictive signals available
    without a model.
    """
    rows: list[Reading] = []
    rejects: list[Rejection] = []
    counts: Counter = Counter()

    def reject(r: RawReading, reason, entry: TagMapEntry | None = None) -> None:
        counts[reason] += 1
        rejects.append(Rejection(
            ts=r.ts, tag=r.tag, reason=reason, source_file=source_file,
            raw_value=r.raw, quality=r.quality,
            plant_code=entry.plant_code if entry else None,
        ))

    for r in env.readings:
        # 1 ── The register map is the filter. An unmapped tag never reaches
        #      the database: this is the security boundary, not a convenience.
        entry = tag_map.get(r.tag)
        if entry is None:
            reject(r, "unmapped_tag")
            continue

        # 2 ── Quality, before anything numeric. A dead probe's zero must not
        #      be scaled into something plausible.
        if r.quality is None:
            # No quality field at all. Not the same as good — flag it, keep the
            # reading, and record that the gateway is not reporting quality.
            counts["no_quality_field"] += 1
        elif r.quality < UNCERTAIN:
            reject(r, "bad_quality", entry)
            continue
        elif r.quality < GOOD:
            if drop_uncertain:
                reject(r, "uncertain_quality", entry)
                continue

        # 3 ── Sentinels. Over-range markers, not values. Storing them poisons
        #      every average downstream.
        if r.raw in SENTINELS:
            reject(r, "sentinel", entry)
            continue

        # 4 ── Convert, according to what kind of tag this is.
        #
        #      Only an analogue input is scaled. A digital is a state and a
        #      counter is a total; putting either through the span calculation
        #      produces a number that looks like a reading and is not one.
        if entry.data_type == "digital":
            # 0 or 1. Anything else means the register does not hold what the
            # map says it holds — a mis-mapped address, most likely.
            if r.raw not in (0.0, 1.0):
                reject(r, "out_of_span", entry)
                continue
            value = r.raw
        elif entry.data_type == "counter":
            # Stored as the raw lifetime total. Consumption is the difference
            # between two readings, derived at query time — see the
            # counter_deltas view. Storing the total rather than the delta
            # means a missed poll costs nothing: the next difference spans the
            # gap and is still correct.
            #
            # A counter must never decrease. When it does, the meter has
            # rolled over or been replaced, and that is a fact about the
            # instrument rather than a bad reading, so it is kept.
            value = r.raw
        elif r.span is not None:
            # Sparkplug B and OPC UA supply their own span, which takes
            # precedence over the register map — it came with the data.
            value = r.raw
        elif sends_scaled is True:
            value = r.raw
        elif sends_scaled is None and not looks_like_counts(r.raw, entry):
            value = r.raw                                    # heuristic: pre-scaled
        else:
            value = convert(r.raw, entry)

        # 5 ── Plausibility against the INSTRUMENT span, not the alarm limit.
        #      Outside the span is a scaling error, not a process excursion —
        #      and if every reading fails this, the count range is wrong.
        #
        #      Skipped for digital and counter: a bit has no span, and a
        #      lifetime total exceeds any span by design.
        if entry.data_type == "analog":
            span_lo, span_hi = (r.span or (entry.span_low, entry.span_high))
            margin = (span_hi - span_lo) * 0.02              # ADC noise at the rails
            if not (span_lo - margin <= value <= span_hi + margin):
                reject(r, "out_of_span", entry)
                continue

        # 6 ── Status.
        #
        #      Alarm bands describe a measurement, so they apply to analogue
        #      tags only. A digital carries its meaning in the tag itself — a
        #      fault bit set is a fault — and a counter has no band at all: a
        #      kWh total is never "too high".
        if entry.data_type == "analog":
            status = evaluate(value, resolve_band(entry.parameter, entry.stage))
        elif entry.data_type == "digital":
            # Alarm-class tags follow ISA-5.1: XA is an alarm, and a set bit
            # on one is the fault it names. Every other digital is a state.
            is_alarm_tag = entry.tag.split("-")[0].upper() in ("XA", "UA", "YA")
            status = "critical" if (is_alarm_tag and value == 1.0) else "normal"
        else:
            status = "normal"

        rows.append(Reading(
            sensor_id=entry.sensor_id,
            ts=r.ts,
            value=round(value, 4),
            status=status,
            source_file=source_file,
            quality=r.quality,
            raw_count=int(r.raw) if float(r.raw).is_integer() else None,
        ))

    return rows, rejects, counts


def reconcile(readings_in: int, readings_out: int, counts: Counter) -> bool:
    """readings_in - readings_out must equal the sum of drop reasons.

    If it does not, the pipeline is losing data somewhere it does not know
    about — which no other check catches. Fail the run rather than report a
    successful ingest that quietly dropped rows.
    """
    dropped = sum(v for k, v in counts.items() if k != "no_quality_field")
    ok = readings_in - readings_out == dropped
    if not ok:
        log.error("reconciliation failed", extra={
            "readings_in": readings_in, "readings_out": readings_out,
            "dropped": dropped, "unaccounted": readings_in - readings_out - dropped,
        })
    return ok
