"""HeatGuard prediction microservice (FastAPI + scikit-learn).

Forecasts are model estimates, NOT authoritative predictions.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

import joblib
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from train import MODELS_PATH, train

_state: dict[str, Any] = {"payload": None}


def _get_payload() -> dict[str, Any]:
    """Load persisted models, training them on first use if absent."""
    if _state["payload"] is None:
        if os.path.exists(MODELS_PATH):
            _state["payload"] = joblib.load(MODELS_PATH)
        else:
            _state["payload"] = train()
    return _state["payload"]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _get_payload()
    yield


app = FastAPI(
    title="HeatGuard Prediction Service",
    version="1.0.0",
    description="7-day heat forecasts per region. Model estimates — not authoritative.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


class ForecastDay(BaseModel):
    date: str
    predictedMaxTempC: float
    predictedHeatIndexC: float
    predictedLevel: str
    healthRisk: str
    healthRiskScore: float


class RegionRisk(BaseModel):
    regionId: str
    name: str
    state: str
    peakPredictedHeatIndexC: float
    peakLevel: str
    peakHealthRisk: str
    daysElevated: int


@app.get("/health")
def health() -> dict[str, Any]:
    payload = _get_payload()
    return {
        "status": "ok",
        "regions": len(payload["forecasters"]),
        "trainedAt": payload["trainedAt"],
        "disclaimer": "Forecasts are model estimates, not authoritative.",
    }


@app.get("/predict/summary", response_model=list[RegionRisk])
def predict_summary(days: int = Query(7, ge=1, le=14)) -> list[dict[str, Any]]:
    payload = _get_payload()
    summary: list[dict[str, Any]] = []
    for region_id, forecaster in payload["forecasters"].items():
        forecast = forecaster.forecast(days)
        if not forecast:
            continue
        peak = max(forecast, key=lambda d: d["predictedHeatIndexC"])
        worst_risk = max(forecast, key=lambda d: d["healthRiskScore"])
        summary.append(
            {
                "regionId": region_id,
                "name": forecaster.name,
                "state": forecaster.state,
                "peakPredictedHeatIndexC": peak["predictedHeatIndexC"],
                "peakLevel": peak["predictedLevel"],
                "peakHealthRisk": worst_risk["healthRisk"],
                "daysElevated": sum(
                    1 for d in forecast if d["predictedLevel"] in ("ORANGE", "RED")
                ),
            }
        )
    summary.sort(key=lambda r: r["peakPredictedHeatIndexC"], reverse=True)
    return summary


@app.get("/predict/{region_id}", response_model=list[ForecastDay])
def predict_region(region_id: str, days: int = Query(7, ge=1, le=14)) -> list[dict[str, Any]]:
    payload = _get_payload()
    forecaster = payload["forecasters"].get(region_id)
    if forecaster is None:
        raise HTTPException(status_code=404, detail=f"No model for region '{region_id}'.")
    return forecaster.forecast(days)
