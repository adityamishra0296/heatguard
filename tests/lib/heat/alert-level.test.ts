import { describe, expect, it } from "vitest";

import {
  ALERT_LEVEL_THRESHOLDS_C,
  classifyAlertLevel,
} from "@/lib/heat/alert-level";

describe("classifyAlertLevel", () => {
  it("returns NORMAL below the yellow threshold", () => {
    expect(classifyAlertLevel(0)).toBe("NORMAL");
    expect(classifyAlertLevel(25)).toBe("NORMAL");
    expect(classifyAlertLevel(31.9)).toBe("NORMAL");
  });

  it("classifies each level at and just below its boundary", () => {
    // YELLOW: [32, 40)
    expect(classifyAlertLevel(ALERT_LEVEL_THRESHOLDS_C.YELLOW)).toBe("YELLOW");
    expect(classifyAlertLevel(39.9)).toBe("YELLOW");
    // ORANGE: [40, 52)
    expect(classifyAlertLevel(ALERT_LEVEL_THRESHOLDS_C.ORANGE)).toBe("ORANGE");
    expect(classifyAlertLevel(51.9)).toBe("ORANGE");
    // RED: [52, ∞)
    expect(classifyAlertLevel(ALERT_LEVEL_THRESHOLDS_C.RED)).toBe("RED");
    expect(classifyAlertLevel(65)).toBe("RED");
  });

  it("handles extreme and negative values", () => {
    expect(classifyAlertLevel(-40)).toBe("NORMAL");
    expect(classifyAlertLevel(120)).toBe("RED");
  });

  it("returns NORMAL for non-finite input (invalid data raises no alert)", () => {
    expect(classifyAlertLevel(Number.NaN)).toBe("NORMAL");
    expect(classifyAlertLevel(Number.POSITIVE_INFINITY)).toBe("NORMAL");
    expect(classifyAlertLevel(Number.NEGATIVE_INFINITY)).toBe("NORMAL");
  });
});
