import { describe, expect, it } from "vitest";

import { computeStatusCode, type RegionSignal } from "@/lib/heat/status-code";

function signal(overrides: Partial<RegionSignal> = {}): RegionSignal {
  return {
    heatIndexC: 25,
    feedStale: false,
    vulnerabilityScore: 20,
    waterScarcityIndex: 20,
    ...overrides,
  };
}

describe("computeStatusCode", () => {
  it("returns 0000 when everything is normal", () => {
    const result = computeStatusCode([signal(), signal(), signal()]);
    expect(result.code).toBe("0000");
    expect(result.overall).toBe("Normal");
  });

  it("digit 1 (heat) reflects the worst current level", () => {
    // one Red (>=52), one Orange (>=40)
    const result = computeStatusCode([
      signal({ heatIndexC: 55 }),
      signal({ heatIndexC: 42 }),
      signal({ heatIndexC: 30 }),
    ]);
    expect(result.code[0]).toBe("3");
    expect(result.digits[0].detail).toContain("1 at Red");
  });

  it("treats a null heat index as Normal for the heat digit", () => {
    expect(computeStatusCode([signal({ heatIndexC: null })]).code[0]).toBe("0");
  });

  it("digit 2 (feed) scales with the number of stale feeds", () => {
    expect(computeStatusCode([signal()]).code[1]).toBe("0");
    expect(computeStatusCode([signal({ feedStale: true })]).code[1]).toBe("1");
    expect(
      computeStatusCode([
        signal({ feedStale: true }),
        signal({ feedStale: true }),
      ]).code[1],
    ).toBe("2");
    expect(
      computeStatusCode(
        Array.from({ length: 4 }, () => signal({ feedStale: true })),
      ).code[1],
    ).toBe("3");
  });

  it("digit 3 (vulnerability) only counts regions under elevated alert", () => {
    // high vulnerability but NOT elevated → 0
    expect(
      computeStatusCode([signal({ heatIndexC: 30, vulnerabilityScore: 90 })])
        .code[2],
    ).toBe("0");
    // high vulnerability AND Red → 3
    expect(
      computeStatusCode([signal({ heatIndexC: 55, vulnerabilityScore: 90 })])
        .code[2],
    ).toBe("3");
    // moderate vulnerability + Orange → 1
    expect(
      computeStatusCode([signal({ heatIndexC: 42, vulnerabilityScore: 50 })])
        .code[2],
    ).toBe("1");
  });

  it("digit 4 (recovery) tracks the peak water-scarcity index", () => {
    expect(
      computeStatusCode([signal({ waterScarcityIndex: 30 })]).code[3],
    ).toBe("0");
    expect(
      computeStatusCode([signal({ waterScarcityIndex: 45 })]).code[3],
    ).toBe("1");
    expect(
      computeStatusCode([signal({ waterScarcityIndex: 60 })]).code[3],
    ).toBe("2");
    expect(
      computeStatusCode([signal({ waterScarcityIndex: 80 })]).code[3],
    ).toBe("3");
  });

  it("overall state is the worst digit", () => {
    const result = computeStatusCode([
      signal({
        heatIndexC: 55,
        vulnerabilityScore: 90,
        waterScarcityIndex: 80,
        feedStale: true,
      }),
    ]);
    expect(result.overall).toBe("Critical");
    expect(result.digits).toHaveLength(4);
  });
});
