import type { Metadata } from "next";

import { ReportDocument } from "@/features/reports/report-document";
import { DEFAULT_RECOMMENDATIONS, REPORT_CHAPTERS } from "@/lib/report/content";
import { decodeReportOptions } from "@/lib/report/encode";
import type { ReportOptions } from "@/lib/report/types";
import { buildReportModel } from "@/server/report";

export const metadata: Metadata = {
  title: "Report — Print View",
  robots: { index: false, follow: false },
};

// Reflect the latest live data every time the report is generated.
export const dynamic = "force-dynamic";

/**
 * Standalone, print-optimized report route. Rendered outside the console shell
 * so it can be printed to PDF directly (browser fallback) and captured by the
 * server-side PDF generator. Editable options arrive base64url-encoded in `?o=`.
 */
export default async function ReportPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string }>;
}) {
  const { o } = await searchParams;
  const options: ReportOptions = decodeReportOptions(o) ?? {
    recommendations: DEFAULT_RECOMMENDATIONS,
  };
  const model = await buildReportModel();

  return (
    <ReportDocument
      model={model}
      options={options}
      chapters={REPORT_CHAPTERS}
    />
  );
}
