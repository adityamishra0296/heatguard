"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AlertBucket } from "@/server/analytics";

import {
  AXIS_GRID,
  AXIS_TICK,
  CURSOR_FILL,
  HEAT_LEVEL_COLOR,
} from "../chart-theme";
import { ChartTooltip } from "../chart-tooltip";

/** Stacked bars: number of days at each alert level, per week. */
export function AlertDistributionChart({ data }: { data: AlertBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid
          vertical={false}
          stroke={AXIS_GRID}
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="bucket"
          tick={{ fill: AXIS_TICK, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: AXIS_TICK, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: CURSOR_FILL, fillOpacity: 0.3 }}
          content={<ChartTooltip unit=" days" />}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS_TICK }} />
        <Bar
          dataKey="NORMAL"
          name="Normal"
          stackId="a"
          fill={HEAT_LEVEL_COLOR.NORMAL}
          isAnimationActive={false}
        />
        <Bar
          dataKey="YELLOW"
          name="Yellow"
          stackId="a"
          fill={HEAT_LEVEL_COLOR.YELLOW}
          isAnimationActive={false}
        />
        <Bar
          dataKey="ORANGE"
          name="Orange"
          stackId="a"
          fill={HEAT_LEVEL_COLOR.ORANGE}
          isAnimationActive={false}
        />
        <Bar
          dataKey="RED"
          name="Red"
          stackId="a"
          fill={HEAT_LEVEL_COLOR.RED}
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
