"""Heat-index, alert-level, vulnerability, and health-risk utilities.

These mirror the TypeScript utilities in `src/lib/heat/` so the microservice's
predicted heat index, alert level, and health-risk category match the frontend
exactly. Keep the two in sync when thresholds or formulas change.
"""

from __future__ import annotations

import math

# Alert-level heat-index thresholds (°C) — identical to ALERT_LEVEL_THRESHOLDS_C.
YELLOW_THRESHOLD = 32.0
ORANGE_THRESHOLD = 40.0
RED_THRESHOLD = 52.0

# Health-risk hazard range (°C) — identical to computeHealthRiskScore.
HAZARD_MIN_C = 27.0
HAZARD_MAX_C = 54.0


def _clamp01(value: float) -> float:
    if value != value:  # NaN
        return 0.0
    return max(0.0, min(1.0, value))


def celsius_to_fahrenheit(celsius: float) -> float:
    return celsius * 9 / 5 + 32


def fahrenheit_to_celsius(fahrenheit: float) -> float:
    return (fahrenheit - 32) * 5 / 9


def compute_heat_index(temp_c: float, humidity_pct: float) -> float:
    """NOAA heat index in °C (Rothfusz regression + Steadman fallback)."""
    rh = 0.0 if humidity_pct != humidity_pct else max(0.0, min(100.0, humidity_pct))
    t = celsius_to_fahrenheit(temp_c)

    simple_f = 0.5 * (t + 61 + (t - 68) * 1.2 + rh * 0.094)
    if (simple_f + t) / 2 < 80:
        return round(fahrenheit_to_celsius(simple_f), 1)

    hi = (
        -42.379
        + 2.04901523 * t
        + 10.14333127 * rh
        - 0.22475541 * t * rh
        - 0.00683783 * t * t
        - 0.05481717 * rh * rh
        + 0.00122874 * t * t * rh
        + 0.00085282 * t * rh * rh
        - 0.00000199 * t * t * rh * rh
    )
    if rh < 13 and 80 <= t <= 112:
        hi -= ((13 - rh) / 4) * math.sqrt((17 - abs(t - 95)) / 17)
    if rh > 85 and 80 <= t <= 87:
        hi += ((rh - 85) / 10) * ((87 - t) / 5)
    return round(fahrenheit_to_celsius(hi), 1)


def classify_alert_level(heat_index_c: float) -> str:
    """Return NORMAL | YELLOW | ORANGE | RED for a heat index (°C)."""
    if not math.isfinite(heat_index_c):
        return "NORMAL"
    if heat_index_c >= RED_THRESHOLD:
        return "RED"
    if heat_index_c >= ORANGE_THRESHOLD:
        return "ORANGE"
    if heat_index_c >= YELLOW_THRESHOLD:
        return "YELLOW"
    return "NORMAL"


def compute_vulnerability_score(
    population: float | None,
    elderly: float | None,
    outdoor: float | None,
    children: float | None,
    cooling_pct: float | None,
    water_pct: float | None,
) -> float:
    """0–100 composite vulnerability score (mirrors computeVulnerabilityScore)."""
    if population is None or population <= 0:
        return 0.0

    def share(count: float | None) -> float:
        c = count if (count is not None and count > 0) else 0
        return _clamp01(c / population)

    elderly_s = _clamp01(share(elderly) / 0.15)
    outdoor_s = _clamp01(share(outdoor) / 0.5)
    children_s = _clamp01(share(children) / 0.35)
    cooling_deficit = _clamp01(1 - _clamp01((cooling_pct or 0) / 100))
    water_deficit = _clamp01(1 - _clamp01((water_pct or 0) / 100))

    composite = (
        0.25 * elderly_s
        + 0.25 * outdoor_s
        + 0.15 * children_s
        + 0.20 * cooling_deficit
        + 0.15 * water_deficit
    )
    return round(max(0.0, min(100.0, composite * 100)), 1)


def compute_health_risk_score(heat_index_c: float, vulnerability_score: float) -> float:
    """0–100 health-risk score (mirrors computeHealthRiskScore)."""
    hazard = _clamp01((heat_index_c - HAZARD_MIN_C) / (HAZARD_MAX_C - HAZARD_MIN_C))
    vulnerability = _clamp01((vulnerability_score or 0) / 100)
    risk = hazard * (0.5 + 0.5 * vulnerability)
    return round(max(0.0, min(100.0, risk * 100)), 1)


def health_risk_category(score: float) -> str:
    """Map a 0–100 health-risk score to a category."""
    if score < 25:
        return "Low"
    if score < 50:
        return "Moderate"
    if score < 75:
        return "High"
    return "Severe"
