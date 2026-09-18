import type { HeatAlertLevel } from "@/lib/enums";
import {
  classifyAlertLevel,
  computeHealthRiskScore,
  computeVulnerabilityScore,
} from "@/lib/heat";

import { prisma } from "./db";
import { NotFoundError } from "@/lib/api/http";
import {
  dateRangeFilter,
  toAlertDTO,
  toReadingDTO,
  toRecoveryDTO,
  type AlertDTO,
  type ReadingDTO,
  type RecoveryDTO,
} from "./serializers";

/** Throw {@link NotFoundError} if no region has the given id. */
export async function assertRegionExists(regionId: string): Promise<void> {
  const region = await prisma.region.findUnique({
    where: { id: regionId },
    select: { id: true },
  });
  if (!region) {
    throw new NotFoundError(`Region '${regionId}' was not found.`);
  }
}

/**
 * Lightweight lookup of a region's identity (name + state).
 *
 * Used by the detail page's `generateMetadata`, which runs before the response
 * is committed — so calling {@link NotFoundError} there yields a real 404 even
 * when the page streams a loading skeleton. Throws if the region is missing.
 */
export async function getRegionIdentity(
  regionId: string,
): Promise<{ name: string; state: string }> {
  const region = await prisma.region.findUnique({
    where: { id: regionId },
    select: { name: true, state: true },
  });
  if (!region) {
    throw new NotFoundError(`Region '${regionId}' was not found.`);
  }
  return region;
}

/** Minimal region list for selectors (id, name, state), ordered by state then name. */
export async function getRegionsList(): Promise<
  { id: string; name: string; state: string }[]
> {
  return prisma.region.findMany({
    orderBy: [{ state: "asc" }, { name: "asc" }],
    select: { id: true, name: true, state: true },
  });
}

/** The most recent telemetry timestamp across all regions (ISO string), or null. */
export async function getLatestReadingTimestamp(): Promise<string | null> {
  const latest = await prisma.temperatureReading.findFirst({
    orderBy: { timestamp: "desc" },
    select: { timestamp: true },
  });
  return latest ? latest.timestamp.toISOString() : null;
}

export interface VulnerabilityDTO {
  elderlyCount: number;
  outdoorWorkersCount: number;
  childrenCount: number;
  hasCoolingAccessPct: number;
  hasWaterAccessPct: number;
  score: number;
}

export interface RegionOverview {
  id: string;
  name: string;
  state: string;
  districtType: string;
  latitude: number;
  longitude: number;
  population: number;
  latestReading: ReadingDTO | null;
  currentLevel: HeatAlertLevel;
  activeAlert: AlertDTO | null;
  vulnerabilityScore: number | null;
  healthRiskScore: number | null;
}

/** List all regions with their latest reading, active alert, and current scores. */
export async function getRegionsOverview(): Promise<RegionOverview[]> {
  const regions = await prisma.region.findMany({
    orderBy: [{ state: "asc" }, { name: "asc" }],
    include: {
      vulnerablePopulation: true,
      temperatureReadings: { orderBy: { timestamp: "desc" }, take: 1 },
      heatAlerts: {
        where: { active: true },
        orderBy: { issuedAt: "desc" },
        take: 1,
      },
    },
  });

  return regions.map((region) => {
    const latest = region.temperatureReadings[0] ?? null;
    const activeAlert = region.heatAlerts[0] ?? null;
    const vulnerabilityScore = region.vulnerablePopulation
      ? computeVulnerabilityScore(region, region.vulnerablePopulation)
      : null;
    const healthRiskScore =
      latest && vulnerabilityScore !== null
        ? computeHealthRiskScore(latest.heatIndexC, vulnerabilityScore)
        : null;

    return {
      id: region.id,
      name: region.name,
      state: region.state,
      districtType: region.districtType,
      latitude: region.latitude,
      longitude: region.longitude,
      population: region.population,
      latestReading: latest ? toReadingDTO(latest) : null,
      currentLevel: latest ? classifyAlertLevel(latest.heatIndexC) : "NORMAL",
      activeAlert: activeAlert ? toAlertDTO(activeAlert) : null,
      vulnerabilityScore,
      healthRiskScore,
    };
  });
}

export interface SurveySummary {
  count: number;
  averageAwareness: number | null;
  withHeatPlanPct: number | null;
  withShadePct: number | null;
  withDrinkingWaterPct: number | null;
}

