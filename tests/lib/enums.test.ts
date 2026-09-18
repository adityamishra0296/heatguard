import { describe, expect, it } from "vitest";

import {
  alertLevelRank,
  DISTRICT_TYPES,
  FOCUS_STATES,
  HEAT_ALERT_LEVELS,
  toHeatAlertLevel,
} from "@/lib/enums";

describe("HEAT_ALERT_LEVELS", () => {
  it("is ordered from least to most severe", () => {
    expect(HEAT_ALERT_LEVELS).toEqual(["NORMAL", "YELLOW", "ORANGE", "RED"]);
  });
});

describe("alertLevelRank", () => {
  it("ranks levels by increasing severity", () => {
    expect(alertLevelRank("NORMAL")).toBe(0);
    expect(alertLevelRank("YELLOW")).toBe(1);
    expect(alertLevelRank("ORANGE")).toBe(2);
    expect(alertLevelRank("RED")).toBe(3);
  });

  it("orders consistently", () => {
    expect(alertLevelRank("RED")).toBeGreaterThan(alertLevelRank("ORANGE"));
    expect(alertLevelRank("YELLOW")).toBeGreaterThan(alertLevelRank("NORMAL"));
  });
});

describe("toHeatAlertLevel", () => {
  it("passes through valid levels", () => {
    for (const level of HEAT_ALERT_LEVELS) {
      expect(toHeatAlertLevel(level)).toBe(level);
    }
  });

  it("defaults unknown values to NORMAL", () => {
    expect(toHeatAlertLevel("purple")).toBe("NORMAL");
    expect(toHeatAlertLevel("")).toBe("NORMAL");
    expect(toHeatAlertLevel("red")).toBe("NORMAL"); // case-sensitive
  });
});

describe("focus constants", () => {
  it("covers the six v1 focus states", () => {
    expect(FOCUS_STATES).toHaveLength(6);
    expect(FOCUS_STATES).toContain("Telangana");
    expect(FOCUS_STATES).toContain("Delhi");
    expect(new Set(FOCUS_STATES).size).toBe(FOCUS_STATES.length);
  });

  it("defines the district types", () => {
    expect(DISTRICT_TYPES).toEqual([
      "Urban",
      "Rural",
      "Municipal",
      "Industrial",
    ]);
  });
});
