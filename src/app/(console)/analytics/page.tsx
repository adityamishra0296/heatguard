import type { Metadata } from "next";
import { LineChart } from "lucide-react";

import { DataEmptyState } from "@/components/data-empty-state";
import { SectionHeader } from "@/components/section-header";
import { AnalyticsControls } from "@/features/analytics/analytics-controls";
import { AnalyticsSummary } from "@/features/analytics/analytics-summary";
import { ChartCard } from "@/features/analytics/chart-card";
import { AlertDistributionChart } from "@/features/analytics/charts/alert-distribution-chart";
import { CrossRegionChart } from "@/features/analytics/charts/cross-region-chart";
import { RecoveryGrid } from "@/features/analytics/charts/recovery-grid";
import { TemperatureTrendChart } from "@/features/analytics/charts/temperature-trend-chart";
import { getAnalytics } from "@/server/analytics";

// Render per request so charts reflect the current selection and latest data.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Heat-wave trends, alert-level distribution, recovery indicators, and cross-region comparison.",
};

const dateOnly = (iso: string): string => iso.slice(0, 10);

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const data = await getAnalytics(params.region, params.from, params.to);

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SectionHeader as="h1" title="Analytics" />
        <DataEmptyState
          className="mt-8"
          icon={<LineChart className="size-8" />}
          title="No data to analyse yet"
          description="Run `npm run db:seed` to populate regions and readings."
        />
      </div>
    );
  }

  const { selectedRegion, range } = data;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <SectionHeader
        as="h1"
        title="Analytics"
        description={`Heat-wave trends and comparisons — ${selectedRegion.name}, ${selectedRegion.state}.`}
      />

      <div className="mt-4">
        <AnalyticsControls
          regions={data.regions}
          selectedId={selectedRegion.id}
          from={dateOnly(range.from)}
          to={dateOnly(range.to)}
          min={dateOnly(range.min)}
          max={dateOnly(range.max)}
        />
      </div>

      <div className="mt-4">
        <AnalyticsSummary summary={data.summary} region={selectedRegion} />
      </div>

      <div className="mt-6 grid gap-4">
        <ChartCard
          title="Temperature &amp; heat index"
          description={`Daily maximum temperature and heat index for ${selectedRegion.name}.`}
          isEmpty={data.trend.length === 0}
        >
          <TemperatureTrendChart data={data.trend} />
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Alert levels over time"
            description="Number of days at each alert level, grouped by week."
            isEmpty={data.alertDistribution.length === 0}
          >
            <AlertDistributionChart data={data.alertDistribution} />
          </ChartCard>

          <ChartCard
            title="Peak heat index by region"
            description="Regions ranked by peak heat index in range, coloured by state."
            isEmpty={data.crossRegion.length === 0}
          >
            <CrossRegionChart
              data={data.crossRegion}
              selectedId={selectedRegion.id}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Recovery indicators"
          description={`Weekly recovery signals for ${selectedRegion.name}.`}
          isEmpty={data.recovery.length === 0}
        >
          <RecoveryGrid data={data.recovery} />
        </ChartCard>
      </div>
    </div>
  );
}
