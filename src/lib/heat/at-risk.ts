import { alertLevelRank, type HeatAlertLevel } from "../enums";

/**
 * "At-risk" intersection: regions that combine **high vulnerability** with an
 * **elevated (Orange/Red) alert level**, either current or predicted. Surfaces
 * priority regions for intervention.
 */

/** Vulnerability score at or above which a region counts as "high vulnerability". */
export const HIGH_VULNERABILITY_THRESHOLD = 55;

export interface AtRiskInput {
  regionId: string;
  name: string;
  state: string;
  vulnerabilityScore: number;
  currentLevel: HeatAlertLevel;
  /** Predicted peak level from the forecast service, if available. */
  predictedLevel?: HeatAlertLevel | null;
}

export interface AtRiskRegion extends AtRiskInput {
  triggerLevel: HeatAlertLevel;
  triggerSource: "current" | "predicted" | "both";
  priority: number;
  reason: string;
}

const isElevated = (level: HeatAlertLevel): boolean =>
  level === "ORANGE" || level === "RED";

const worseLevel = (a: HeatAlertLevel, b: HeatAlertLevel): HeatAlertLevel =>
  alertLevelRank(a) >= alertLevelRank(b) ? a : b;

const titleCase = (level: HeatAlertLevel): string =>
  level.charAt(0) + level.slice(1).toLowerCase();

/**
 * Rank regions that are high-vulnerability AND under an elevated alert (current
 * or predicted), most urgent first. Priority = vulnerability × severity factor
 * (Red 1.5, Orange 1.25).
 */
export function rankAtRisk(
  items: AtRiskInput[],
  threshold: number = HIGH_VULNERABILITY_THRESHOLD,
): AtRiskRegion[] {
  const result: AtRiskRegion[] = [];

  for (const item of items) {
    const currentElevated = isElevated(item.currentLevel);
    const predictedElevated = item.predictedLevel
      ? isElevated(item.predictedLevel)
      : false;

    if (
      item.vulnerabilityScore < threshold ||
      (!currentElevated && !predictedElevated)
    ) {
      continue;
    }

    const triggerLevel = worseLevel(
      item.currentLevel,
      item.predictedLevel ?? "NORMAL",
    );
    const triggerSource =
      currentElevated && predictedElevated
        ? "both"
        : currentElevated
          ? "current"
          : "predicted";
    const severityFactor = triggerLevel === "RED" ? 1.5 : 1.25;
    const priority = Math.round(item.vulnerabilityScore * severityFactor);

    const alertText =
      triggerSource === "predicted"
        ? `a predicted ${titleCase(triggerLevel)} alert`
        : triggerSource === "both"
          ? `current and predicted ${titleCase(triggerLevel)} alerts`
          : `a current ${titleCase(triggerLevel)} alert`;

    result.push({
      ...item,
      triggerLevel,
      triggerSource,
      priority,
      reason: `High vulnerability (${Math.round(item.vulnerabilityScore)}/100) with ${alertText}.`,
    });
  }

  result.sort(
    (a, b) =>
      b.priority - a.priority || b.vulnerabilityScore - a.vulnerabilityScore,
  );
  return result;
}
