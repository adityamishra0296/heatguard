"""Load historical data from the HeatGuard SQLite database.

Reads the Next.js app's Prisma SQLite file (default `../prisma/dev.db`, override
with the HEATGUARD_DB env var). Prisma stores DateTime as integer epoch-ms.
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from typing import Any

_DEFAULT_DB = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "prisma", "dev.db")
)
DB_PATH = os.environ.get("HEATGUARD_DB", _DEFAULT_DB)


def _to_datetime(epoch_ms: int) -> datetime:
    return datetime.fromtimestamp(epoch_ms / 1000, tz=timezone.utc)


def load_regions(db_path: str = DB_PATH) -> dict[str, dict[str, Any]]:
    """Return { regionId: { name, state, population, readings[], vulnerability } }."""
    if not os.path.exists(db_path):
        raise FileNotFoundError(
            f"Database not found at {db_path}. Seed the Next.js app first "
            f"(npm run db:seed), or set HEATGUARD_DB."
        )

    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    try:
        regions: dict[str, dict[str, Any]] = {}
        for row in connection.execute(
            "SELECT id, name, state, population FROM Region"
        ):
            regions[row["id"]] = {
                "name": row["name"],
                "state": row["state"],
                "population": row["population"],
                "readings": [],
                "vulnerability": None,
            }

        for row in connection.execute(
            "SELECT regionId, timestamp, maxTempC, humidityPct "
            "FROM TemperatureReading ORDER BY timestamp ASC"
        ):
            region = regions.get(row["regionId"])
            if region is not None:
                region["readings"].append(
                    {
                        "date": _to_datetime(row["timestamp"]),
                        "maxTempC": row["maxTempC"],
                        "humidityPct": row["humidityPct"],
                    }
                )

        for row in connection.execute(
            "SELECT regionId, elderlyCount, outdoorWorkersCount, childrenCount, "
            "hasCoolingAccessPct, hasWaterAccessPct FROM VulnerablePopulation"
        ):
            region = regions.get(row["regionId"])
            if region is not None:
                region["vulnerability"] = {
                    "elderlyCount": row["elderlyCount"],
                    "outdoorWorkersCount": row["outdoorWorkersCount"],
                    "childrenCount": row["childrenCount"],
                    "hasCoolingAccessPct": row["hasCoolingAccessPct"],
                    "hasWaterAccessPct": row["hasWaterAccessPct"],
                }

        return regions
    finally:
        connection.close()
