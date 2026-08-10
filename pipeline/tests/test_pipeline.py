"""Tests for the pure functions.

The failure cases matter more than the clean path — most defects in this
pipeline will be about missing, stale or wrong-by-a-factor data, not about a
well-formed file.

    pytest -q
"""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mwts_pipeline.adapters import ParseError, adapt, parse_file      # noqa: E402
from mwts_pipeline.models import Envelope, RawReading, TagMapEntry    # noqa: E402
from mwts_pipeline.process import (SENTINELS, convert,                # noqa: E402
                                   process_envelope, reconcile)
from mwts_pipeline.thresholds import (classify_stage, evaluate,       # noqa: E402
                                      resolve_band)

TS = datetime(2026, 8, 3, 5, 0, tzinfo=timezone.utc)

FILTER_TURB = TagMapEntry(
    tag="TUR-1003", plant_code="WTP-01", sensor_id="s-10", parameter="turbidity",
    unit="NTU", location="Sand Filter 1", stage="filtered",
    span_low=0, span_high=10, count_low=5530, count_high=27648)

RAW_TURB = TagMapEntry(
    tag="TUR-1001", plant_code="WTP-01", sensor_id="s-1", parameter="turbidity",
    unit="NTU", location="Raw Water Intake", stage="raw",
    span_low=0, span_high=100, count_low=5530, count_high=27648)

MAP = {e.tag: e for e in (FILTER_TURB, RAW_TURB)}


def env(*readings: RawReading) -> Envelope:
    return Envelope(gateway_id="GW-1", ts=TS, seq=1, readings=readings)


def rd(tag="TUR-1003", raw=6216.0, q=192) -> RawReading:
    return RawReading(tag=tag, raw=raw, quality=q, ts=TS)


# ── conversion ────────────────────────────────────────────────────────────

def test_convert_matches_worked_example():
    assert convert(16147, FILTER_TURB) == pytest.approx(4.80, abs=0.01)
    assert convert(6216, FILTER_TURB) == pytest.approx(0.31, abs=0.01)


def test_convert_endpoints_are_exact():
    assert convert(5530, FILTER_TURB) == pytest.approx(0.0)
    assert convert(27648, FILTER_TURB) == pytest.approx(10.0)


def test_round_trip_recovers_the_value():
    """Counts are integers, so the only loss is rounding. Anything larger is a
    bug in the scaling constants."""
    for counts in range(5530, 27649, 47):
        v = convert(counts, FILTER_TURB)
        back = FILTER_TURB.count_low + (v - FILTER_TURB.span_low) / (
            FILTER_TURB.span_high - FILTER_TURB.span_low) * (
            FILTER_TURB.count_high - FILTER_TURB.count_low)
        assert abs(back - counts) < 1e-6


def test_wrong_span_is_ten_times_wrong():
    """The failure the register map exists to prevent: a filter reading of
    0.31 NTU read with the raw-water span becomes 3.10 — ten times the limit,
    with nothing looking wrong."""
    correct = convert(6216, FILTER_TURB)
    wrong = convert(6216, RAW_TURB)
    assert correct == pytest.approx(0.31, abs=0.01)
    assert wrong == pytest.approx(3.10, abs=0.02)
    # 0.31 breaches the 0.3 filtered limit -> warning, and someone investigates.
    assert evaluate(correct, resolve_band("turbidity", "filtered")) == "warning"
    # Read with the raw-water span it is 3.10 against a limit of 20 -> silence.
    assert evaluate(wrong, resolve_band("turbidity", "raw")) == "normal"


# ── stage-aware thresholds ────────────────────────────────────────────────

@pytest.mark.parametrize("location,expected", [
    ("Raw Water Intake", "raw"),
    ("Sand Filter 1", "filtered"),
    ("GAC Filter", "filtered"),
    ("Clear Water Tank", "final"),
    ("Chlorine Contact Tank", "final"),
    ("Flash Mixer", "treatment"),
    ("Clarifier 1", "treatment"),
    (None, "treatment"),
])
def test_stage_classification(location, expected):
    assert classify_stage(location) == expected


def test_same_value_different_verdict_by_stage():
    """The whole reason stages exist. One shared limit either alarms
    constantly at the intake or misses the filter failure."""
    assert evaluate(12.8, resolve_band("turbidity", "raw")) == "normal"
    assert evaluate(12.8, resolve_band("turbidity", "filtered")) == "critical"


