import type { Metadata } from "next";
import { Suspense } from "react";
import { Inbox } from "lucide-react";

import { DataEmptyState } from "@/components/data-empty-state";
import { SectionHeader } from "@/components/section-header";
import { PredictedRiskSkeleton } from "@/features/forecast/forecast-skeleton";
import { PredictedRiskWidget } from "@/features/forecast/predicted-risk-widget";
import { KpiCards } from "@/features/response/components/kpi-cards";
import { RegionsTable } from "@/features/response/components/regions-table";
import { computeOverviewKpis } from "@/features/response/kpis";
import { getRegionsOverview } from "@/server/regions";

// Near-real-time: render on every request so the dashboard always reflects the
// latest telemetry rather than a value cached at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview — Live Monitoring",
  description:
    "Real-time heat-wave monitoring: KPIs, current heat index per region, and active early-warning alerts.",
};

export default async function DashboardPage() {
  const regions = await getRegionsOverview();
  const kpis = computeOverviewKpis(regions);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <SectionHeader
        as="h1"
        title="Live Monitoring"
        description="Current heat-wave risk and early-warning alerts across the focus states."
      />

      {regions.length === 0 ? (
        <DataEmptyState
          className="mt-8"
          icon={<Inbox className="size-8" />}
          title="No regions to monitor yet"
          description="The database has no regions. Run `npm run db:seed` to populate regions, readings, and alerts."
        />
      ) : (
        <>
          <div className="mt-6">
            <KpiCards kpis={kpis} />
          </div>
          <div className="mt-4">
            <Suspense fallback={<PredictedRiskSkeleton />}>
              <PredictedRiskWidget />
            </Suspense>
          </div>
          <section className="mt-8">
            <SectionHeader as="h2" title="Monitored regions" className="mb-3" />
            <RegionsTable regions={regions} />
          </section>
        </>
      )}
    </div>
  );
}
