import { describe, expect, it } from "vitest";

import { niceMax, projectPoints, scaleLinear } from "@/lib/report/scale";

describe("niceMax", () => {
  it("returns 1 for non-positive input", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(-4)).toBe(1);
  });

  it("rounds up to a 1/2/2.5/5 × 10ⁿ boundary", () => {
    expect(niceMax(1)).toBe(1);
    expect(niceMax(4)).toBe(5);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(12)).toBe(20);
    expect(niceMax(23)).toBe(25);
    expect(niceMax(45)).toBe(50);
    expect(niceMax(100)).toBe(100);
  });
});

describe("scaleLinear", () => {
  it("maps within the domain and clamps outside it", () => {
    expect(scaleLinear(5, 10, 100)).toBe(50);
    expect(scaleLinear(20, 10, 100)).toBe(100);
    expect(scaleLinear(-5, 10, 100)).toBe(0);
  });

  it("returns 0 for a non-positive domain", () => {
    expect(scaleLinear(5, 0, 100)).toBe(0);
  });
});

describe("projectPoints", () => {
  it("inverts latitude so higher latitude maps to a smaller y", () => {
    const [south, north] = projectPoints(
      [
        { latitude: 10, longitude: 70 },
        { latitude: 20, longitude: 80 },
      ],
      100,
      100,
      10,
    );
    expect(north.y).toBeLessThan(south.y);
    expect(south.x).toBe(10);
    expect(north.x).toBe(90);
  });

  it("centres a degenerate (zero-span) axis", () => {
    const [a, b] = projectPoints(
      [
        { latitude: 15, longitude: 75 },
        { latitude: 15, longitude: 85 },
      ],
      100,
      100,
      10,
    );
    expect(a.y).toBe(50);
    expect(b.y).toBe(50);
  });

  it("returns an empty array for no points", () => {
    expect(projectPoints([], 100, 100, 10)).toEqual([]);
  });
});