def test_coagulation_ph_is_not_a_fault():
    assert evaluate(6.2, resolve_band("pH", "treatment")) == "normal"
    assert evaluate(6.2, resolve_band("pH", "final")) == "warning"


# ── cleaning ──────────────────────────────────────────────────────────────

def test_unmapped_tag_never_reaches_the_database():
    rows, rej, counts = process_envelope(
        env(rd(tag="AIT999_XX")), MAP, source_file="f.json")
    assert rows == []
    assert counts["unmapped_tag"] == 1
    assert rej[0].reason == "unmapped_tag"


def test_dead_probe_is_dropped():
    rows, _, counts = process_envelope(
        env(RawReading("TUR-1003", 0.0, TS, quality=0)), MAP, source_file="f")
    assert rows == []
    assert counts["bad_quality"] == 1


def test_genuine_zero_with_good_quality_is_kept():
    """A stopped pump reads 5530 counts = zero flow. It is real data."""
    rows, _, _ = process_envelope(
        env(RawReading("TUR-1003", 5530, TS, quality=192)), MAP, source_file="f")
    assert len(rows) == 1
    assert rows[0].value == pytest.approx(0.0)


@pytest.mark.parametrize("v", sorted(SENTINELS))
def test_sentinels_are_not_readings(v):
    rows, _, counts = process_envelope(
        env(RawReading("TUR-1003", float(v), TS, quality=192)), MAP, source_file="f")
    assert rows == []
    assert counts["sentinel"] == 1


def test_missing_quality_is_flagged_not_assumed_good():
    rows, _, counts = process_envelope(
        env(RawReading("TUR-1003", 6216, TS, quality=None)), MAP, source_file="f")
    assert len(rows) == 1                     # kept — it may be a real reading
    assert counts["no_quality_field"] == 1    # but recorded, not silently trusted


def test_out_of_span_is_a_scaling_error_not_a_process_event():
    rows, rej, counts = process_envelope(
        env(RawReading("TUR-1003", 60000, TS, quality=192)), MAP, source_file="f")
    assert rows == []
    assert counts["out_of_span"] == 1
    assert rej[0].reason == "out_of_span"


def test_sparkplug_span_overrides_the_register_map():
    """Sparkplug carries engLow/engHigh, so the value is already scaled and the
    register map's span must not be applied on top."""
    rows, _, _ = process_envelope(
        env(RawReading("TUR-1003", 4.80, TS, quality=192, span=(0.0, 10.0))),
        MAP, source_file="f")
    assert rows[0].value == pytest.approx(4.80)


def test_reconciliation_detects_silent_loss():
    from collections import Counter
    assert reconcile(100, 90, Counter({"bad_quality": 10}))
    assert not reconcile(100, 90, Counter({"bad_quality": 3}))


# ── adapters ──────────────────────────────────────────────────────────────

def test_all_custom_json_shapes_yield_the_same_readings():
    """Eight vendor shapes, one set of readings. If this fails, the adapter
    layer is not doing its job and format leaks downstream."""
    root = Path(__file__).parents[2] / "Raw_data_PLC" / "formats" / "custom-json"
    if not root.exists():
        pytest.skip("Raw_data_PLC not present")

    ref = None
    for p in sorted(root.iterdir()):
        envs = parse_file(p.read_bytes(), key=p.name)
        got = {r.tag: r.raw for e in envs for r in e.readings}
        assert got, f"{p.name} produced nothing"
        if ref is None:
            ref = got
        else:
            assert got == ref, f"{p.name} differs from the baseline shape"


def test_opcua_zero_status_means_good_not_bad():
    """OPC UA inverts OPC DA. Getting this backwards accepts every failed
    reading, or discards every valid one, and the values look fine either way."""
    e = adapt({
        "MessageId": "1", "PublisherId": "GW-1",
        "Messages": [{"Timestamp": "2026-08-03T05:00:00Z", "Payload": {
            "TUR-1003": {"Value": {"Body": 6216}, "StatusCode": {"Code": 0}},
            "TUR-1001": {"Value": {"Body": 8361},
                         "StatusCode": {"Code": 0x80000000}},
        }}]})
    q = {r.tag: r.quality for r in e.readings}
    assert q["TUR-1003"] == 192      # UA 0 -> DA good
    assert q["TUR-1001"] == 0        # UA 0x80000000 -> DA bad


def test_string_values_with_leading_zeros():
    e = adapt({"gateway_id": "GW-1", "ts": "1785733200", "data": [
        {"tag_name": "TUR-1003", "tag_value": "006216", "tag_quality": "192"}]})
    assert e.readings[0].raw == 6216.0


