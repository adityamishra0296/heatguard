/**
 * HeatGuard database seed.
 *
 * Generates realistic, deterministic sample data so the app runs fully offline:
 *   - 12 regions across the 6 focus states (2 each, varied district types)
 *   - 60 days of daily temperature readings per region, with clustered
 *     heat-wave episodes (hotter and more volatile for Rajasthan, Telangana,
 *     Odisha)
 *   - heat indices computed via the shared computeHeatIndex() utility
 *   - alerts derived from heat-index thresholds (one per heat-wave episode)
 *   - a vulnerability snapshot, weekly recovery indicators, and survey
 *     responses per region
 *
 * Temperature and humidity are kept physically consistent (dry heat at high
 * temperatures, humidity only at moderate temperatures) so the NOAA heat index
 * stays in a realistic range. The data is deterministic (fixed PRNG seed) and
 * the script is idempotent (existing rows are cleared first).
 *
 * Run with: `npm run db:seed`.
 */
import "dotenv/config";

import {
  type DistrictType,
  type FocusState,
  type HeatAlertLevel,
} from "../src/lib/enums";
import {
  buildAlertMessage,
  classifyAlertLevel,
} from "../src/lib/heat/alert-level";
import { computeHeatIndex } from "../src/lib/heat/heat-index";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) and helpers
// ---------------------------------------------------------------------------

/** Create a seeded pseudo-random generator returning floats in [0, 1). */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20260721);

