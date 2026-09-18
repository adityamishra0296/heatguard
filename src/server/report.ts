/**
 * Assemble the final-report data model from live application data.
 *
 * Every optional source is fetched inside a guard so a single failure (e.g. the
 * prediction microservice being offline, or an empty table) degrades to an empty
 * section rather than failing the whole report. The prediction service already
 * returns `null` when unavailable.
 */

import {
  FOCUS_STATES,
  HEAT_ALERT_LEVELS,
  type HeatAlertLevel,
} from "@/lib/enums";
import type {
  PredictionData,
  RecoveryData,
  RecoverySeriesPoint,
  RegionRow,
  ReportModel,
  ResponseData,
  StudyAreaData,
  VulnerabilityData,
} from "@/lib/report/types";

import { getAlertCenter } from "./alerts";
import { prisma } from "./db";
import { getPredictedRiskSummary } from "./ml";
import {
  getLatestReadingTimestamp,
  getRegionsOverview,
  type RegionOverview,
} from "./regions";
import { getVulnerabilityAssessment } from "./vulnerability";

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Run an async data fetch, returning `fallback` on any failure. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function buildStudyArea(overview: RegionOverview[]): StudyAreaData {
  const byState = new Map<
    string,
    { regionCount: number; population: number }
  >();
  const byDistrictType = new Map<string, number>();
  let totalPopulation = 0;

  for (const region of overview) {
    totalPopulation += region.population;
    const state = byState.get(region.state) ?? {
      regionCount: 0,
      population: 0,
    };
    state.regionCount += 1;
    state.population += region.population;
    byState.set(region.state, state);
    byDistrictType.set(
      region.districtType,
      (byDistrictType.get(region.districtType) ?? 0) + 1,
    );
  }

  const regions: RegionRow[] = overview.map((r) => ({
    name: r.name,
    state: r.state,
    districtType: r.districtType,
    population: r.population,
    latitude: r.latitude,
    longitude: r.longitude,
    level: r.currentLevel,
    heatIndexC: r.latestReading?.heatIndexC ?? null,
    vulnerabilityScore: r.vulnerabilityScore,
  }));

  return {
    regionCount: overview.length,
    stateCount: byState.size,
    totalPopulation,
    states: [...byState.entries()]
      .map(([state, v]) => ({ state, ...v }))
      .sort((a, b) => b.population - a.population),
    districtTypes: [...byDistrictType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    regions,
  };
}

function buildResponse(
  overview: RegionOverview[],
  statusCode: ResponseData["statusCode"],
  activeAlertCount: number,
): ResponseData {
  const levelCounts = HEAT_ALERT_LEVELS.map((level) => ({
    level,
    count: overview.filter((r) => r.currentLevel === level).length,
  }));

  const withReadings = overview.filter((r) => r.latestReading !== null);
  const avgHeatIndexC =
    withReadings.length === 0
      ? null
      : round1(
          withReadings.reduce(
            (sum, r) => sum + (r.latestReading?.heatIndexC ?? 0),
            0,
          ) / withReadings.length,
        );

  const worstHit = withReadings
    .slice()
    .sort(
      (a, b) =>
        (b.latestReading?.heatIndexC ?? 0) - (a.latestReading?.heatIndexC ?? 0),
    )
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      state: r.state,
      heatIndexC: round1(r.latestReading?.heatIndexC ?? 0),
      level: r.currentLevel,
    }));

  return { statusCode, levelCounts, activeAlertCount, avgHeatIndexC, worstHit };
}

