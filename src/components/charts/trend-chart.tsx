/**
 * Compact multi-series line chart (SSR, no client JS).
 *
 * All series share one axis and one unit — heat index and max temperature are
 * both °C, so this is not a dual-axis chart. Identity is carried by a legend and
 * coloured end-markers with the value in ink (never colour-alone). Colours come
 * from the theme's chart tokens.
 */

export interface TrendSeries {
  /** Human-readable series name (used in the legend). */
  label: string;
  /** A CSS colour, typically a theme token such as `var(--color-chart-1)`. */
  color: string;
  /** Y-values in chronological order. */
  values: number[];
  /** Whether this is the primary series (gets an area fill). */
  primary?: boolean;
}

interface TrendChartProps {
  series: TrendSeries[];
  /** Accessible summary of the chart for screen readers. */
  ariaLabel: string;
  unit?: string;
}

const WIDTH = 640;
const HEIGHT = 160;
const PAD = { top: 14, right: 16, bottom: 14, left: 10 };

const round1 = (value: number): number => Math.round(value * 10) / 10;

export function TrendChart({ series, ariaLabel, unit = "" }: TrendChartProps) {
  const allValues = series.flatMap((s) => s.values);
  const hasData = allValues.length > 0;

  const rawMin = hasData ? Math.min(...allValues) : 0;
  const rawMax = hasData ? Math.max(...allValues) : 1;
  const span = rawMax - rawMin || 1;
  const yMin = rawMin - span * 0.08;
  const yMax = rawMax + span * 0.08;

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + innerH;

  const xAt = (index: number, count: number): number =>
    PAD.left + (count <= 1 ? 0 : (index / (count - 1)) * innerW);
  const yAt = (value: number): number =>
    PAD.top + innerH * (1 - (value - yMin) / (yMax - yMin));

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="none"
      >
        {series.map((s) => {
          const count = s.values.length;
          const points = s.values.map((v, i) => `${xAt(i, count)},${yAt(v)}`);
          const last = s.values[count - 1];
          return (
            <g key={s.label}>
              {s.primary ? (
                <polygon
                  points={`${PAD.left},${baseline} ${points.join(" ")} ${xAt(count - 1, count)},${baseline}`}
                  style={{ fill: s.color, fillOpacity: 0.12 }}
                />
              ) : null}
              <polyline
                points={points.join(" ")}
                fill="none"
                style={{ stroke: s.color }}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {count > 0 ? (
                <circle
                  cx={xAt(count - 1, count)}
                  cy={yAt(last)}
                  r={3}
                  style={{ fill: s.color }}
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {series.map((s) => {
          const latest = s.values.at(-1);
          return (
            <span
              key={s.label}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              {s.label}
              {latest !== undefined ? (
                <span className="font-medium text-foreground">
                  {round1(latest)}
                  {unit}
                </span>
              ) : null}
            </span>
          );
        })}
      </figcaption>
    </figure>
  );
}
