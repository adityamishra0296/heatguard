/**
 * Composite heat & health-risk score.
 *
 * Pure domain logic: combines the current heat hazard (heat index) with a
 * region's vulnerability into a single 0–100 risk score.
 */

/** Constrain a value to [0, 1], treating non-finite input as 0. */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Round to a single decimal place. */
function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Heat-index range mapped onto the 0–1 hazard axis: onset of "Caution"
 * (~27°C) up to "Extreme danger" (~54°C).
 */
const HAZARD_MIN_C = 27;
const HAZARD_MAX_C = 54;

/**
 * Compute a 0–100 heat & health-risk score.
 *
 * Heat is the primary driver: the heat index is normalised to a 0–1 hazard,
 * then modulated by vulnerability, which amplifies the hazard from 50% (no
 * vulnerability) to 100% (maximum vulnerability). Consequently risk is 0 when
 * there is no heat hazard, and reaches 100 only under extreme heat and maximum
 * vulnerability.
 *
 * @param heatIndexC - Heat index in degrees Celsius.
 * @param vulnerabilityScore - Vulnerability index in [0, 100].
 * @returns A health-risk score in [0, 100], rounded to one decimal place.
 */
export function computeHealthRiskScore(
  heatIndexC: number,
  vulnerabilityScore: number,
): number {
  const hazard = clamp01(
    (heatIndexC - HAZARD_MIN_C) / (HAZARD_MAX_C - HAZARD_MIN_C),
  );
  const vulnerability = clamp01(vulnerabilityScore / 100);

  const risk = hazard * (0.5 + 0.5 * vulnerability);
  return roundToTenth(Math.min(100, Math.max(0, risk * 100)));
}
