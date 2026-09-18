import type { Metadata } from "next";

import { ReportWorkspace } from "@/features/reports/report-workspace";
import { DEFAULT_RECOMMENDATIONS } from "@/lib/report/content";
import { buildReportModel } from "@/server/report";

export const metadata: Metadata = { title: "Reports" };

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const model = await buildReportModel();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ReportWorkspace
        model={model}
        defaultRecommendations={DEFAULT_RECOMMENDATIONS}
      />
    </div>
  );
}
