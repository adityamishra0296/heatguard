import { describe, expect, it } from "vitest";

import { computeHealthRiskScore } from "@/lib/heat/health-risk";

describe("computeHealthRiskScore", () => {
  it("returns a value within [0, 100]", () => {
    expect(computeHealthRiskScore(45, 60)).toBeGreaterThanOrEqual(0);
    expect(computeHealthRiskScore(45, 60)).toBeLessThanOrEqual(100);
  });

  it("is 0 when there is no heat hazard, regardless of vulnerability", () => {
    expect(computeHealthRiskScore(27, 100)).toBe(0);
    expect(computeHealthRiskScore(20, 100)).toBe(0);
  });

  it("reaches 100 under extreme heat and maximum vulnerability", () => {
    expect(computeHealthRiskScore(54, 100)).toBe(100);
    expect(computeHealthRiskScore(60, 100)).toBe(100);
  });

  it("floors at 50% of the hazard when vulnerability is zero", () => {
    // Extreme hazard (=1) with no vulnerability → 100 * 1 * 0.5 = 50.
    expect(computeHealthRiskScore(54, 0)).toBe(50);
  });

  it("increases with heat index at fixed vulnerability", () => {
    expect(computeHealthRiskScore(48, 50)).toBeGreaterThan(
      computeHealthRiskScore(36, 50),
    );
  });

  it("increases with vulnerability at fixed heat index", () => {
    expect(computeHealthRiskScore(44, 90)).toBeGreaterThan(
      computeHealthRiskScore(44, 10),
    );
  });

  // --- Edge cases -----------------------------------------------------------

  it("clamps hazard above the extreme-danger ceiling", () => {
    expect(computeHealthRiskScore(80, 100)).toBe(100);
  });

  it("clamps out-of-range and non-finite vulnerability", () => {
    expect(computeHealthRiskScore(54, 150)).toBe(100);
    expect(computeHealthRiskScore(54, -50)).toBe(50);
    expect(computeHealthRiskScore(54, Number.NaN)).toBe(50);
  });

  it("treats non-finite heat index as no hazard", () => {
    expect(computeHealthRiskScore(Number.NaN, 100)).toBe(0);
  });
});
