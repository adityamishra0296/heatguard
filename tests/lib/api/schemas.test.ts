import { describe, expect, it } from "vitest";

import {
  alertsQuerySchema,
  createAlertSchema,
  createSurveySchema,
  regionRangeQuerySchema,
  updateAlertSchema,
} from "@/lib/api/schemas";

describe("createSurveySchema", () => {
  const base = {
    regionId: "region-1",
    awarenessLevel: 3,
    hasHeatPlan: true,
    accessToShade: false,
    accessToDrinkingWater: true,
  };

  it("accepts a valid survey and trims the regionId", () => {
    const result = createSurveySchema.parse({
      ...base,
      regionId: "  region-1  ",
    });
    expect(result.regionId).toBe("region-1");
    expect(result.notes).toBeUndefined();
  });

  it("rejects an empty regionId", () => {
    expect(
      createSurveySchema.safeParse({ ...base, regionId: "   " }).success,
    ).toBe(false);
  });

  it("bounds awarenessLevel to an integer 1–5", () => {
    expect(
      createSurveySchema.safeParse({ ...base, awarenessLevel: 0 }).success,
    ).toBe(false);
    expect(
      createSurveySchema.safeParse({ ...base, awarenessLevel: 6 }).success,
    ).toBe(false);
    expect(
      createSurveySchema.safeParse({ ...base, awarenessLevel: 2.5 }).success,
    ).toBe(false);
    expect(
      createSurveySchema.safeParse({ ...base, awarenessLevel: 5 }).success,
    ).toBe(true);
  });

  it("rejects notes longer than 1000 characters", () => {
    expect(
      createSurveySchema.safeParse({ ...base, notes: "x".repeat(1001) })
        .success,
    ).toBe(false);
    expect(createSurveySchema.safeParse({ ...base, notes: "ok" }).success).toBe(
      true,
    );
  });

  it("requires the boolean fields", () => {
    const { hasHeatPlan: _omit, ...missing } = base;
    void _omit;
    expect(createSurveySchema.safeParse(missing).success).toBe(false);
  });
});

describe("createAlertSchema", () => {
  it("accepts an in-range heat index", () => {
    expect(createAlertSchema.parse({ regionId: "r1", heatIndexC: 42 })).toEqual(
      {
        regionId: "r1",
        heatIndexC: 42,
      },
    );
  });

  it("rejects out-of-range or non-numeric heat index", () => {
    expect(
      createAlertSchema.safeParse({ regionId: "r1", heatIndexC: -40 }).success,
    ).toBe(false);
    expect(
      createAlertSchema.safeParse({ regionId: "r1", heatIndexC: 100 }).success,
    ).toBe(false);
    expect(
      createAlertSchema.safeParse({ regionId: "r1", heatIndexC: "hot" })
        .success,
    ).toBe(false);
  });
});

describe("updateAlertSchema", () => {
  it("requires a boolean active flag", () => {
    expect(updateAlertSchema.parse({ active: false })).toEqual({
      active: false,
    });
    expect(updateAlertSchema.safeParse({ active: "no" }).success).toBe(false);
    expect(updateAlertSchema.safeParse({}).success).toBe(false);
  });
});

describe("alertsQuerySchema", () => {
  it("parses the active flag from its string form", () => {
    expect(alertsQuerySchema.parse({ active: "true" }).active).toBe(true);
    expect(alertsQuerySchema.parse({ active: "false" }).active).toBe(false);
    expect(alertsQuerySchema.parse({}).active).toBeUndefined();
  });

  it("rejects a non-boolean active value", () => {
    expect(alertsQuerySchema.safeParse({ active: "1" }).success).toBe(false);
  });
});

describe("regionRangeQuerySchema", () => {
  it("coerces ISO dates and enforces from <= to", () => {
    const ok = regionRangeQuerySchema.parse({
      regionId: "r1",
      from: "2026-05-01",
      to: "2026-05-10",
    });
    expect(ok.from).toBeInstanceOf(Date);
    expect(ok.to).toBeInstanceOf(Date);
  });

  it("rejects an inverted date range", () => {
    const result = regionRangeQuerySchema.safeParse({
      regionId: "r1",
      from: "2026-05-10",
      to: "2026-05-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid date", () => {
    expect(
      regionRangeQuerySchema.safeParse({ regionId: "r1", from: "not-a-date" })
        .success,
    ).toBe(false);
  });
});
