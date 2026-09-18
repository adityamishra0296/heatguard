"""Train per-region forecasters and persist them with joblib.

Run directly (`python train.py`) or import `train()`. The FastAPI app calls
`train()` on startup if no persisted model is found.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import joblib

from data import DB_PATH, load_regions
from model import RegionForecaster

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
MODELS_PATH = os.path.join(MODELS_DIR, "forecasters.joblib")

MIN_READINGS = 10


def train(db_path: str = DB_PATH) -> dict[str, Any]:
    regions = load_regions(db_path)

    forecasters: dict[str, RegionForecaster] = {}
    for region_id, region in regions.items():
        if len(region["readings"]) < MIN_READINGS:
            continue
        forecasters[region_id] = RegionForecaster(
            region_id, region["name"], region["state"]
        ).fit(region["readings"], region["vulnerability"], region["population"])

    payload: dict[str, Any] = {
        "forecasters": forecasters,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
    }

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(payload, MODELS_PATH)
    return payload


if __name__ == "__main__":
    result = train()
    print(
        f"Trained {len(result['forecasters'])} region models "
        f"at {result['trainedAt']} → {MODELS_PATH}"
    )
