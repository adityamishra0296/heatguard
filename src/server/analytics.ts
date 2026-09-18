import { cache } from "react";

import type { HeatAlertLevel } from "@/lib/enums";
import { classifyAlertLevel } from "@/lib/heat";

import { prisma } from "./db";

export interface AnalyticsRegion {
  id: string;
  name: string;
  state: string;
}

export interface TrendPoint {
  date: string;
  maxTempC: number;
  minTempC: number;
  heatIndexC: number;
}

export interface AlertBucket {
  bucket: string;
  NORMAL: number;
  YELLOW: number;
  ORANGE: number;
  RED: number;
}

export interface RecoveryPoint {
  date: string;
  hospitalAdmissions: number;
  workdaysLost: number;
  cropLossPct: number;
  waterScarcityIndex: number;
}

export interface CrossRegionPoint {
  id: string;
  name: string;
  state: string;
  peakHeatIndex: number;
}

export interface AnalyticsSummary {
  avgHeatIndex: number | null;
  daysOverElevated: number;
  totalDays: number;
  worstDay: { date: string; heatIndexC: number } | null;
}

export interface AnalyticsData {
  regions: AnalyticsRegion[];
  selectedRegion: AnalyticsRegion;
  range: { from: string; to: string; min: string; max: string };
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  alertDistribution: AlertBucket[];
  recovery: RecoveryPoint[];
  crossRegion: CrossRegionPoint[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const round1 = (value: number): number => Math.round(value * 10) / 10;

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function clampDate(date: Date, min: Date, max: Date): Date {
  return new Date(
    Math.min(Math.max(date.getTime(), min.getTime()), max.getTime()),
  );
}

function shortLabel(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

interface ReadingRow {
  timestamp: Date;
  maxTempC: number;
  minTempC: number;
  heatIndexC: number;
}

/** Group readings into 7-day buckets and count days at each alert level. */
function buildAlertDistribution(
  readings: ReadingRow[],
  from: Date,
): AlertBucket[] {
  const byBucket = new Map<number, AlertBucket>();
  for (const reading of readings) {
    const index = Math.floor(
      (reading.timestamp.getTime() - from.getTime()) / WEEK_MS,
    );
    let bucket = byBucket.get(index);
    if (!bucket) {
      const start = new Date(from.getTime() + index * WEEK_MS);
      bucket = {
        bucket: shortLabel(start),
        NORMAL: 0,
        YELLOW: 0,
        ORANGE: 0,
        RED: 0,
      };
      byBucket.set(index, bucket);
    }
    bucket[classifyAlertLevel(reading.heatIndexC)] += 1;
  }
  return [...byBucket.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, bucket]) => bucket);
}

/** Compute summary stats in a single pass over the readings. */
function buildSummary(readings: ReadingRow[]): AnalyticsSummary {
  if (readings.length === 0) {
    return {
      avgHeatIndex: null,
      daysOverElevated: 0,
      totalDays: 0,
      worstDay: null,
    };
  }
  let sum = 0;
  let daysOverElevated = 0;
  let worst = readings[0];
  for (const reading of readings) {
    sum += reading.heatIndexC;
    const level: HeatAlertLevel = classifyAlertLevel(reading.heatIndexC);
    if (level === "ORANGE" || level === "RED") daysOverElevated += 1;
    if (reading.heatIndexC > worst.heatIndexC) worst = reading;
  }
  return {
    avgHeatIndex: round1(sum / readings.length),
    daysOverElevated,
    totalDays: readings.length,
    worstDay: {
      date: worst.timestamp.toISOString(),
      heatIndexC: worst.heatIndexC,
    },
  };
}

/**
 * Aggregate all analytics datasets for a region and date range, server-side.
 *
 * Memoized with React `cache()` so repeated calls within a single render
 * (e.g. metadata + page) share one set of queries. Arguments are primitives so
 * the cache key is stable.
 */
export const getAnalytics = cache(
  async (
    regionId?: string,
    from?: string,
    to?: string,
  ): Promise<AnalyticsData | null> => {
    const [regions, bounds] = await Promise.all([
      prisma.region.findMany({
        orderBy: [{ state: "asc" }, { name: "asc" }],
        select: { id: true, name: true, state: true },
      }),
      prisma.temperatureReading.aggregate({
        _min: { timestamp: true },
        _max: { timestamp: true },
      }),
    ]);

    const min = bounds._min.timestamp;
    const max = bounds._max.timestamp;
    if (regions.length === 0 || !min || !max) return null;

    const rangeFrom = clampDate(parseDate(from) ?? min, min, max);
    const rangeTo = clampDate(parseDate(to) ?? max, min, max);
    const timestamp = { gte: rangeFrom, lte: rangeTo };

    // Peak heat index per region within the range (for the cross-region chart).
    const grouped = await prisma.temperatureReading.groupBy({
      by: ["regionId"],
      where: { timestamp },
      _max: { heatIndexC: true },
    });
    const peakByRegion = new Map(
      grouped.map((g) => [g.regionId, g._max.heatIndexC ?? 0]),
    );
    const crossRegion: CrossRegionPoint[] = regions
      .map((r) => ({
        id: r.id,
        name: r.name,
        state: r.state,
        peakHeatIndex: round1(peakByRegion.get(r.id) ?? 0),
      }))
      .sort((a, b) => b.peakHeatIndex - a.peakHeatIndex);

    // Default to the hottest region when none is selected.
    const selectedRegion =
      (regionId ? regions.find((r) => r.id === regionId) : undefined) ??
      regions.find((r) => r.id === crossRegion[0]?.id) ??
      regions[0];

    const [readings, recovery] = await Promise.all([
      prisma.temperatureReading.findMany({
        where: { regionId: selectedRegion.id, timestamp },
        orderBy: { timestamp: "asc" },
      }),
      prisma.recoveryIndicator.findMany({
        where: { regionId: selectedRegion.id, date: timestamp },
        orderBy: { date: "asc" },
      }),
    ]);

    return {
      regions,
      selectedRegion,
      range: {
        from: rangeFrom.toISOString(),
        to: rangeTo.toISOString(),
        min: min.toISOString(),
        max: max.toISOString(),
      },
      summary: buildSummary(readings),
      trend: readings.map((r) => ({
        date: r.timestamp.toISOString(),
        maxTempC: r.maxTempC,
        minTempC: r.minTempC,
        heatIndexC: r.heatIndexC,
      })),
      alertDistribution: buildAlertDistribution(readings, rangeFrom),
      recovery: recovery.map((r) => ({
        date: r.date.toISOString(),
        hospitalAdmissions: r.hospitalAdmissions,
        workdaysLost: r.workdaysLost,
        cropLossPct: r.cropLossPct,
        waterScarcityIndex: r.waterScarcityIndex,
      })),
      crossRegion,
    };
  },
);