/** Aggregate recovery indicators across all districts. */
async function buildRecovery(
  overview: RegionOverview[],
): Promise<RecoveryData> {
  const nameByRegion = new Map(
    overview.map((r) => [r.id, { name: r.name, state: r.state }]),
  );

  const empty: RecoveryData = {
    available: false,
    totals: {
      hospitalAdmissions: 0,
      workdaysLost: 0,
      electricityFailures: 0,
      avgCropLossPct: 0,
      avgWaterScarcityIndex: 0,
    },
    worstByAdmissions: [],
    series: [],
  };

  return safe(async () => {
    const [totals, byRegion, byDate] = await Promise.all([
      prisma.recoveryIndicator.aggregate({
        _sum: {
          hospitalAdmissions: true,
          workdaysLost: true,
          electricityFailures: true,
        },
        _avg: { cropLossPct: true, waterScarcityIndex: true },
      }),
      prisma.recoveryIndicator.groupBy({
        by: ["regionId"],
        _sum: { hospitalAdmissions: true, workdaysLost: true },
        orderBy: { _sum: { hospitalAdmissions: "desc" } },
        take: 6,
      }),
      prisma.recoveryIndicator.groupBy({
        by: ["date"],
        _sum: { hospitalAdmissions: true, workdaysLost: true },
        orderBy: { date: "asc" },
      }),
    ]);

    const count = await prisma.recoveryIndicator.count();
    if (count === 0) return empty;

    const worstByAdmissions = byRegion.map((row) => {
      const region = nameByRegion.get(row.regionId);
      return {
        name: region?.name ?? "Unknown",
        state: region?.state ?? "—",
        hospitalAdmissions: row._sum.hospitalAdmissions ?? 0,
        workdaysLost: row._sum.workdaysLost ?? 0,
      };
    });

    const series: RecoverySeriesPoint[] = byDate.map((row) => ({
      date: row.date.toISOString(),
      hospitalAdmissions: row._sum.hospitalAdmissions ?? 0,
      workdaysLost: row._sum.workdaysLost ?? 0,
    }));

    return {
      available: true,
      totals: {
        hospitalAdmissions: totals._sum.hospitalAdmissions ?? 0,
        workdaysLost: totals._sum.workdaysLost ?? 0,
        electricityFailures: totals._sum.electricityFailures ?? 0,
        avgCropLossPct: round1(totals._avg.cropLossPct ?? 0),
        avgWaterScarcityIndex: round1(totals._avg.waterScarcityIndex ?? 0),
      },
      worstByAdmissions,
      series,
    };
  }, empty);
}

/** Build the complete report model from live data. Resilient to missing sources. */
export async function buildReportModel(): Promise<ReportModel> {
  const [overview, alertCenter, vulnAssessment, predicted, dataAsOf] =
    await Promise.all([
      safe(() => getRegionsOverview(), [] as RegionOverview[]),
      safe(() => getAlertCenter(), null),
      safe(() => getVulnerabilityAssessment(), null),
      safe(() => getPredictedRiskSummary(7), null),
      safe(() => getLatestReadingTimestamp(), null),
    ]);

  const activeAlertCount = alertCenter
    ? alertCenter.feed.filter((a) => a.active).length
    : overview.filter((r) => r.activeAlert !== null).length;

  const response = buildResponse(
    overview,
    alertCenter?.statusCode ?? null,
    activeAlertCount,
  );
  const studyArea = buildStudyArea(overview);
  const recovery = await buildRecovery(overview);

  const vulnerability: VulnerabilityData = vulnAssessment
    ? {
        available: vulnAssessment.rows.length > 0,
        top: vulnAssessment.rows.slice(0, 6).map((r) => ({
          name: r.name,
          state: r.state,
          score: r.score,
          band: r.band,
        })),
        atRisk: vulnAssessment.atRisk.slice(0, 6).map((r) => ({
          name: r.name,
          state: r.state,
          score: r.vulnerabilityScore,
          currentLevel: r.currentLevel,
          predictedLevel: r.predictedLevel ?? null,
        })),
        weights: vulnAssessment.weights.map((w) => ({
          label: w.label,
          weight: w.weight,
        })),
      }
    : { available: false, top: [], atRisk: [], weights: [] };

  const prediction: PredictionData = predicted
    ? {
        available: predicted.length > 0,
        top: predicted
          .slice()
          .sort((a, b) => b.peakPredictedHeatIndexC - a.peakPredictedHeatIndexC)
          .slice(0, 6)
          .map((r) => ({
            name: r.name,
            state: r.state,
            peakHeatIndexC: round1(r.peakPredictedHeatIndexC),
            peakLevel: r.peakLevel as HeatAlertLevel,
            daysElevated: r.daysElevated,
          })),
      }
    : { available: false, top: [] };

  return {
    meta: {
      title: "Heat Wave Disaster Management — Final Report",
      subtitle:
        "Early-warning, recovery, and resilience analysis for India's heat-exposed districts",
      organisation: "HeatGuard",
      generatedAt: new Date().toISOString(),
      focusStates: [...FOCUS_STATES],
      dataAsOf,
    },
    studyArea,
    response,
    recovery,
    vulnerability,
    prediction,
  };
}
