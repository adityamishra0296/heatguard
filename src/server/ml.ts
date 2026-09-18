import type { HeatAlertLevel } from "@/lib/enums";

/**
 * Typed client for the FastAPI prediction microservice.
 *
 * Every call has a short timeout and returns `null` on any failure (offline,
 * timeout, non-2xx) so the forecast feature degrades gracefully without
 * affecting the rest of the app. Forecasts are model estimates — the UI labels
 * them as such.
 */

const ML_BASE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";
const TIMEOUT_MS = 1500;

export type HealthRiskCategory = "Low" | "Moderate" | "High" | "Severe";

export interface ForecastDay {
  date: string;
  predictedMaxTempC: number;
  predictedHeatIndexC: number;
  predictedLevel: HeatAlertLevel;
  healthRisk: HealthRiskCategory;
  healthRiskScore?: number;
}

export interface PredictedRiskRegion {
  regionId: string;
  name: string;
  state: string;
  peakPredictedHeatIndexC: number;
  peakLevel: HeatAlertLevel;
  peakHealthRisk: HealthRiskCategory;
  daysElevated: number;
}

async function mlFetch<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${ML_BASE_URL}${path}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** 7-day forecast for one region, or `null` if the service is unavailable. */
export function getRegionForecast(
  regionId: string,
  days = 7,
): Promise<ForecastDay[] | null> {
  return mlFetch<ForecastDay[]>(
    `/predict/${encodeURIComponent(regionId)}?days=${days}`,
  );
}

/** Regions ranked by predicted peak risk, or `null` if the service is unavailable. */
export function getPredictedRiskSummary(
  days = 7,
): Promise<PredictedRiskRegion[] | null> {
  return mlFetch<PredictedRiskRegion[]>(`/predict/summary?days=${days}`);
}
