import type { HeatAlertLevel } from "@/lib/enums";

/**
 * Chart colours. Theme tokens are passed as `var(--…)` strings so charts follow
 * light/dark mode; the categorical state palette uses fixed hex values.
 */

/** Heat-scale colours for alert levels (matches the AlertBadge / map). */
export const HEAT_LEVEL_COLOR: Record<HeatAlertLevel, string> = {
  NORMAL: "var(--color-heat-normal)",
  YELLOW: "var(--color-heat-yellow)",
  ORANGE: "var(--color-heat-orange)",
  RED: "var(--color-heat-red)",
};

/** Series colours for the temperature / heat-index trend. */
export const SERIES_HEAT_INDEX = "var(--color-chart-1)";
export const SERIES_MAX_TEMP = "var(--color-chart-2)";

/** Recessive axis / grid / cursor colours. */
export const AXIS_TICK = "var(--color-muted-foreground)";
export const AXIS_GRID = "var(--color-border)";
export const CURSOR_FILL = "var(--color-muted)";

/**
 * Okabe–Ito colourblind-safe categorical palette, mapped to the six focus
 * states in a fixed order (never cycled).
 */
export const STATE_COLOR: Record<string, string> = {
  Telangana: "#0072b2",
  "Andhra Pradesh": "#e69f00",
  Odisha: "#009e73",
  Rajasthan: "#d55e00",
  Maharashtra: "#56b4e9",
  Delhi: "#cc79a7",
};

export const STATE_FALLBACK_COLOR = "#9ca3af";

export function stateColor(state: string): string {
  return STATE_COLOR[state] ?? STATE_FALLBACK_COLOR;
}
