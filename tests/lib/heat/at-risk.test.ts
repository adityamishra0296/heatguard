import { describe, expect, it } from "vitest";

import { rankAtRisk, type AtRiskInput } from "@/lib/heat/at-risk";

function region(
  overrides: Partial<AtRiskInput> & { name: string },
): AtRiskInput {
  return {
    regionId: overrides.name.toLowerCase(),
    state: "Telangana",
    vulnerabilityScore: 40,
    currentLevel: "NORMAL",
    predictedLevel: null,
    ...overrides,
  };
}

describe("rankAtRisk", () => {
  it("includes high vulnerability + current elevated, excludes others", () => {
    const result = rankAtRisk([
      region({
        name: "HighVulnRed",
        vulnerabilityScore: 70,
        currentLevel: "RED",
      }),
      region({
        name: "LowVulnRed",
        vulnerabilityScore: 30,
        currentLevel: "RED",
      }),
      region({
        name: "HighVulnCalm",
        vulnerabilityScore: 70,
        currentLevel: "YELLOW",
      }),
    ]);
    expect(result.map((r) => r.name)).toEqual(["HighVulnRed"]);
  });

  it("uses the predicted level when current is not elevated", () => {
    const [r] = rankAtRisk([
      region({
        name: "Predicted",
        vulnerabilityScore: 65,
        currentLevel: "YELLOW",
        predictedLevel: "ORANGE",
      }),
    ]);
    expect(r.triggerSource).toBe("predicted");
    expect(r.triggerLevel).toBe("ORANGE");
    expect(r.priority).toBe(Math.round(65 * 1.25));
    expect(r.reason).toContain("predicted Orange");
  });

  it("marks both when current and predicted are elevated, using the worse level", () => {
    const [r] = rankAtRisk([
      region({
        name: "Both",
        vulnerabilityScore: 60,
        currentLevel: "ORANGE",
        predictedLevel: "RED",
      }),
    ]);
    expect(r.triggerSource).toBe("both");
    expect(r.triggerLevel).toBe("RED");
    expect(r.priority).toBe(Math.round(60 * 1.5));
  });

  it("ranks by priority, most urgent first", () => {
    const result = rankAtRisk([
      region({ name: "A", vulnerabilityScore: 60, currentLevel: "ORANGE" }), // 60*1.25=75
      region({ name: "B", vulnerabilityScore: 58, currentLevel: "RED" }), // 58*1.5=87
      region({ name: "C", vulnerabilityScore: 90, currentLevel: "ORANGE" }), // 90*1.25=112.5→113
    ]);
    expect(result.map((r) => r.name)).toEqual(["C", "B", "A"]);
  });

  it("respects a custom threshold", () => {
    const result = rankAtRisk(
      [region({ name: "Mid", vulnerabilityScore: 50, currentLevel: "RED" })],
      45,
    );
    expect(result).toHaveLength(1);
  });
});
