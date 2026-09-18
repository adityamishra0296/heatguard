/**
 * Types for the auto-generated final report.
 *
 * `ReportModel` is the fully-typed, serialisable snapshot of live app data that
 * drives the data chapters. `ReportOptions` carries the user-editable parts
 * (recommendations and an optional executive-summary override) that travel from
 * the console to the print route and the PDF generator.
 */

import type { HeatAlertLevel } from "@/lib/enums";
import type { StatusCodeResult } from "@/lib/heat/status-code";

export interface ReportMeta {
  title: string;
  subtitle: string;
  organisation: string;
  /** ISO timestamp the report was generated. */
  generatedAt: string;
  focusStates: string[];
  /** Latest telemetry timestamp the figures reflect (ISO), or null. */
  dataAsOf: string | null;
}

export interface StateProfile {
  state: string;
  regionCount: number;
  population: number;
}

export interface DistrictTypeCount {
  type: string;
  count: number;
}

export interface RegionRow {
  name: string;
  state: string;
  districtType: string;
  population: number;
  latitude: number;
  longitude: number;
  level: HeatAlertLevel;
  heatIndexC: number | null;
  vulnerabilityScore: number | null;
}

export interface StudyAreaData {
  regionCount: number;
  stateCount: number;
  totalPopulation: number;
  states: StateProfile[];
  districtTypes: DistrictTypeCount[];
  regions: RegionRow[];
}

export interface LevelCount {
  level: HeatAlertLevel;
  count: number;
}

export interface WorstHitRegion {
  name: string;
  state: string;
  heatIndexC: number;
  level: HeatAlertLevel;
}

export interface ResponseData {
  statusCode: StatusCodeResult | null;
  /** All four levels, always present (zero when absent). */
  levelCounts: LevelCount[];
  activeAlertCount: number;
  avgHeatIndexC: number | null;
  worstHit: WorstHitRegion[];
}

export interface RecoveryTotals {
  hospitalAdmissions: number;
  workdaysLost: number;
  electricityFailures: number;
  avgCropLossPct: number;
  avgWaterScarcityIndex: number;
}

export interface RecoveryRegionImpact {
  name: string;
  state: string;
  hospitalAdmissions: number;
  workdaysLost: number;
}

export interface RecoverySeriesPoint {
  date: string;
  hospitalAdmissions: number;
  workdaysLost: number;
}

export interface RecoveryData {
  available: boolean;
  totals: RecoveryTotals;
  worstByAdmissions: RecoveryRegionImpact[];
  series: RecoverySeriesPoint[];
}

export interface VulnerabilityTopRegion {
  name: string;
  state: string;
  score: number;
  band: string;
}

export interface AtRiskRow {
  name: string;
  state: string;
  score: number;
  currentLevel: HeatAlertLevel;
  predictedLevel: HeatAlertLevel | null;
}

export interface VulnerabilityData {
  available: boolean;
  top: VulnerabilityTopRegion[];
  atRisk: AtRiskRow[];
  weights: { label: string; weight: number }[];
}

export interface PredictedRow {
  name: string;
  state: string;
  peakHeatIndexC: number;
  peakLevel: HeatAlertLevel;
  daysElevated: number;
}

export interface PredictionData {
  available: boolean;
  top: PredictedRow[];
}

/** The complete, serialisable snapshot the report renders from. */
export interface ReportModel {
  meta: ReportMeta;
  studyArea: StudyAreaData;
  response: ResponseData;
  recovery: RecoveryData;
  vulnerability: VulnerabilityData;
  prediction: PredictionData;
}

/** One editable recommendation in chapter 9. */
export interface ReportRecommendation {
  id: string;
  title: string;
  detail: string;
}

/** User-editable report inputs, encoded into the print URL. */
export interface ReportOptions {
  recommendations: ReportRecommendation[];
  /** Optional override for the executive-summary paragraph. */
  execSummary?: string;
}

export type ChapterKind = "narrative" | "data";

/** A report chapter: narrative template text plus its kind and ordinal. */
export interface ReportChapter {
  id: number;
  key: string;
  title: string;
  kind: ChapterKind;
  paragraphs: string[];
}
