import type { HeatAlertLevel } from "../enums";

/**
 * Heat-index thresholds (°C, "feels-like") for each alert level.
 *
 * Aligned with the NOAA heat-index danger categories and IMD's four-colour
 * heat-wave warning scheme. A reading is classified at the highest level whose
 * threshold it meets or exceeds:
 *
 *   - NORMAL : HI < 32       — no heat action required
 *   - YELLOW : 32 ≤ HI < 40  — Alert / "Caution": heat wave developing
 *   - ORANGE : 40 ≤ HI < 52  — Warning / "Danger": limit exposure
 *   - RED    : HI ≥ 52       — Emergency / "Extreme danger"
 */
export const ALERT_LEVEL_THRESHOLDS_C = {
  YELLOW: 32,
  ORANGE: 40,
  RED: 52,
} as const;

/**
 * Classify a heat index (°C) into an IMD-aligned heat-wave alert level.
 *
 * @param heatIndexC - Heat index in degrees Celsius.
 * @returns The alert level; `NORMAL` for non-finite input.
 */
export function classifyAlertLevel(heatIndexC: number): HeatAlertLevel {
  if (!Number.isFinite(heatIndexC)) return "NORMAL";
  if (heatIndexC >= ALERT_LEVEL_THRESHOLDS_C.RED) return "RED";
  if (heatIndexC >= ALERT_LEVEL_THRESHOLDS_C.ORANGE) return "ORANGE";
  if (heatIndexC >= ALERT_LEVEL_THRESHOLDS_C.YELLOW) return "YELLOW";
  return "NORMAL";
}

/** Level-specific advice line shown in an alert message. */
const ALERT_ADVICE: Record<HeatAlertLevel, string> = {
  NORMAL: "Conditions are within normal limits.",
  YELLOW: "Stay hydrated and avoid prolonged sun exposure during peak hours.",
  ORANGE: "Limit outdoor activity; check on the elderly and outdoor workers.",
  RED: "Extreme heat emergency — avoid all non-essential outdoor exposure.",
};

/** Build a human-readable alert message for a region, level, and heat index. */
export function buildAlertMessage(
  regionName: string,
  level: HeatAlertLevel,
  heatIndexC: number,
): string {
  return `${level} heat alert for ${regionName}: heat index reached ${heatIndexC.toFixed(1)}°C. ${ALERT_ADVICE[level]}`;
}
