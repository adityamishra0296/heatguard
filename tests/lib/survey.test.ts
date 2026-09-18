import { describe, expect, it } from "vitest";

import { computeSurveySummary, type SurveyAggregateInput } from "@/lib/survey";

function response(
  overrides: Partial<SurveyAggregateInput> = {},
): SurveyAggregateInput {
  return {
    awarenessLevel: 3,
    hasHeatPlan: false,
    accessToShade: false,
    accessToDrinkingWater: false,
    ...overrides,
  };
}

describe("computeSurveySummary", () => {
  it("returns nulls and a zeroed distribution for no responses", () => {
    const summary = computeSurveySummary([]);
    expect(summary.count).toBe(0);
    expect(summary.averageAwareness).toBeNull();
    expect(summary.withHeatPlanPct).toBeNull();
    expect(summary.awarenessDistribution).toEqual([
      { level: 1, count: 0 },
      { level: 2, count: 0 },
      { level: 3, count: 0 },
      { level: 4, count: 0 },
      { level: 5, count: 0 },
    ]);
  });

  it("computes averages, percentages, and the distribution", () => {
    const responses = [
      response({
        awarenessLevel: 5,
        hasHeatPlan: true,
        accessToDrinkingWater: true,
        accessToShade: true,
      }),
      response({
        awarenessLevel: 3,
        hasHeatPlan: true,
        accessToDrinkingWater: false,
      }),
      response({
        awarenessLevel: 1,
        hasHeatPlan: false,
        accessToDrinkingWater: true,
      }),
      response({
        awarenessLevel: 3,
        hasHeatPlan: false,
        accessToDrinkingWater: true,
      }),
    ];
    const summary = computeSurveySummary(responses);
    expect(summary.count).toBe(4);
    expect(summary.averageAwareness).toBe(3); // (5+3+1+3)/4
    expect(summary.withHeatPlanPct).toBe(50); // 2/4
    expect(summary.withWaterAccessPct).toBe(75); // 3/4
    expect(summary.withShadePct).toBe(25); // 1/4
    expect(
      summary.awarenessDistribution.find((b) => b.level === 3)?.count,
    ).toBe(2);
    expect(
      summary.awarenessDistribution.find((b) => b.level === 5)?.count,
    ).toBe(1);
  });
});
