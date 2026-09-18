import type { HeatAlertLevel } from "../enums";
import { classifyAlertLevel } from "./alert-level";

/**
 * Mission-style 4-digit system health code. Each digit is a 0–3 severity for one
 * condition, aggregated across all regions:
 *
 *   digit 1 — Heat index   : worst current heat-index alert level
 *   digit 2 — Data feed     : regions with missing / stale telemetry
 *   digit 3 — Vulnerability : vulnerability of populations under elevated alert
 *   digit 4 — Recovery      : recovery lag (water-scarcity index)
 *
 * 0 = Normal, 1 = Watch, 2 = Warning, 3 = Critical. `0000` means all normal.
 */

export interface RegionSignal {
  heatIndexC: number | null;
  feedStale: boolean;
  vulnerabilityScore: number | null;
  waterScarcityIndex: number | null;
}

export type StatusSeverity = 0 | 1 | 2 | 3;

export const STATUS_STATE = ["Normal", "Watch", "Warning", "Critical"] as const;
export type StatusState = (typeof STATUS_STATE)[number];

export interface StatusDigit {
  key: "heat" | "feed" | "vulnerability" | "recovery";
  label: string;
  value: StatusSeverity;
  state: StatusState;
  meaning: string;
  detail: string;
}

export interface StatusCodeResult {
  code: string;
  overall: StatusState;
  digits: StatusDigit[];
}

const HEAT_SEVERITY: Record<HeatAlertLevel, StatusSeverity> = {
  NORMAL: 0,
  YELLOW: 1,
  ORANGE: 2,
  RED: 3,
};

/** Compute the 4-digit system status code from live per-region signals. */
export function computeStatusCode(signals: RegionSignal[]): StatusCodeResult {
  let heat: StatusSeverity = 0;
  let redCount = 0;
  let orangeCount = 0;
  const elevatedVulnerabilities: number[] = [];
  let maxWater = 0;

  for (const signal of signals) {
    const level =
      signal.heatIndexC === null
        ? "NORMAL"
        : classifyAlertLevel(signal.heatIndexC);
    const severity = HEAT_SEVERITY[level];
    if (severity > heat) heat = severity;
    if (level === "RED") redCount += 1;
    else if (level === "ORANGE") orangeCount += 1;
    if (
      (level === "ORANGE" || level === "RED") &&
      signal.vulnerabilityScore !== null
    ) {
      elevatedVulnerabilities.push(signal.vulnerabilityScore);
    }
    if (
      signal.waterScarcityIndex !== null &&
      signal.waterScarcityIndex > maxWater
    ) {
      maxWater = signal.waterScarcityIndex;
    }
  }

  const staleCount = signals.filter((s) => s.feedStale).length;
  const feed: StatusSeverity =
    staleCount === 0 ? 0 : staleCount <= 1 ? 1 : staleCount <= 3 ? 2 : 3;

  const maxVulnerability = elevatedVulnerabilities.length
    ? Math.max(...elevatedVulnerabilities)
    : 0;
  const vulnerability: StatusSeverity =
    elevatedVulnerabilities.length === 0
      ? 0
      : maxVulnerability >= 75
        ? 3
        : maxVulnerability >= 60
          ? 2
          : maxVulnerability >= 45
            ? 1
            : 0;

  const recovery: StatusSeverity =
    maxWater >= 70 ? 3 : maxWater >= 55 ? 2 : maxWater >= 40 ? 1 : 0;

  const digits: StatusDigit[] = [
    {
      key: "heat",
      label: "Heat index",
      value: heat,
      state: STATUS_STATE[heat],
      meaning: "Worst current heat-index alert level across regions.",
      detail:
        heat === 0
          ? "No region above Yellow."
          : `${redCount} at Red, ${orangeCount} at Orange.`,
    },
    {
      key: "feed",
      label: "Data feed",
      value: feed,
      state: STATUS_STATE[feed],
      meaning: "Regions with missing or stale telemetry.",
      detail:
        staleCount === 0
          ? "All feeds current."
          : `${staleCount} region feed(s) stale.`,
    },
    {
      key: "vulnerability",
      label: "Vulnerability",
      value: vulnerability,
      state: STATUS_STATE[vulnerability],
      meaning: "Vulnerability of populations under elevated alert.",
      detail:
        elevatedVulnerabilities.length === 0
          ? "No elevated-alert regions."
          : `Peak vulnerability ${Math.round(maxVulnerability)} / 100 under alert.`,
    },
    {
      key: "recovery",
      label: "Recovery",
      value: recovery,
      state: STATUS_STATE[recovery],
      meaning: "Recovery lag, proxied by the water-scarcity index.",
      detail: `Peak water-scarcity index ${Math.round(maxWater)} / 100.`,
    },
  ];

  const worst = Math.max(heat, feed, vulnerability, recovery) as StatusSeverity;
  return {
    code: `${heat}${feed}${vulnerability}${recovery}`,
    overall: STATUS_STATE[worst],
    digits,
  };
}
