import { Flame, MapPin, TriangleAlert, Users } from "lucide-react";

import { KPICard } from "@/components/kpi-card";
import type { OverviewKpis } from "@/features/response/kpis";
import { formatNumber } from "@/lib/format";

/** The four Response KPI cards, derived from {@link OverviewKpis}. */
export function KpiCards({ kpis }: { kpis: OverviewKpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        label="Regions monitored"
        value={formatNumber(kpis.regionsMonitored)}
        sublabel="across 6 focus states"
        icon={MapPin}
      />
      <KPICard
        label="Active alerts"
        value={formatNumber(kpis.activeAlerts)}
        sublabel="regions under warning"
        icon={TriangleAlert}
        tone="warning"
      />
      <KPICard
        label="Highest heat index"
        value={
          kpis.highestHeatIndex
            ? `${kpis.highestHeatIndex.value.toFixed(1)}°C`
            : "—"
        }
        sublabel={
          kpis.highestHeatIndex
            ? kpis.highestHeatIndex.regionName
            : "no readings"
        }
        icon={Flame}
        tone="danger"
      />
      <KPICard
        label="Population under Orange/Red"
        value={formatNumber(kpis.populationUnderElevatedAlert)}
        sublabel="people in elevated-alert areas"
        icon={Users}
        tone="warning"
      />
    </div>
  );
}
