import { describe, expect, it } from "vitest";

import type { HeatAlertLevel } from "@/lib/enums";
import { computeOverviewKpis } from "@/features/response/kpis";
import type { RegionOverview } from "@/server/regions";

/** Build a RegionOverview with sensible defaults for testing. */
function region(
  overrides: Partial<RegionOverview> & {
    name: string;
    heatIndexC?: number;
    hasActiveAlert?: boolean;
  },
): RegionOverview {
  const {
    name,
    currentLevel = "NORMAL" as HeatAlertLevel,
    population = 1_000_000,
    heatIndexC,
    hasActiveAlert = false,
    ...rest
  } = overrides;

  return {
    id: name.toLowerCase(),
    name,
    state: "Telangana",
    districtType: "Urban",
    latitude: 0,
    longitude: 0,
    population,
    latestReading:
      heatIndexC === undefined
        ? null
        : {
            id: `${name}-r`,
            regionId: name.toLowerCase(),
            timestamp: "2026-06-30T00:00:00.000Z",
            maxTempC: heatIndexC - 5,
            minTempC: heatIndexC - 15,
            humidityPct: 40,
            heatIndexC,
          },
    currentLevel,
    activeAlert: hasActiveAlert
      ? {
          id: `${name}-a`,
          regionId: name.toLowerCase(),
          level: currentLevel,
          heatIndexC: heatIndexC ?? null,
          issuedAt: "2026-06-30T00:00:00.000Z",
          message: "test",
          active: true,
        }
      : null,
    vulnerabilityScore: 50,
    healthRiskScore: 50,
    ...rest,
  };
}

describe("computeOverviewKpis", () => {
  const regions: RegionOverview[] = [
    region({
      name: "Hyderabad",
      currentLevel: "YELLOW",
      heatIndexC: 38,
      population: 10_000_000,
      hasActiveAlert: true,
    }),
    region({
      name: "Churu",
      currentLevel: "RED",
      heatIndexC: 55,
      population: 120_000,
      hasActiveAlert: true,
    }),
    region({
      name: "Mumbai",
      currentLevel: "ORANGE",
      heatIndexC: 46,
      population: 12_000_000,
      hasActiveAlert: true,
    }),
    region({
      name: "Vizag",
      currentLevel: "NORMAL",
      heatIndexC: 30,
      population: 2_000_000,
    }),
  ];

  it("counts regions and active alerts", () => {
    const kpis = computeOverviewKpis(regions);
    expect(kpis.regionsMonitored).toBe(4);
    expect(kpis.activeAlerts).toBe(3);
  });

  it("finds the highest current heat index and its region", () => {
    const kpis = computeOverviewKpis(regions);
    expect(kpis.highestHeatIndex).toEqual({ value: 55, regionName: "Churu" });
  });

  it("sums population under Orange/Red alert", () => {
    const kpis = computeOverviewKpis(regions);
    // Churu (RED) + Mumbai (ORANGE) = 12,120,000
    expect(kpis.populationUnderElevatedAlert).toBe(12_120_000);
  });

  it("handles an empty list", () => {
    const kpis = computeOverviewKpis([]);
    expect(kpis).toEqual({
      regionsMonitored: 0,
      activeAlerts: 0,
      highestHeatIndex: null,
      populationUnderElevatedAlert: 0,
    });
  });

  it("ignores regions with no latest reading when finding the max", () => {
    const kpis = computeOverviewKpis([
      region({ name: "NoData", currentLevel: "NORMAL" }),
      region({ name: "Warm", currentLevel: "YELLOW", heatIndexC: 35 }),
    ]);
    expect(kpis.highestHeatIndex).toEqual({ value: 35, regionName: "Warm" });
  });
});
