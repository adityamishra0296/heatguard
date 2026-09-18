/**
 * HeatGuard heat & risk domain utilities.
 *
 * All heat-index and risk logic lives here as pure, unit-tested functions.
 */
export {
  celsiusToFahrenheit,
  computeHeatIndex,
  fahrenheitToCelsius,
} from "./heat-index";
export { ALERT_LEVEL_THRESHOLDS_C, classifyAlertLevel } from "./alert-level";
export {
  computeVulnerabilityScore,
  computeVulnerabilityBreakdown,
  vulnerabilityBand,
  VULNERABILITY_WEIGHTS,
  type VulnerabilityRegionInput,
  type VulnerablePopulationInput,
  type VulnerabilityBand,
  type VulnerabilityBreakdown,
  type VulnerabilityFactor,
} from "./vulnerability";
export { computeHealthRiskScore } from "./health-risk";
export {
  rankAtRisk,
  HIGH_VULNERABILITY_THRESHOLD,
  type AtRiskInput,
  type AtRiskRegion,
} from "./at-risk";
