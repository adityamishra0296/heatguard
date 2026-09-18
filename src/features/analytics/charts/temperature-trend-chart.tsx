"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDayMonth } from "@/lib/format";
import type { TrendPoint } from "@/server/analytics";

import {
  AXIS_GRID,
  AXIS_TICK,
  SERIES_HEAT_INDEX,
  SERIES_MAX_TEMP,
} from "../chart-theme";
import { ChartTooltip } from "../chart-tooltip";

/** Daily max temperature (line) and heat index (area) on one °C axis. */
export function TemperatureTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
      >
        <CartesianGrid
          vertical={false}
          stroke={AXIS_GRID}
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDayMonth}
          tick={{ fill: AXIS_TICK, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
        />
        <YAxis
          tick={{ fill: AXIS_TICK, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={44}
          unit="°"
        />
        <Tooltip
          content={<ChartTooltip unit="°C" labelFormatter={formatDayMonth} />}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS_TICK }} />
        <Area
          type="monotone"
          dataKey="heatIndexC"
          name="Heat index"
          stroke={SERIES_HEAT_INDEX}
          fill={SERIES_HEAT_INDEX}
          fillOpacity={0.15}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="maxTempC"
          name="Max temp"
          stroke={SERIES_MAX_TEMP}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
