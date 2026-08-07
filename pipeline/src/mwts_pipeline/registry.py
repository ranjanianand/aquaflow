"""The register map — loading it, and keeping it honest.

This is the document that does not travel with the data. Without it a payload
is unreadable: nothing in {"t":"TUR-1003","v":6216} says that is turbidity
ranged 0-10 NTU at a sand filter.
"""
from __future__ import annotations

import csv
import json
import logging
from pathlib import Path

from .models import TagMapEntry
from .thresholds import classify_stage

log = logging.getLogger(__name__)


class RegisterMapError(Exception):
    """The map is unusable. Fail at startup, not on the first file at 3am."""


def _entry(d: dict) -> TagMapEntry:
    return TagMapEntry(
        tag=d["tag"].strip(),
        plant_code=d["plant"].strip() if "plant" in d else d["plant_code"].strip(),
        sensor_id=d["sensor_id"].strip(),
        parameter=d["parameter"].strip(),
        unit=d["unit"].strip(),
        location=d["location"].strip(),
        # Trust the supplied stage, but derive it when absent — a map from an
        # integrator will not have one, because stage is our concept, not theirs.
        stage=d.get("stage") or classify_stage(d["location"]),
        span_low=float(d["span_low"]),
        span_high=float(d["span_high"]),
        count_low=int(d.get("count_low", 5530)),
        count_high=int(d.get("count_high", 27648)),
    )


def load(path: str | Path) -> dict[str, TagMapEntry]:
    """Load from JSON or CSV, keyed by tag.

    Validated on load. A map with a zero-width span or an inverted count range
    produces garbage for every reading of that tag, and it is far cheaper to
    catch here than in a chart three weeks later.
    """
    p = Path(path)
    if p.suffix == ".csv":
        with p.open(newline="", encoding="utf-8") as f:
            raw = list(csv.DictReader(f))
    else:
        raw = json.loads(p.read_text(encoding="utf-8"))

    if not raw:
        raise RegisterMapError(f"{p}: empty register map")

    out: dict[str, TagMapEntry] = {}
    problems: list[str] = []

    for d in raw:
        try:
            e = _entry(d)
        except (KeyError, ValueError) as exc:
            problems.append(f"{d.get('tag', '?')}: {exc}")
            continue

        if e.span_high <= e.span_low:
            problems.append(f"{e.tag}: span {e.span_low}-{e.span_high} is not increasing")
        if e.count_high <= e.count_low:
            problems.append(f"{e.tag}: counts {e.count_low}-{e.count_high} not increasing")
        if e.tag in out:
            problems.append(f"{e.tag}: duplicate tag")
        out[e.tag] = e

    if problems:
        raise RegisterMapError(
            f"{p}: {len(problems)} invalid entries\n  " + "\n  ".join(problems[:10]))

    log.info("register map loaded", extra={"path": str(p), "tags": len(out)})
    return out


def audit(tag_map: dict[str, TagMapEntry]) -> dict[str, list[str]]:
    """Flag entries that are probably wrong, before they produce wrong numbers.

    None of these are errors — every one can be legitimate. They are the things
    worth putting in front of the plant's engineer once, rather than
    discovering from a fabricated alarm.
    """
    findings: dict[str, list[str]] = {}

    def note(tag: str, msg: str) -> None:
        findings.setdefault(msg, []).append(tag)

    # The same parameter on different spans is CORRECT and expected — a
    # raw-water turbidity meter is ranged far wider than a filter one. Report
    # it so it is a decision, not an accident.
    spans: dict[str, set[tuple[float, float]]] = {}
    for e in tag_map.values():
        spans.setdefault(e.parameter, set()).add((e.span_low, e.span_high))
    for param, s in spans.items():
        if len(s) > 1:
            note(param, f"{param}: {len(s)} different instrument spans in use")

    for e in tag_map.values():
        # A filter or final turbidity meter ranged to 100 NTU resolves to about
        # 0.36 NTU against a 0.3 limit — it cannot measure its own limit.
        if e.parameter == "turbidity" and e.stage in ("filtered", "final") \
                and e.span_high > 20:
            note(e.tag, "turbidity meter on treated water with a very wide span")
        if e.span_low != 0 and e.parameter in ("turbidity", "flow", "level"):
            note(e.tag, "non-zero span_low on a parameter that normally starts at zero")
        if (e.count_low, e.count_high) not in {
                (5530, 27648), (0, 27648), (0, 32767), (6242, 31208)}:
            note(e.tag, f"unusual count range {e.count_low}-{e.count_high}")

    return findings
