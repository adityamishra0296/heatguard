# HeatGuard Prediction Service

A small **FastAPI + scikit-learn** microservice that forecasts the next 7 days of
heat for each region and derives a predicted heat index, alert level, and
health-risk category.

> ⚠️ **Forecasts are model estimates, not authoritative predictions.** They are
> intended for demonstration and situational awareness only.

## The model

One **Ridge linear regression** per region predicts the daily maximum
temperature from three features:

- `sin(day-of-year)`, `cos(day-of-year)` — seasonality
- 7-day rolling mean of max temperature — recent level / persistence

The 7-day forecast is **recursive**: each predicted day is appended to the
rolling window and used to predict the next day. Predicted heat index, alert
level, and health-risk category are then derived with the **same formulas and
thresholds as the frontend** (ported in [`heat.py`](heat.py)):

- heat index — NOAA Rothfusz regression (`computeHeatIndex`)
- alert level — thresholds 32 / 40 / 52 °C (`classifyAlertLevel`)
- health risk — `computeHealthRiskScore` → category (Low / Moderate / High / Severe)

### Assumptions & limitations

- **Humidity is held constant** at the region's recent 14-day average (humidity
  is more stable than temperature; forecasting it is out of scope here).
- Trained on the **~60-day seeded window** (peak summer). The model does not know
  about monsoon onset, so multi-week extrapolation is unreliable — hence the
  7-day horizon (max 14).
- Predicted max temperature is **clamped to 20–52 °C** to avoid runaway values.
- Linear + deterministic → **explainable and reproducible** (same data ⇒ same
  models). Swap `Ridge` for `GradientBoostingRegressor` in `model.py` for a
  non-linear variant.

## Data source

Reads the Next.js app's Prisma **SQLite** database (integer epoch-ms timestamps).
Default path: `../prisma/dev.db`. Override with the `HEATGUARD_DB` env var. Seed
the app first (`npm run db:seed` in the repo root) so the database exists.

## Setup & run

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# (optional) train + persist models to models/forecasters.joblib
python train.py

# run the API (trains on startup if no persisted model exists)
uvicorn main:app --port 8000
```

The Next.js app expects the service at `http://localhost:8000` (configurable via
`ML_SERVICE_URL`). It degrades gracefully when the service is offline.

## Endpoints

| Endpoint                         | Description                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET /health`                    | Service status, number of region models, and train time.                                                           |
| `GET /predict/{regionId}?days=7` | 7-day forecast: `[{ date, predictedMaxTempC, predictedHeatIndexC, predictedLevel, healthRisk, healthRiskScore }]`. |
| `GET /predict/summary?days=7`    | Regions ranked by predicted peak heat index.                                                                       |

`days` is clamped to 1–14. Unknown region → `404`.
