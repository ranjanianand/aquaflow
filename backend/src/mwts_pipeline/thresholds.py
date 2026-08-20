"""Stage classification and alarm bands.

A single limit per parameter does not survive contact with a real plant.
Turbidity of 12.8 NTU is normal at a raw water intake and a serious failure at
a filter outlet. Under one shared limit the intake alarms continuously until
operators mute the parameter — and the genuine failure is muted with it.

Limits therefore belong to the sensor, resolved from where it sits in the
treatment train. Ported from frontend/src/lib/thresholds.ts; the two must
not diverge, because the version the dashboard uses would stop being the
version that raised the alert.
"""
from __future__ import annotations

from typing import Literal

Stage = Literal["raw", "treatment", "filtered", "final"]
Status = Literal["normal", "warning", "critical"]

# Order matters below: a "Clear Water Tank" downstream of filters is final, and
# a filter is checked before falling through to generic mid-process.
_FINAL_HINTS = (
    "clear water", "final", "outlet", "storage", "distribution", "dispatch",
    "elevated", "contact", "permeate", "booster", "main", "remineral",
    "ground storage",
)
# Anything producing filtered water — its effluent meets finished-water limits.
_FILTER_HINTS = (
    "filter", "membrane", "carbon", "ro stage", "ultrafiltration", "softening",
)
_RAW_HINTS = (
    "intake", "raw", "well", "river", "lake", "bore", "screen", "strainer", "sump",
)


def classify_stage(location: str | None) -> Stage:
    if not location:
        return "treatment"
    l = location.lower()
    if any(h in l for h in _FINAL_HINTS):
        return "final"
    if any(h in l for h in _FILTER_HINTS):
        return "filtered"
    if any(h in l for h in _RAW_HINTS):
        return "raw"
    return "treatment"


Band = tuple[float, float, float, float]        # warn_min, warn_max, crit_min, crit_max

# The widest a reading can be and still be physically real. Used when a stage
# has no override — a pH of 15 is a broken probe anywhere.
_PLAUSIBLE: dict[str, Band] = {
    "pH":           (6.5, 8.5, 6.0, 9.0),
    "flow":         (100, 500, 50, 600),
    "pressure":     (2.0, 6.0, 1.0, 8.0),
    "temperature":  (15, 35, 5, 45),
    "turbidity":    (0, 4.0, 0, 10),
    "chlorine":     (0.2, 2.0, 0.1, 4.0),
    "DO":           (4.0, 12.0, 2.0, 15.0),
    "level":        (20, 95, 10, 98),
    "conductivity": (200, 800, 100, 1500),
    "ORP":          (200, 800, 100, 1000),
    # Instantaneous load at a motor control centre. A band is meaningful here:
    # drawing far more than usual means a pump is struggling, and far less
    # means it has stopped. Widths are per-MCC and would be set from the
    # installed load — these are placeholders.
    "power":        (5, 200, 0, 250),

    # ── Laboratory parameters ───────────────────────────────────────────
    # Measured by hand, usually daily, never by an inline instrument. They
    # belong here because an alarm band applies whether a number came from a
    # probe or a technician.
    #
    # These figures are indicative. COD and BOD limits in particular are set by
    # discharge consent rather than by drinking-water standards, and differ per
    # site — they must be confirmed against the client's own consent.
    "COD":          (0, 50, 0, 125),      # mg/L, chemical oxygen demand
    "BOD":          (0, 10, 0, 25),       # mg/L, biochemical oxygen demand
    "TSS":          (0, 20, 0, 45),       # mg/L, total suspended solids
    "coliform":     (0, 0, 0, 0),         # CFU/100mL — any detection is a fail
    "hardness":     (50, 300, 0, 500),    # mg/L as CaCO3
    "alkalinity":   (50, 200, 20, 400),   # mg/L as CaCO3
    "iron":         (0, 0.2, 0, 0.3),     # mg/L
    "manganese":    (0, 0.05, 0, 0.1),    # mg/L
    "fluoride":     (0.5, 1.0, 0, 1.5),   # mg/L
    "nitrate":      (0, 40, 0, 50),       # mg/L as NO3
}

# Parameters that are states or totals rather than measurements. They reach
# resolve_band only through a coding error, so it fails loudly rather than
# inventing a limit for a pump-run bit.
_NOT_MEASURED = frozenset({
    "run_status", "fault", "valve_open", "valve_closed",
    "energy", "run_hours", "start_count",
})

# Only parameters whose acceptable range genuinely shifts along the treatment
# train are listed. Everything else keeps its plausibility band.
_STAGE: dict[tuple[str, str], Band] = {
    # Untreated surface water is expected to be cloudy.
    ("turbidity", "raw"):       (0, 20, 0, 50),
    ("turbidity", "treatment"): (0, 5.0, 0, 10),
    # Filter effluent — 0.3 NTU is the line most utilities are held to, and it
    # is the regulatory control point in drinking water.
    ("turbidity", "filtered"):  (0, 0.3, 0, 0.5),
    ("turbidity", "final"):     (0, 0.3, 0, 0.5),

    ("pH", "raw"):       (6.0, 9.0, 5.5, 9.5),
    # Coagulation deliberately depresses pH.
    ("pH", "treatment"): (6.0, 8.5, 5.5, 9.0),
    ("pH", "filtered"):  (6.5, 8.5, 6.0, 9.0),
    ("pH", "final"):     (6.5, 8.5, 6.0, 9.0),

    # Residual is only meaningful after dosing.
    ("chlorine", "treatment"): (0.2, 3.0, 0.1, 5.0),
    ("chlorine", "filtered"):  (0.2, 3.0, 0.1, 5.0),
    ("chlorine", "final"):     (0.2, 2.0, 0.1, 4.0),

    ("conductivity", "raw"): (100, 1200, 50, 2000),
    ("DO", "raw"):           (2.0, 12.0, 1.0, 15.0),
}


def resolve_band(parameter: str, stage: str) -> Band:
    """The alarm band for a parameter at a stage.

    These limits are engineering defaults, not MWTS's. They must be confirmed
    against the client's regulator — CPHEEO/IS 10500, WHO, US SWTR and the EU
    Drinking Water Directive do not agree, and picking the wrong one is a
    compliance problem rather than a technical one.
    """
    if parameter in _NOT_MEASURED:
        raise ValueError(
            f"{parameter} is a state or a total, not a measurement — it has no "
            "alarm band. Check data_type on this tag.")
    return _STAGE.get((parameter, stage)) or _PLAUSIBLE[parameter]


def evaluate(value: float, band: Band) -> Status:
    warn_min, warn_max, crit_min, crit_max = band
    if value < crit_min or value > crit_max:
        return "critical"
    if value < warn_min or value > warn_max:
        return "warning"
    return "normal"