interface SurveyRow {
  awarenessLevel: number;
  hasHeatPlan: boolean;
  accessToShade: boolean;
  accessToDrinkingWater: boolean;
}

function summariseSurveys(surveys: SurveyRow[]): SurveySummary {
  const count = surveys.length;
  if (count === 0) {
    return {
      count: 0,
      averageAwareness: null,
      withHeatPlanPct: null,
      withShadePct: null,
      withDrinkingWaterPct: null,
    };
  }

  const round1 = (value: number): number => Math.round(value * 10) / 10;
  const pct = (predicate: (s: SurveyRow) => boolean): number =>
    round1((surveys.filter(predicate).length / count) * 100);

  return {
    count,
    averageAwareness: round1(
      surveys.reduce((sum, s) => sum + s.awarenessLevel, 0) / count,
    ),
    withHeatPlanPct: pct((s) => s.hasHeatPlan),
    withShadePct: pct((s) => s.accessToShade),
    withDrinkingWaterPct: pct((s) => s.accessToDrinkingWater),
  };
}

export interface RegionDetail {
  region: {
    id: string;
    name: string;
    state: string;
    districtType: string;
    latitude: number;
    longitude: number;
    population: number;
  };
  current: {
    latestReading: ReadingDTO | null;
    level: HeatAlertLevel;
    healthRiskScore: number | null;
  };
  vulnerability: VulnerabilityDTO | null;
  readings: ReadingDTO[];
  alerts: AlertDTO[];
  recovery: RecoveryDTO[];
  surveySummary: SurveySummary;
}

/** Full detail for one region: readings (optional window), alerts, vulnerability,
 *  recovery, and a survey summary, plus current derived scores. */
export async function getRegionDetail(
  regionId: string,
  range: { from?: Date; to?: Date } = {},
): Promise<RegionDetail> {
  const region = await prisma.region.findUnique({
    where: { id: regionId },
    include: { vulnerablePopulation: true },
  });
  if (!region) {
    throw new NotFoundError(`Region '${regionId}' was not found.`);
  }

  const [readings, latestReading, alerts, recovery, surveys] =
    await Promise.all([
      prisma.temperatureReading.findMany({
        where: { regionId, timestamp: dateRangeFilter(range.from, range.to) },
        orderBy: { timestamp: "asc" },
      }),
      prisma.temperatureReading.findFirst({
        where: { regionId },
        orderBy: { timestamp: "desc" },
      }),
      prisma.heatAlert.findMany({
        where: { regionId },
        orderBy: { issuedAt: "desc" },
      }),
      prisma.recoveryIndicator.findMany({
        where: { regionId, date: dateRangeFilter(range.from, range.to) },
        orderBy: { date: "asc" },
      }),
      prisma.surveyResponse.findMany({ where: { regionId } }),
    ]);

  const vulnerabilityScore = region.vulnerablePopulation
    ? computeVulnerabilityScore(region, region.vulnerablePopulation)
    : null;

  const healthRiskScore =
    latestReading && vulnerabilityScore !== null
      ? computeHealthRiskScore(latestReading.heatIndexC, vulnerabilityScore)
      : null;

  return {
    region: {
      id: region.id,
      name: region.name,
      state: region.state,
      districtType: region.districtType,
      latitude: region.latitude,
      longitude: region.longitude,
      population: region.population,
    },
    current: {
      latestReading: latestReading ? toReadingDTO(latestReading) : null,
      level: latestReading
        ? classifyAlertLevel(latestReading.heatIndexC)
        : "NORMAL",
      healthRiskScore,
    },
    vulnerability:
      region.vulnerablePopulation && vulnerabilityScore !== null
        ? {
            elderlyCount: region.vulnerablePopulation.elderlyCount,
            outdoorWorkersCount:
              region.vulnerablePopulation.outdoorWorkersCount,
            childrenCount: region.vulnerablePopulation.childrenCount,
            hasCoolingAccessPct:
              region.vulnerablePopulation.hasCoolingAccessPct,
            hasWaterAccessPct: region.vulnerablePopulation.hasWaterAccessPct,
            score: vulnerabilityScore,
          }
        : null,
    readings: readings.map(toReadingDTO),
    alerts: alerts.map(toAlertDTO),
    recovery: recovery.map(toRecoveryDTO),
    surveySummary: summariseSurveys(surveys),
  };
}