/** Uniform float in [min, max). */
function uniform(min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Uniform integer in [min, max] inclusive. */
function integer(min: number, max: number): number {
  return Math.floor(uniform(min, max + 1));
}

/** Boolean that is true with the given probability. */
function chance(probability: number): boolean {
  return rng() < probability;
}

/** Round to one decimal place. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Constrain a value to the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------------------
// Window and thresholds
// ---------------------------------------------------------------------------

const DAYS = 60;
const WEEKS = Math.floor(DAYS / 7); // 8 full weeks
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Peak-summer window (May–June 2026), just before monsoon onset.
const WINDOW_END = new Date("2026-06-30T00:00:00.000Z");
const WINDOW_START = new Date(WINDOW_END.getTime() - (DAYS - 1) * MS_PER_DAY);

/** States modelled as hotter and more volatile. */
const HOT_STATES = new Set<FocusState>(["Rajasthan", "Telangana", "Odisha"]);

/**
 * Physically plausible upper bound on relative humidity for a given air
 * temperature, keeping the implied dew point realistic (you cannot have 50°C
 * air at 70% RH). Prevents the NOAA regression from being evaluated on
 * impossible hot-and-humid combinations.
 */
function maxHumidityAtTemp(tempC: number): number {
  if (tempC <= 34) return 92;
  if (tempC <= 37) return 78;
  if (tempC <= 40) return 58;
  if (tempC <= 43) return 40;
  if (tempC <= 46) return 28;
  return 20;
}

// ---------------------------------------------------------------------------
// Region definitions
// ---------------------------------------------------------------------------

interface ClimateProfile {
  /** Typical peak-season daily maximum (°C) before episodes/noise. */
  baseMaxC: number;
  /** Realistic ceiling on the daily maximum (°C) for this region. */
  maxTempCeilingC: number;
  /** Day-to-day volatility (°C). */
  volatility: number;
  /** Baseline relative humidity (%). */
  humidityBase: number;
  /** Spread of the relative humidity (± %). */
  humiditySpread: number;
  /** Typical diurnal range (max − min, °C). */
  diurnalRange: number;
  /** Number of heat-wave episodes across the window. */
  episodes: number;
  /** Peak added heat during an episode (°C). */
  episodePeakC: number;
}

interface RegionSeed {
  name: string;
  state: FocusState;
  districtType: DistrictType;
  latitude: number;
  longitude: number;
  population: number;
  climate: ClimateProfile;
}

/**
 * Deterministic, URL-safe region id derived from its name + state.
 *
 * Using a stable slug instead of a random `cuid()` means re-seeding always
 * produces the same ids, so trained ML models, bookmarked `/regions/:id` URLs,
 * and any cached references stay valid across seeds.
 */
function regionId(name: string, state: string): string {
  return `${name}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const REGIONS: RegionSeed[] = [
  // Telangana
  {
    name: "Hyderabad",
    state: "Telangana",
    districtType: "Urban",
    latitude: 17.385,
    longitude: 78.4867,
    population: 10_500_000,
    climate: {
      baseMaxC: 39,
      maxTempCeilingC: 46,
      volatility: 3,
      humidityBase: 38,
      humiditySpread: 12,
      diurnalRange: 11,
      episodes: 3,
      episodePeakC: 6,
    },
  },
  {
    name: "Ramagundam",
    state: "Telangana",
    districtType: "Industrial",
    latitude: 18.755,
    longitude: 79.474,
    population: 240_000,
    climate: {
      baseMaxC: 42,
      maxTempCeilingC: 49,
      volatility: 3.2,
      humidityBase: 28,
      humiditySpread: 10,
      diurnalRange: 12,
      episodes: 3,
      episodePeakC: 7,
    },
  },
  // Andhra Pradesh
  {
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    districtType: "Urban",
    latitude: 17.6868,
    longitude: 83.2185,
    population: 2_100_000,
    climate: {
      baseMaxC: 35,
      maxTempCeilingC: 42,
      volatility: 2,
      humidityBase: 72,
      humiditySpread: 10,
      diurnalRange: 8,
      episodes: 2,
      episodePeakC: 4,
    },
  },
  {
    name: "Kurnool",
    state: "Andhra Pradesh",
    districtType: "Municipal",
    latitude: 15.8281,
    longitude: 78.0373,
    population: 460_000,
    climate: {
      baseMaxC: 40,
      maxTempCeilingC: 47,
      volatility: 3,
      humidityBase: 30,
      humiditySpread: 10,
      diurnalRange: 12,
      episodes: 2,
      episodePeakC: 6,
    },
  },
  // Odisha
  {
    name: "Bhubaneswar",
    state: "Odisha",
    districtType: "Urban",
    latitude: 20.2961,
    longitude: 85.8245,
    population: 880_000,
    climate: {
      baseMaxC: 39,
      maxTempCeilingC: 44,
      volatility: 3,
      humidityBase: 58,
      humiditySpread: 12,
      diurnalRange: 9,
      episodes: 3,
      episodePeakC: 5,
    },
  },
  {
    name: "Titlagarh",
    state: "Odisha",
    districtType: "Rural",
    latitude: 20.29,
    longitude: 83.15,
    population: 35_000,
    climate: {
      baseMaxC: 43,
      maxTempCeilingC: 50,
      volatility: 3.5,
      humidityBase: 26,
      humiditySpread: 10,
      diurnalRange: 14,
      episodes: 3,
      episodePeakC: 7,
    },
  },
  // Rajasthan
  {
    name: "Jaipur",
    state: "Rajasthan",
    districtType: "Urban",
    latitude: 26.9124,
    longitude: 75.7873,
    population: 3_100_000,
    climate: {
      baseMaxC: 41,
      maxTempCeilingC: 48,
      volatility: 3.2,
      humidityBase: 24,
      humiditySpread: 10,
      diurnalRange: 13,
      episodes: 3,
      episodePeakC: 6,
    },
  },
  {
    name: "Churu",
    state: "Rajasthan",
    districtType: "Rural",
    latitude: 28.3,
    longitude: 74.9667,
    population: 120_000,
    climate: {
      baseMaxC: 43,
      maxTempCeilingC: 51,
      volatility: 3.8,
      humidityBase: 18,
      humiditySpread: 8,
      diurnalRange: 15,
      episodes: 3,
      episodePeakC: 8,
    },
  },
  // Maharashtra
  {
    name: "Mumbai",
    state: "Maharashtra",
    districtType: "Urban",
    latitude: 19.076,
    longitude: 72.8777,
    population: 12_400_000,
    climate: {
      baseMaxC: 34,
      maxTempCeilingC: 41,
      volatility: 1.8,
      humidityBase: 74,
      humiditySpread: 8,
      diurnalRange: 7,
      episodes: 2,
      episodePeakC: 4,
    },
  },
  {
    name: "Nagpur",
    state: "Maharashtra",
    districtType: "Industrial",
    latitude: 21.1458,
    longitude: 79.0882,
    population: 2_450_000,
    climate: {
      baseMaxC: 42,
      maxTempCeilingC: 49,
      volatility: 3.2,
      humidityBase: 28,
      humiditySpread: 10,
      diurnalRange: 12,
      episodes: 3,
      episodePeakC: 7,
    },
  },
  // Delhi
  {
    name: "New Delhi",
    state: "Delhi",
    districtType: "Urban",
    latitude: 28.6139,
    longitude: 77.209,
    population: 3_200_000,
    climate: {
      baseMaxC: 40,
      maxTempCeilingC: 48,
      volatility: 3.2,
      humidityBase: 32,
      humiditySpread: 12,
      diurnalRange: 12,
      episodes: 3,
      episodePeakC: 6,
    },
  },
  {
    name: "Narela",
    state: "Delhi",
    districtType: "Industrial",
    latitude: 28.853,
    longitude: 77.091,
    population: 220_000,
    climate: {
      baseMaxC: 41,
      maxTempCeilingC: 49,
      volatility: 3.4,
      humidityBase: 30,
      humiditySpread: 12,
      diurnalRange: 13,
      episodes: 3,
      episodePeakC: 6,
    },
  },
];

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

interface ReadingInput {
  timestamp: Date;
  maxTempC: number;
  minTempC: number;
  humidityPct: number;
  heatIndexC: number;
}

interface AlertInput {
  level: HeatAlertLevel;
  heatIndexC: number;
  issuedAt: Date;
  message: string;
  active: boolean;
}

interface VulnerabilityInput {
  elderlyCount: number;
  outdoorWorkersCount: number;
  childrenCount: number;
  hasCoolingAccessPct: number;
  hasWaterAccessPct: number;
}

interface RecoveryInput {
  date: Date;
  hospitalAdmissions: number;
  workdaysLost: number;
  cropLossPct: number;
  electricityFailures: number;
  waterScarcityIndex: number;
}

interface SurveyInput {
  submittedAt: Date;
  awarenessLevel: number;
  hasHeatPlan: boolean;
  accessToShade: boolean;
  accessToDrinkingWater: boolean;
  notes: string;
}

interface Episode {
  start: number;
  length: number;
  peakC: number;
}

/** Generate 60 days of physically consistent daily temperature readings. */
function generateReadings(region: RegionSeed): ReadingInput[] {
  const c = region.climate;

  const episodes: Episode[] = [];
  for (let e = 0; e < c.episodes; e++) {
    episodes.push({
      start: integer(3, DAYS - 9),
      length: integer(3, 6),
      peakC: c.episodePeakC,
    });
  }
  // Hot states end the window in an active heat-wave (so alerts stay live).
  if (HOT_STATES.has(region.state)) {
    const length = integer(4, 6);
    episodes.push({ start: DAYS - length, length, peakC: c.episodePeakC });
  }

  const readings: ReadingInput[] = [];
  for (let d = 0; d < DAYS; d++) {
    const timestamp = new Date(WINDOW_START.getTime() + d * MS_PER_DAY);

    // Gentle seasonal curve peaking mid-window (±1.5°C).
    const seasonal = 1.5 * Math.sin((Math.PI * d) / (DAYS - 1));

    // Bell-shaped boost across any active episode day.
    let episodeBoost = 0;
    for (const ep of episodes) {
      if (d >= ep.start && d < ep.start + ep.length) {
        const phase = ep.length > 1 ? (d - ep.start) / (ep.length - 1) : 0.5;
        episodeBoost = Math.max(
          episodeBoost,
          ep.peakC * Math.sin(Math.PI * phase),
        );
      }
    }

    const noise = uniform(-c.volatility, c.volatility);
    const maxTempC = round1(
      clamp(
        c.baseMaxC + seasonal + episodeBoost + noise,
        26,
        c.maxTempCeilingC,
      ),
    );

    // Humidity is bounded by what is physically possible at this temperature,
    // so hot days are dry and humid days are moderate.
    const humidityPct = round1(
      clamp(
        Math.min(
          c.humidityBase + uniform(-c.humiditySpread, c.humiditySpread),
          maxHumidityAtTemp(maxTempC),
        ),
        8,
        96,
      ),
    );

    const minTempC = round1(
      clamp(maxTempC - c.diurnalRange - uniform(-1.5, 1.5), 16, maxTempC - 4),
    );

    readings.push({
      timestamp,
      maxTempC,
      minTempC,
      humidityPct,
      heatIndexC: computeHeatIndex(maxTempC, humidityPct),
    });
  }
  return readings;
}

/** Trailing-average window (days) used to smooth day-to-day noise for alerts. */
const ALERT_SMOOTHING_DAYS = 3;

/**
 * Derive alerts from heat-index thresholds. To mirror how warnings track
 * sustained conditions (rather than single-day spikes), the level is decided on
 * a trailing 5-day average of the heat index. A new bulletin is issued whenever
 * that level changes to a different non-normal tier — escalations and
 * de-escalations alike. Only the most recent bulletin, reflecting the current
 * standing level, is marked active.
 */
function deriveAlerts(
  region: RegionSeed,
  readings: ReadingInput[],
): AlertInput[] {
  const smoothed: number[] = [];
  for (let index = 0; index < readings.length; index++) {
    const start = Math.max(0, index - (ALERT_SMOOTHING_DAYS - 1));
    const slice = readings.slice(start, index + 1);
    smoothed.push(
      slice.reduce((sum, r) => sum + r.heatIndexC, 0) / slice.length,
    );
  }

  const alerts: AlertInput[] = [];
  let previousLevel: HeatAlertLevel = "NORMAL";

  smoothed.forEach((heatIndexC, index) => {
    const level = classifyAlertLevel(heatIndexC);
    if (level !== previousLevel && level !== "NORMAL") {
      alerts.push({
        level,
        heatIndexC: round1(heatIndexC),
        issuedAt: readings[index].timestamp,
        message: buildAlertMessage(region.name, level, heatIndexC),
        active: false,
      });
    }
    previousLevel = level;
  });

  // The latest bulletin reflects the current standing level.
  if (alerts.length > 0) {
    alerts[alerts.length - 1].active = true;
  }
  return alerts;
}

/** A one-off vulnerability snapshot for a region. */
function generateVulnerability(region: RegionSeed): VulnerabilityInput {
  const pop = region.population;
  const elderlyCount = Math.round(pop * uniform(0.07, 0.11));
  const childrenCount = Math.round(pop * uniform(0.2, 0.28));
  const workingAge = Math.max(0, pop - elderlyCount - childrenCount);

  const outdoorShare =
    region.districtType === "Rural"
      ? uniform(0.4, 0.55)
      : region.districtType === "Industrial"
        ? uniform(0.35, 0.5)
        : region.districtType === "Municipal"
          ? uniform(0.25, 0.4)
          : uniform(0.15, 0.3);

  const isUrban = region.districtType === "Urban";
  const isRural = region.districtType === "Rural";

  return {
    elderlyCount,
    childrenCount,
    outdoorWorkersCount: Math.round(workingAge * outdoorShare),
    hasCoolingAccessPct: round1(
      isUrban ? uniform(55, 82) : isRural ? uniform(15, 38) : uniform(35, 60),
    ),
    hasWaterAccessPct: round1(
      isUrban ? uniform(72, 95) : isRural ? uniform(42, 72) : uniform(58, 85),
    ),
  };
}

/** Weekly recovery indicators, scaled to that week's heat severity. */
function generateRecovery(
  region: RegionSeed,
  readings: ReadingInput[],
): RecoveryInput[] {
  const isArid = region.climate.humidityBase < 30;
  const isAgrarian =
    region.districtType === "Rural" || region.districtType === "Industrial";
  const isUrban =
    region.districtType === "Urban" || region.districtType === "Municipal";
  const popFactor = region.population / 100_000;

  const indicators: RecoveryInput[] = [];
  for (let w = 0; w < WEEKS; w++) {
    const slice = readings.slice(w * 7, w * 7 + 7);
    if (slice.length === 0) continue;

    const avgHeatIndex =
      slice.reduce((sum, r) => sum + r.heatIndexC, 0) / slice.length;
    // 0 at 32°C (onset) → 1 at 50°C (extreme).
    const severity = clamp((avgHeatIndex - 32) / 18, 0, 1);

    indicators.push({
      date: slice[slice.length - 1].timestamp,
      hospitalAdmissions: Math.max(
        0,
        Math.round(popFactor * (0.5 + severity * 5) * uniform(0.7, 1.3)),
      ),
      workdaysLost: Math.max(
        0,
        Math.round(popFactor * (10 + severity * 180) * uniform(0.7, 1.3)),
      ),
      cropLossPct: Math.max(
        0,
        round1(severity * (isAgrarian ? 28 : 10) * uniform(0.6, 1.1)),
      ),
      electricityFailures: Math.max(
        0,
        Math.round(
          (isUrban ? popFactor * 0.15 : popFactor * 0.06) *
            (1 + severity * 5) *
            uniform(0.6, 1.3),
        ),
      ),
      waterScarcityIndex: round1(
        clamp((isArid ? 45 : 22) + severity * 40 * uniform(0.7, 1.2), 0, 100),
      ),
    });
  }
  return indicators;
}

const SURVEY_NOTES = [
  "Requested more public cooling shelters near the main market.",
  "Elderly residents struggle during the afternoon peak.",
  "Water tankers arrive irregularly in the outer wards.",
  "An awareness camp was held at the community centre last week.",
  "Outdoor labourers need shaded rest areas and drinking water points.",
  "School timings were shifted earlier during the heat wave.",
  "Frequent power cuts made fans and coolers unusable at midday.",
  "Households report higher electricity bills from continuous cooling.",
];

/** A handful of community survey responses for a region. */
function generateSurveys(region: RegionSeed): SurveyInput[] {
  const isUrban =
    region.districtType === "Urban" || region.districtType === "Municipal";
  const count = integer(3, 6);

  const surveys: SurveyInput[] = [];
  for (let i = 0; i < count; i++) {
    const submittedAt = new Date(
      WINDOW_START.getTime() + integer(0, DAYS - 1) * MS_PER_DAY,
    );
    surveys.push({
      submittedAt,
      awarenessLevel: isUrban ? integer(3, 5) : integer(2, 4),
      hasHeatPlan: chance(isUrban ? 0.6 : 0.3),
      accessToShade: chance(isUrban ? 0.7 : 0.5),
      accessToDrinkingWater: chance(isUrban ? 0.85 : 0.55),
      notes: SURVEY_NOTES[integer(0, SURVEY_NOTES.length - 1)],
    });
  }
  return surveys;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Idempotent: clear existing rows (children first, then regions).
  await prisma.surveyResponse.deleteMany();
  await prisma.recoveryIndicator.deleteMany();
  await prisma.heatAlert.deleteMany();
  await prisma.vulnerablePopulation.deleteMany();
  await prisma.temperatureReading.deleteMany();
  await prisma.region.deleteMany();

  let readingCount = 0;
  let alertCount = 0;
  let recoveryCount = 0;
  let surveyCount = 0;

  for (const region of REGIONS) {
    const readings = generateReadings(region);
    const alerts = deriveAlerts(region, readings);
    const vulnerability = generateVulnerability(region);
    const recovery = generateRecovery(region, readings);
    const surveys = generateSurveys(region);

    await prisma.region.create({
      data: {
        id: regionId(region.name, region.state),
        name: region.name,
        state: region.state,
        districtType: region.districtType,
        latitude: region.latitude,
        longitude: region.longitude,
        population: region.population,
        temperatureReadings: { create: readings },
        heatAlerts: { create: alerts },
        vulnerablePopulation: { create: vulnerability },
        recoveryIndicators: { create: recovery },
        surveyResponses: { create: surveys },
      },
    });

    readingCount += readings.length;
    alertCount += alerts.length;
    recoveryCount += recovery.length;
    surveyCount += surveys.length;
  }

  console.info("[seed] Seeded HeatGuard development database:");
  console.info(`[seed]   Regions:              ${REGIONS.length}`);
  console.info(`[seed]   TemperatureReadings:  ${readingCount}`);
  console.info(`[seed]   HeatAlerts:           ${alertCount}`);
  console.info(`[seed]   VulnerablePopulation: ${REGIONS.length}`);
  console.info(`[seed]   RecoveryIndicators:   ${recoveryCount}`);
  console.info(`[seed]   SurveyResponses:      ${surveyCount}`);
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
