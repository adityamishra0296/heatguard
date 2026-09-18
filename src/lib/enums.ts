/**
 * Domain enumerations for HeatGuard.
 *
 * SQLite (the development datasource) does not support native Prisma enums, so
 * these constrained value sets are stored as `String` columns in the database
 * and validated/typed here. This module is the single source of truth for those
 * values across the seed, the server, and the UI.
 */

/** The six focus states covered by HeatGuard v1. */
export const FOCUS_STATES = [
  "Telangana",
  "Andhra Pradesh",
  "Odisha",
  "Rajasthan",
  "Maharashtra",
  "Delhi",
] as const;

export type FocusState = (typeof FOCUS_STATES)[number];

/** District classification used to tune vulnerability and impact modelling. */
export const DISTRICT_TYPES = [
  "Urban",
  "Rural",
  "Municipal",
  "Industrial",
] as const;

export type DistrictType = (typeof DISTRICT_TYPES)[number];

/**
 * IMD-style heat-wave alert levels, ordered by increasing severity.
 * Normal / Yellow (watch) / Orange (warning) / Red (emergency).
 */
export const HEAT_ALERT_LEVELS = ["NORMAL", "YELLOW", "ORANGE", "RED"] as const;

export type HeatAlertLevel = (typeof HEAT_ALERT_LEVELS)[number];

/** Numeric severity rank of an alert level (NORMAL = 0 … RED = 3). */
export function alertLevelRank(level: HeatAlertLevel): number {
  return HEAT_ALERT_LEVELS.indexOf(level);
}

/** Narrow an arbitrary string to a HeatAlertLevel, defaulting to NORMAL. */
export function toHeatAlertLevel(value: string): HeatAlertLevel {
  return HEAT_ALERT_LEVELS.find((level) => level === value) ?? "NORMAL";
}
