/**
 * Aggregate statistics for a set of field-survey responses. Pure so the module
 * and its tests share identical logic.
 */

export interface SurveyAggregateInput {
  awarenessLevel: number;
  hasHeatPlan: boolean;
  accessToShade: boolean;
  accessToDrinkingWater: boolean;
}

export interface AwarenessBucket {
  level: number;
  count: number;
}

export interface SurveySummaryStats {
  count: number;
  averageAwareness: number | null;
  withHeatPlanPct: number | null;
  withShadePct: number | null;
  withWaterAccessPct: number | null;
  /** Counts for awareness levels 1–5 (always present, zero when absent). */
  awarenessDistribution: AwarenessBucket[];
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Compute aggregate survey statistics and the awareness-level distribution. */
export function computeSurveySummary(
  responses: SurveyAggregateInput[],
): SurveySummaryStats {
  const count = responses.length;
  const awarenessDistribution = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: responses.filter((r) => r.awarenessLevel === level).length,
  }));

  if (count === 0) {
    return {
      count: 0,
      averageAwareness: null,
      withHeatPlanPct: null,
      withShadePct: null,
      withWaterAccessPct: null,
      awarenessDistribution,
    };
  }

  const pct = (predicate: (r: SurveyAggregateInput) => boolean): number =>
    round1((responses.filter(predicate).length / count) * 100);

  return {
    count,
    averageAwareness: round1(
      responses.reduce((sum, r) => sum + r.awarenessLevel, 0) / count,
    ),
    withHeatPlanPct: pct((r) => r.hasHeatPlan),
    withShadePct: pct((r) => r.accessToShade),
    withWaterAccessPct: pct((r) => r.accessToDrinkingWater),
    awarenessDistribution,
  };
}