def test_word_quality_is_mapped():
    e = adapt({"source": "GW-1", "batchTime": "2026-08-03T05:00:00Z",
               "readings": [{"point": "TUR-1003", "reading": 6216,
                             "status": "UNCERTAIN"}]})
    assert e.readings[0].quality == 64


def test_epoch_milliseconds_are_detected():
    e = adapt({"device": "GW-1", "timestamp": 1785733200000,
               "values": {"TUR-1003": 6216}, "qualities": {"TUR-1003": 192}})
    assert e.ts == TS


def test_truncated_file_fails_whole_not_partial():
    with pytest.raises(ParseError):
        parse_file('{"gw":"GW-1","ts":1785733200,"d":[{"t":"TUR-100', key="t.json")


def test_unknown_format_raises_rather_than_guessing():
    from mwts_pipeline.adapters import UnknownFormat
    with pytest.raises(UnknownFormat):
        adapt({"something": "entirely different"})


# ── data types: not every tag is a 4-20 mA measurement ────────────────────

PUMP_RUN = TagMapEntry(
    tag="XS-P101", plant_code="WTP-01", sensor_id="s-run", parameter="level",
    unit="", location="Transfer Pump 1", stage="treatment",
    span_low=0, span_high=1, count_low=0, count_high=1, data_type="digital")

PUMP_FAULT = TagMapEntry(
    tag="XA-P101", plant_code="WTP-01", sensor_id="s-fault", parameter="level",
    unit="", location="Transfer Pump 1", stage="treatment",
    span_low=0, span_high=1, count_low=0, count_high=1, data_type="digital")

KWH = TagMapEntry(
    tag="JI-6001", plant_code="WTP-01", sensor_id="s-kwh", parameter="level",
    unit="kWh", location="MCC 1", stage="treatment",
    span_low=0, span_high=0, count_low=0, count_high=0, data_type="counter")

TYPED = {e.tag: e for e in (PUMP_RUN, PUMP_FAULT, KWH, FILTER_TURB)}


def test_digital_is_not_scaled():
    """A pump-run bit put through the analogue conversion becomes a plausible
    engineering value, which is the worst kind of wrong."""
    rows, _, _ = process_envelope(
        env(RawReading("XS-P101", 1.0, TS, quality=192)), TYPED, source_file="f")
    assert rows[0].value == 1.0
    assert rows[0].status == "normal"          # running is a state, not a fault


def test_alarm_bit_set_is_critical():
    rows, _, _ = process_envelope(
        env(RawReading("XA-P101", 1.0, TS, quality=192)), TYPED, source_file="f")
    assert rows[0].status == "critical"


def test_alarm_bit_clear_is_normal():
    rows, _, _ = process_envelope(
        env(RawReading("XA-P101", 0.0, TS, quality=192)), TYPED, source_file="f")
    assert rows[0].status == "normal"


def test_digital_rejects_anything_but_zero_or_one():
    """A digital reading 7609 means the register does not hold what the map
    says — a mis-mapped address, not a process event."""
    rows, rej, counts = process_envelope(
        env(RawReading("XS-P101", 7609, TS, quality=192)), TYPED, source_file="f")
    assert rows == []
    assert counts["out_of_span"] == 1


def test_counter_is_stored_raw_and_not_span_checked():
    """A lifetime kWh total exceeds any instrument span by design. Scaling it,
    or rejecting it as out of range, both destroy it."""
    rows, _, _ = process_envelope(
        env(RawReading("JI-6001", 4_821_973, TS, quality=192)), TYPED, source_file="f")
    assert rows[0].value == 4_821_973
    assert rows[0].status == "normal"          # a total is never "too high"


def test_analog_still_scales_alongside_the_others():
    """The three types travel in one payload, as they do from a real gateway."""
    rows, _, _ = process_envelope(
        env(RawReading("XS-P101", 1.0, TS, quality=192),
            RawReading("JI-6001", 4_821_973, TS, quality=192),
            RawReading("TUR-1003", 6216, TS, quality=192)),
        TYPED, source_file="f")
    by_id = {r.sensor_id: r.value for r in rows}
    assert by_id["s-run"] == 1.0                       # untouched
    assert by_id["s-kwh"] == 4_821_973                 # untouched
    assert by_id["s-10"] == pytest.approx(0.31, abs=0.01)   # scaled
