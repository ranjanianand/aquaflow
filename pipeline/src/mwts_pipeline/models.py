"""Canonical records.

`frozen=True` because a transformation that mutates its input is a bug class
this pipeline cannot afford. `slots=True` because at 500,000 rows the per-object
dict overhead is real.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

Status = Literal["normal", "warning", "critical"]

RejectReason = Literal[
    "unmapped_tag", "bad_quality", "uncertain_quality", "sentinel",
    "out_of_span", "no_quality_field", "unparseable",
]


@dataclass(frozen=True, slots=True)
class RawReading:
    """One reading, after the vendor format has been stripped away.

    Everything downstream of the adapter sees this and never the original JSON.
    """
    tag: str
    raw: float
    ts: datetime
    quality: int | None = None      # None = the gateway sent no quality field
    unit: str | None = None         # only Sparkplug B and OPC UA supply this
    span: tuple[float, float] | None = None   # ditto — overrides the register map


@dataclass(frozen=True, slots=True)
class Envelope:
    """The per-file header. Diagnostics are cheap to keep and predict outages."""
    gateway_id: str
    ts: datetime
    seq: int | None = None
    rssi: int | None = None
    vin: float | None = None
    temp: float | None = None
    readings: tuple[RawReading, ...] = ()


@dataclass(frozen=True, slots=True)
class TagMapEntry:
    """One row of the register map — the document that does not travel with
    the data, and without which a count means nothing."""
    tag: str
    plant_code: str
    sensor_id: str
    parameter: str
    unit: str
    location: str
    stage: str
    span_low: float
    span_high: float
    count_low: int = 5530
    count_high: int = 27648


@dataclass(frozen=True, slots=True)
class Reading:
    """A converted, validated reading. This is what gets INSERTed."""
    sensor_id: str
    ts: datetime
    value: float
    status: Status
    source_file: str
    quality: int | None = None
    raw_count: int | None = None


@dataclass(frozen=True, slots=True)
class Rejection:
    """A reading we would not store, and why.

    Recorded rather than discarded: a rising bad-quality rate is a failing
    instrument, and it is one of the few genuinely predictive signals available
    without a model.
    """
    ts: datetime
    tag: str
    reason: RejectReason
    source_file: str
    raw_value: float | None = None
    quality: int | None = None
    plant_code: str | None = None
