import type { HeatAlertLevel } from "@/lib/enums";
import type { RegionOverview } from "@/server/regions";

/** KPIs summarising the current state across all monitored regions. */
export interface OverviewKpis {
  regionsMonitored: number;
  activeAlerts: number;
  highestHeatIndex: { value: number; regionName: string } | null;
  populationUnderElevatedAlert: number;
}

/** Alert levels that count as "elevated" for the at-risk-population KPI. */
const ELEVATED_LEVELS: ReadonlySet<HeatAlertLevel> = new Set<HeatAlertLevel>([
  "ORANGE",
  "RED",
]);

/**
 * Derive the overview KPIs from the regions overview. Pure and total so the
 * dashboard and any tests share identical logic.
 */
export function computeOverviewKpis(regions: RegionOverview[]): OverviewKpis {
  let activeAlerts = 0;
  let populationUnderElevatedAlert = 0;
  let highestHeatIndex: OverviewKpis["highestHeatIndex"] = null;

  for (const region of regions) {
    if (region.activeAlert) {
      activeAlerts += 1;
    }
    if (ELEVATED_LEVELS.has(region.currentLevel)) {
      populationUnderElevatedAlert += region.population;
    }
    const heatIndex = region.latestReading?.heatIndexC;
    if (
      heatIndex !== undefined &&
      (highestHeatIndex === null || heatIndex > highestHeatIndex.value)
    ) {
      highestHeatIndex = { value: heatIndex, regionName: region.name };
    }
  }

  return {
    regionsMonitored: regions.length,
    activeAlerts,
    highestHeatIndex,
    populationUnderElevatedAlert,
  };
}
