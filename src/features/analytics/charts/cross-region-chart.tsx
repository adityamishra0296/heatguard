"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CrossRegionPoint } from "@/server/analytics";

import { AXIS_GRID, AXIS_TICK, CURSOR_FILL, stateColor } from "../chart-theme";
import { ChartTooltip } from "../chart-tooltip";

/** Horizontal bars ranking regions by peak heat index, coloured by state; the
 *  selected region is outlined. A legend of the states present sits below. */
export function CrossRegionChart({
  data,
  selectedId,
}: {
  data: CrossRegionPoint[];
  selectedId: string;
}) {
  const statesPresent = [...new Set(data.map((d) => d.state))];

  return (
    <div>
      <ResponsiveContainer
        width="100%"
        height={Math.max(240, data.length * 26)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke={AXIS_GRID}
            strokeDasharray="3 3"
          />
          <XAxis
            type="number"
            domain={[0, "dataMax + 4"]}
            tick={{ fill: AXIS_TICK, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            unit="°"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            tick={{ fill: AXIS_TICK, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: CURSOR_FILL, fillOpacity: 0.3 }}
            content={<ChartTooltip unit="°C" />}
          />
          <Bar
            dataKey="peakHeatIndex"
            name="Peak heat index"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.id}
                fill={stateColor(entry.state)}
                stroke={
                  entry.id === selectedId
                    ? "var(--color-foreground)"
                    : "transparent"
                }
                strokeWidth={entry.id === selectedId ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {statesPresent.map((state) => (
          <li
            key={state}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: stateColor(state) }}
              aria-hidden
            />
            {state}
          </li>
        ))}
      </ul>
    </div>
  );
}
