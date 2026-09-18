import { Flame, Thermometer, TriangleAlert } from "lucide-react";

import { KPICard } from "@/components/kpi-card";
import { formatDateUTC } from "@/lib/format";
import type {
  AnalyticsRegion,
  AnalyticsSummary as Summary,
} from "@/server/analytics";

/** Summary strip of computed stats for the selected region and range. */
export function AnalyticsSummary({
  summary,
  region,
}: {
  summary: Summary;
  region: AnalyticsRegion;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KPICard
        label="Avg heat index"
        value={
          summary.avgHeatIndex !== null ? `${summary.avgHeatIndex}°C` : "—"
        }
        sublabel={`${region.name} · selected range`}
        icon={Thermometer}
      />
      <KPICard
        label="Days over Orange/Red"
        value={`${summary.daysOverElevated}`}
        sublabel={`of ${summary.totalDays} days in range`}
        icon={TriangleAlert}
        tone="warning"
      />
      <KPICard
        label="Worst day"
        value={summary.worstDay ? `${summary.worstDay.heatIndexC}°C` : "—"}
        sublabel={summary.worstDay ? formatDateUTC(summary.worstDay.date) : "—"}
        icon={Flame}
        tone="danger"
      />
    </div>
  );
}
