import { Droplets, Gauge, ListChecks, ShieldCheck } from "lucide-react";

import { KPICard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import type { SurveySummaryStats } from "@/lib/survey";

const fmtPct = (value: number | null): string =>
  value === null ? "—" : `${value}%`;

const fmtAvg = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(1)} / 5`;

/** Read-only aggregate panel: four KPI tiles plus the awareness distribution.
 *  All figures are derived from the currently-filtered response set so the
 *  panel always matches the table and the exported summary. */
export function SurveySummaryPanel({
  summary,
}: {
  summary: SurveySummaryStats;
}) {
  const maxBucket = Math.max(
    1,
    ...summary.awarenessDistribution.map((b) => b.count),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <KPICard
          label="Responses"
          value={String(summary.count)}
          sublabel="In the current filter"
          icon={ListChecks}
        />
        <KPICard
          label="Average awareness"
          value={fmtAvg(summary.averageAwareness)}
          sublabel="Self-reported, 1–5"
          icon={Gauge}
        />
        <KPICard
          label="Heat action plan"
          value={fmtPct(summary.withHeatPlanPct)}
          sublabel="Report a plan exists"
          icon={ShieldCheck}
        />
        <KPICard
          label="Drinking water"
          value={fmtPct(summary.withWaterAccessPct)}
          sublabel="Report access to water"
          icon={Droplets}
        />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold">Awareness distribution</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Responses by self-reported awareness level.
        </p>
        <ul
          className="mt-3 flex flex-col gap-2"
          aria-label="Awareness distribution"
        >
          {summary.awarenessDistribution.map((bucket) => {
            const pctOfMax =
              summary.count === 0 ? 0 : (bucket.count / maxBucket) * 100;
            const pctOfTotal =
              summary.count === 0
                ? 0
                : Math.round((bucket.count / summary.count) * 100);
            return (
              <li
                key={bucket.level}
                className="flex items-center gap-3 text-sm"
              >
                <span className="w-14 shrink-0 text-muted-foreground">
                  Level {bucket.level}
                </span>
                <div
                  className="h-4 flex-1 overflow-hidden rounded-sm bg-muted"
                  role="img"
                  aria-label={`Level ${bucket.level}: ${bucket.count} responses (${pctOfTotal}%)`}
                >
                  <div
                    className="h-full rounded-sm bg-heat-orange transition-[width]"
                    style={{ width: `${pctOfMax}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right tabular-nums">
                  {bucket.count}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
