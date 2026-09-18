/**
 * Server-rendered inline-SVG figures for the report.
 *
 * These are pure, hook-free components that render deterministically on the
 * server (and in the console preview) with no client JavaScript, so they appear
 * correctly in the print view and the generated PDF. Colours are concrete hex
 * values (mirroring the app's heat scale and vulnerability ramp) because printed
 * output cannot resolve CSS variables.
 */

import type { HeatAlertLevel } from "@/lib/enums";

import { niceMax, projectPoints, scaleLinear } from "./scale";
import type { RegionRow } from "./types";

/** Heat-scale colours, mirroring the map legend (`HEAT_COLORS`). */
export const LEVEL_COLORS: Record<HeatAlertLevel, string> = {
  NORMAL: "#22a06b",
  YELLOW: "#e0a911",
  ORANGE: "#f2751e",
  RED: "#dc2626",
};

const INK = "#0f172a";
const LABEL = "#334155";
const MUTED = "#64748b";
const GRID = "#e2e8f0";
const PANEL = "#f8fafc";

export interface BarDatum {
  label: string;
  value: number;
  color: string;
}

/** Horizontal bar chart. Bars anchor to a baseline; values are direct-labelled. */
export function BarChartSVG({
  data,
  ariaLabel,
  width = 680,
  barHeight = 22,
  gap = 12,
  labelWidth = 168,
  format = (v: number) => String(Math.round(v)),
}: {
  data: BarDatum[];
  ariaLabel: string;
  width?: number;
  barHeight?: number;
  gap?: number;
  labelWidth?: number;
  format?: (value: number) => string;
}) {
  const padTop = 8;
  const padBottom = 8;
  const valueColWidth = 56;
  const barArea = width - labelWidth - valueColWidth;
  const height =
    padTop + padBottom + data.length * barHeight + (data.length - 1) * gap;
  const domainMax = niceMax(Math.max(0, ...data.map((d) => d.value)));

  return (
    <svg
      viewBox={`0 0 ${width} ${Math.max(height, barHeight + padTop + padBottom)}`}
      role="img"
      aria-label={ariaLabel}
      style={{ width: "100%", height: "auto" }}
    >
      {/* baseline */}
      <line
        x1={labelWidth}
        y1={padTop}
        x2={labelWidth}
        y2={height - padBottom}
        stroke={GRID}
        strokeWidth={1}
      />
      {data.map((d, i) => {
        const y = padTop + i * (barHeight + gap);
        const w = Math.max(1, scaleLinear(d.value, domainMax, barArea));
        return (
          <g key={`${d.label}-${i}`}>
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={12}
              fill={LABEL}
            >
              {d.label}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={w}
              height={barHeight}
              rx={4}
              fill={d.color}
            />
            <text
              x={labelWidth + w + 6}
              y={y + barHeight / 2}
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
              fill={INK}
            >
              {format(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Interpolate the vulnerability ramp (purple, 0→100) for a score. */
function vulnerabilityColor(score: number): string {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [233, 226, 245]],
    [40, [184, 166, 220]],
    [70, [124, 92, 191]],
    [100, [75, 46, 143]],
  ];
  const s = Math.max(0, Math.min(100, score));
  for (let i = 1; i < stops.length; i += 1) {
    const [x0, c0] = stops[i - 1];
    const [x1, c1] = stops[i];
    if (s <= x1) {
      const t = x1 === x0 ? 0 : (s - x0) / (x1 - x0);
      const rgb = c0.map((c, k) => Math.round(c + (c1[k] - c) * t));
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
  }
  return "rgb(75, 46, 143)";
}

/**
 * Schematic map snapshot: monitored districts projected by latitude/longitude
 * into a panel, sized by population and coloured either by current alert level
 * or by vulnerability score. A lightweight, print-friendly stand-in for the
 * interactive WebGL map.
 */
export function RegionMapSVG({
  regions,
  colorBy,
  ariaLabel,
  width = 680,
  height = 420,
}: {
  regions: RegionRow[];
  colorBy: "level" | "vulnerability";
  ariaLabel: string;
  width?: number;
  height?: number;
}) {
  const padding = 44;
  const points = projectPoints(regions, width, height, padding);
  const maxPop = Math.max(1, ...regions.map((r) => r.population));

  const colorFor = (r: RegionRow): string =>
    colorBy === "level"
      ? LEVEL_COLORS[r.level]
      : vulnerabilityColor(r.vulnerabilityScore ?? 0);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ width: "100%", height: "auto" }}
    >
      <rect
        x={0.5}
        y={0.5}
        width={width - 1}
        height={height - 1}
        rx={8}
        fill={PANEL}
        stroke={GRID}
      />
      {/* faint reference grid */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={`v${f}`}
          x1={width * f}
          y1={padding / 2}
          x2={width * f}
          y2={height - padding / 2}
          stroke={GRID}
          strokeWidth={1}
        />
      ))}
      {[0.33, 0.66].map((f) => (
        <line
          key={`h${f}`}
          x1={padding / 2}
          y1={height * f}
          x2={width - padding / 2}
          y2={height * f}
          stroke={GRID}
          strokeWidth={1}
        />
      ))}

      {regions.map((r, i) => {
        const p = points[i];
        const radius = Math.max(
          5,
          Math.min(18, Math.sqrt(r.population / maxPop) * 18),
        );
        return (
          <g key={`${r.name}-${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={radius}
              fill={colorFor(r)}
              fillOpacity={0.82}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <text
              x={p.x}
              y={p.y - radius - 3}
              textAnchor="middle"
              fontSize={9.5}
              fill={MUTED}
            >
              {r.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
