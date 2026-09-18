"""Per-region 7-day max-temperature forecaster.

A deliberately simple, explainable model: Ridge regression on
[sin(day-of-year), cos(day-of-year), 7-day rolling mean of max temp]. The
forecast is recursive — each day's prediction feeds the rolling feature for the
next day. Humidity is held at the region's recent 14-day average (see README for
assumptions and limitations).
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta
from typing import Any

import numpy as np
from sklearn.linear_model import Ridge

from heat import (
    classify_alert_level,
    compute_health_risk_score,
    compute_heat_index,
    compute_vulnerability_score,
    health_risk_category,
)

ROLL_WINDOW = 7
CLAMP_MIN_C = 20.0
CLAMP_MAX_C = 52.0


def _seasonal_features(day: datetime) -> tuple[float, float]:
    angle = 2 * math.pi * day.timetuple().tm_yday / 365.25
    return math.sin(angle), math.cos(angle)


class RegionForecaster:
    def __init__(self, region_id: str, name: str, state: str) -> None:
        self.region_id = region_id
        self.name = name
        self.state = state
        self.model: Ridge | None = None
        self.humidity: float = 45.0
        self.last_window: list[float] = []
        self.last_date: datetime | None = None
        self.vulnerability: float = 0.0

    def fit(
        self,
        readings: list[dict[str, Any]],
        vulnerability: dict[str, Any] | None,
        population: float | None,
    ) -> "RegionForecaster":
        max_temps = [r["maxTempC"] for r in readings]
        dates = [r["date"] for r in readings]
        humidities = [r["humidityPct"] for r in readings]

        features: list[list[float]] = []
        targets: list[float] = []
        for i in range(ROLL_WINDOW, len(max_temps)):
            sin_doy, cos_doy = _seasonal_features(dates[i])
            roll = sum(max_temps[i - ROLL_WINDOW : i]) / ROLL_WINDOW
            features.append([sin_doy, cos_doy, roll])
            targets.append(max_temps[i])

        self.model = (
            Ridge(alpha=1.0).fit(np.array(features), np.array(targets))
            if features
            else None
        )

        recent_humidity = humidities[-14:] or humidities
        self.humidity = sum(recent_humidity) / max(1, len(recent_humidity))
        self.last_window = max_temps[-ROLL_WINDOW:]
        self.last_date = dates[-1]

        if vulnerability is not None and population:
            self.vulnerability = compute_vulnerability_score(
                population,
                vulnerability["elderlyCount"],
                vulnerability["outdoorWorkersCount"],
                vulnerability["childrenCount"],
                vulnerability["hasCoolingAccessPct"],
                vulnerability["hasWaterAccessPct"],
            )
        return self

    def forecast(self, days: int = 7) -> list[dict[str, Any]]:
        if self.last_date is None:
            return []

        window = list(self.last_window)
        day = self.last_date
        result: list[dict[str, Any]] = []

        for _ in range(days):
            day = day + timedelta(days=1)
            sin_doy, cos_doy = _seasonal_features(day)
            roll = sum(window[-ROLL_WINDOW:]) / min(ROLL_WINDOW, len(window)) if window else 35.0

            if self.model is not None:
                predicted = float(self.model.predict([[sin_doy, cos_doy, roll]])[0])
            else:
                predicted = roll

            predicted = max(CLAMP_MIN_C, min(CLAMP_MAX_C, predicted))
            heat_index = compute_heat_index(predicted, self.humidity)
            level = classify_alert_level(heat_index)
            risk_score = compute_health_risk_score(heat_index, self.vulnerability)

            result.append(
                {
                    "date": day.strftime("%Y-%m-%d"),
                    "predictedMaxTempC": round(predicted, 1),
                    "predictedHeatIndexC": heat_index,
                    "predictedLevel": level,
                    "healthRisk": health_risk_category(risk_score),
                    "healthRiskScore": risk_score,
                }
            )
            window.append(predicted)

        return result
