import type { HeatAlertLevel } from "@/lib/enums";
import { ALERT_LEVEL_THRESHOLDS_C } from "@/lib/heat/alert-level";

/**
 * Concrete hex colours for the heat scale, used by the WebGL map layers and the
 * legend (MapLibre paint properties cannot read CSS variables). These mirror the
 * `--heat-*` theme tokens used elsewhere (e.g. AlertBadge).
 */
export const HEAT_COLORS: Record<HeatAlertLevel, string> = {
  NORMAL: "#22a06b",
  YELLOW: "#e0a911",
  ORANGE: "#f2751e",
  RED: "#dc2626",
};

/** Cool → hot gradient stops for the heatmap layer / legend (density 0 → 1). */
export const HEATMAP_GRADIENT: Array<[number, string]> = [
  [0, "rgba(43,131,186,0)"],
  [0.15, "#2b83ba"],
  [0.4, "#7fcdbb"],
  [0.6, "#f7f7a0"],
  [0.8, "#fdae61"],
  [1, "#d7191c"],
];

/** Sequential single-hue (purple) ramp for the vulnerability choropleth (0→100). */
export const VULNERABILITY_GRADIENT: Array<[number, string]> = [
  [0, "#e9e2f5"],
  [40, "#b8a6dc"],
  [70, "#7c5cbf"],
  [100, "#4b2e8f"],
];

const { YELLOW, ORANGE, RED } = ALERT_LEVEL_THRESHOLDS_C;

/** Legend rows mapping colour → heat-index range → alert level (cool → hot). */
export const LEGEND_ITEMS: Array<{
  level: HeatAlertLevel;
  label: string;
  range: string;
  color: string;
}> = [
  {
    level: "NORMAL",
    label: "Normal",
    range: `< ${YELLOW}°C`,
    color: HEAT_COLORS.NORMAL,
  },
  {
    level: "YELLOW",
    label: "Yellow",
    range: `${YELLOW}–${ORANGE}°C`,
    color: HEAT_COLORS.YELLOW,
  },
  {
    level: "ORANGE",
    label: "Orange",
    range: `${ORANGE}–${RED}°C`,
    color: HEAT_COLORS.ORANGE,
  },
  { level: "RED", label: "Red", range: `≥ ${RED}°C`, color: HEAT_COLORS.RED },
];
