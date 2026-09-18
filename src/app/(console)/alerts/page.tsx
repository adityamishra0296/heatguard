import type { Metadata } from "next";

import { SectionHeader } from "@/components/section-header";
import { AlertsPanel } from "@/features/alerts/alerts-panel";
import { StatusCodePanel } from "@/features/alerts/status-code-panel";
import { ThresholdLegend } from "@/features/alerts/threshold-legend";
import { getAlertCenter } from "@/server/alerts";

// Render per request so the feed and status code reflect the latest data.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alerts",
  description:
    "Early-warning alert feed, heat-index thresholds, system status code, and alert simulation.",
};

export default async function AlertsPage() {
  const { feed, regions, statusCode } = await getAlertCenter();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <SectionHeader
        as="h1"
        title="Early Warning & Alerts"
        description="Live alert feed, thresholds, and a mission-style system status code."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StatusCodePanel statusCode={statusCode} />
        </div>
        <ThresholdLegend />
      </div>

      <div className="mt-4">
        <AlertsPanel initialAlerts={feed} regions={regions} />
      </div>
    </div>
  );
}
