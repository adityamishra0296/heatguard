/**
 * Row → DTO serializers for the API.
 *
 * DTOs expose ISO date strings (rather than Date objects) so responses are
 * plain JSON. Inputs are typed structurally to stay decoupled from the
 * generated Prisma types.
 */

interface ReadingRow {
  id: string;
  regionId: string;
  timestamp: Date;
  maxTempC: number;
  minTempC: number;
  humidityPct: number;
  heatIndexC: number;
}

export interface ReadingDTO {
  id: string;
  regionId: string;
  timestamp: string;
  maxTempC: number;
  minTempC: number;
  humidityPct: number;
  heatIndexC: number;
}

export function toReadingDTO(row: ReadingRow): ReadingDTO {
  return {
    id: row.id,
    regionId: row.regionId,
    timestamp: row.timestamp.toISOString(),
    maxTempC: row.maxTempC,
    minTempC: row.minTempC,
    humidityPct: row.humidityPct,
    heatIndexC: row.heatIndexC,
  };
}

interface AlertRow {
  id: string;
  regionId: string;
  level: string;
  heatIndexC: number | null;
  issuedAt: Date;
  message: string;
  active: boolean;
}

export interface AlertDTO {
  id: string;
  regionId: string;
  level: string;
  heatIndexC: number | null;
  issuedAt: string;
  message: string;
  active: boolean;
}

export function toAlertDTO(row: AlertRow): AlertDTO {
  return {
    id: row.id,
    regionId: row.regionId,
    level: row.level,
    heatIndexC: row.heatIndexC,
    issuedAt: row.issuedAt.toISOString(),
    message: row.message,
    active: row.active,
  };
}

interface RecoveryRow {
  id: string;
  regionId: string;
  date: Date;
  hospitalAdmissions: number;
  workdaysLost: number;
  cropLossPct: number;
  electricityFailures: number;
  waterScarcityIndex: number;
}

export interface RecoveryDTO {
  id: string;
  regionId: string;
  date: string;
  hospitalAdmissions: number;
  workdaysLost: number;
  cropLossPct: number;
  electricityFailures: number;
  waterScarcityIndex: number;
}

export function toRecoveryDTO(row: RecoveryRow): RecoveryDTO {
  return {
    id: row.id,
    regionId: row.regionId,
    date: row.date.toISOString(),
    hospitalAdmissions: row.hospitalAdmissions,
    workdaysLost: row.workdaysLost,
    cropLossPct: row.cropLossPct,
    electricityFailures: row.electricityFailures,
    waterScarcityIndex: row.waterScarcityIndex,
  };
}

/** Build a Prisma date-range filter, or `undefined` when no bounds are given. */
export function dateRangeFilter(
  from?: Date,
  to?: Date,
): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}
