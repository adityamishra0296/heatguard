"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDayMonth } from "@/lib/format";
import type { RecoveryPoint } from "@/server/analytics";

import { SERIES_HEAT_INDEX } from "../chart-theme";
import { ChartTooltip } from "../chart-tooltip";

const METRICS: Array<{
  key: keyof Omit<RecoveryPoint, "date">;
  label: string;
  unit: string;
}> = [
  { key: "hospitalAdmissions", label: "Hospital admissions", unit: "" },
  { key: "workdaysLost", label: "Workdays lost", unit: "" },
  { key: "cropLossPct", label: "Crop loss", unit: "%" },
  { key: "waterScarcityIndex", label: "Water scarcity index", unit: "" },
];

/** Small-multiples grid: one mini area chart per recovery indicator. */
export function RecoveryGrid({ data }: { data: RecoveryPoint[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {METRICS.map((metric) => (
        <figure key={metric.key} className="m-0">
          <figcaption className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-medium">{metric.label}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              latest {data.at(-1)?.[metric.key] ?? "—"}
              {metric.unit}
            </span>
          </figcaption>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <XAxis dataKey="date" hide />
              <YAxis hide domain={[0, "dataMax"]} />
              <Tooltip
                content={
                  <ChartTooltip
                    unit={metric.unit}
                    labelFormatter={formatDayMonth}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={metric.key}
                name={metric.label}
                stroke={SERIES_HEAT_INDEX}
                fill={SERIES_HEAT_INDEX}
                fillOpacity={0.15}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </figure>
      ))}
    </div>
  );
}
