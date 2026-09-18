import type { HeatAlertLevel } from "@/lib/enums";
import { NotFoundError } from "@/lib/api/http";
import { buildAlertMessage, classifyAlertLevel } from "@/lib/heat/alert-level";
import {
  computeStatusCode,
  type RegionSignal,
  type StatusCodeResult,
} from "@/lib/heat/status-code";

import { prisma } from "./db";
import { getRegionsOverview } from "./regions";
import { toAlertDTO, type AlertDTO } from "./serializers";

export interface AlertWithRegionDTO extends AlertDTO {
  region: { id: string; name: string; state: string };
}

const REGION_INCLUDE = {
  region: { select: { id: true, name: true, state: true } },
} as const;

/** List heat alerts, optionally filtered to only active ones. */
export async function getAlerts(params: {
  active?: boolean;
}): Promise<AlertWithRegionDTO[]> {
  const rows = await prisma.heatAlert.findMany({
    where: params.active === undefined ? {} : { active: params.active },
    orderBy: { issuedAt: "desc" },
    include: REGION_INCLUDE,
  });
  return rows.map((row) => ({ ...toAlertDTO(row), region: row.region }));
}

/** Create (simulate) an active alert for a region from a heat index. */
export async function createAlert(input: {
  regionId: string;
  heatIndexC: number;
}): Promise<AlertWithRegionDTO> {
  const region = await prisma.region.findUnique({
    where: { id: input.regionId },
    select: { name: true },
  });
  if (!region) {
    throw new NotFoundError(`Region '${input.regionId}' was not found.`);
  }

  const level: HeatAlertLevel = classifyAlertLevel(input.heatIndexC);
  const row = await prisma.heatAlert.create({
    data: {
      regionId: input.regionId,
      level,
      heatIndexC: input.heatIndexC,
      message: buildAlertMessage(region.name, level, input.heatIndexC),
      issuedAt: new Date(),
      active: true,
    },
    include: REGION_INCLUDE,
  });
  return { ...toAlertDTO(row), region: row.region };
}

/** Set an alert's active flag (acknowledging an alert sets it to false). */
export async function setAlertActive(
  id: string,
  active: boolean,
): Promise<AlertWithRegionDTO> {
  const existing = await prisma.heatAlert.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new NotFoundError(`Alert '${id}' was not found.`);
  }
  const row = await prisma.heatAlert.update({
    where: { id },
    data: { active },
    include: REGION_INCLUDE,
  });
  return { ...toAlertDTO(row), region: row.region };
}

const STALE_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000;

export interface AlertCenter {
  feed: AlertWithRegionDTO[];
  regions: { id: string; name: string; state: string }[];
  statusCode: StatusCodeResult;
}

/**
 * Everything the alerts page needs: the feed (active first, then recent), the
 * region list for the simulator, and the computed system status code.
 */
export async function getAlertCenter(): Promise<AlertCenter> {
  const [overview, alerts, latestRecovery, bounds] = await Promise.all([
    getRegionsOverview(),
    prisma.heatAlert.findMany({
      orderBy: [{ active: "desc" }, { issuedAt: "desc" }],
      take: 40,
      include: REGION_INCLUDE,
    }),
    prisma.recoveryIndicator.findMany({
      orderBy: { date: "desc" },
      distinct: ["regionId"],
      select: { regionId: true, waterScarcityIndex: true },
    }),
    prisma.temperatureReading.aggregate({ _max: { timestamp: true } }),
  ]);

  const systemLatest = bounds._max.timestamp?.getTime() ?? null;
  const waterByRegion = new Map(
    latestRecovery.map((r) => [r.regionId, r.waterScarcityIndex]),
  );

  const signals: RegionSignal[] = overview.map((region) => {
    const readingTime = region.latestReading
      ? new Date(region.latestReading.timestamp).getTime()
      : null;
    const feedStale =
      readingTime === null ||
      systemLatest === null ||
      systemLatest - readingTime > STALE_THRESHOLD_MS;
    return {
      heatIndexC: region.latestReading?.heatIndexC ?? null,
      feedStale,
      vulnerabilityScore: region.vulnerabilityScore,
      waterScarcityIndex: waterByRegion.get(region.id) ?? null,
    };
  });

  return {
    feed: alerts.map((row) => ({ ...toAlertDTO(row), region: row.region })),
    regions: overview.map((r) => ({ id: r.id, name: r.name, state: r.state })),
    statusCode: computeStatusCode(signals),
  };
}
