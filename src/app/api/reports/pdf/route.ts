import type { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";

import { apiFailure } from "@/lib/api/http";
import { resolveChromePath } from "@/lib/report/chrome";
import { DEFAULT_RECOMMENDATIONS } from "@/lib/report/content";
import { encodeReportOptions, reportOptionsSchema } from "@/lib/report/encode";
import type { ReportOptions } from "@/lib/report/types";

// PDF generation shells out to a system Chrome via Puppeteer, so it must run on
// the Node.js runtime and never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HEADER_TEMPLATE = `
  <div style="font-size:8px; color:#94a3b8; width:100%; padding:0 14mm; text-align:right;">
    HeatGuard — Heat Wave Disaster Management Report
  </div>`;

const FOOTER_TEMPLATE = `
  <div style="font-size:8px; color:#94a3b8; width:100%; padding:0 14mm; display:flex; justify-content:space-between;">
    <span>HeatGuard</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;

/**
 * POST /api/reports/pdf — generate the report PDF server-side.
 *
 * Body: `{ options?: ReportOptions }`. The (validated) options are encoded into
 * the standalone print URL, which headless Chrome renders and prints to PDF with
 * a cover page, running header, and page numbers. If no browser is available the
 * route returns a 503 so the UI can fall back to browser-based printing.
 */
export async function POST(req: NextRequest): Promise<Response> {
  let options: ReportOptions = { recommendations: DEFAULT_RECOMMENDATIONS };
  try {
    const body: unknown = await req.json();
    const candidate = (body as { options?: unknown })?.options;
    const parsed = reportOptionsSchema.safeParse(candidate);
    if (parsed.success) options = parsed.data;
  } catch {
    // No or invalid body → fall back to default recommendations.
  }

  const executablePath = resolveChromePath();
  if (!executablePath) {
    return apiFailure(
      503,
      "PDF_ENGINE_UNAVAILABLE",
      "No Chrome/Chromium executable was found for server-side PDF generation. Use “Open print view” and print to PDF from your browser.",
    );
  }

  const encoded = encodeReportOptions(options);
  const printUrl = `${req.nextUrl.origin}/report/print?o=${encoded}`;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 45000 });
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: HEADER_TEMPLATE,
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: "20mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="heatguard-report.pdf"',
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/reports/pdf] generation failed:", error);
    return apiFailure(
      500,
      "PDF_GENERATION_FAILED",
      "The report PDF could not be generated. Use “Open print view” and print to PDF from your browser.",
    );
  } finally {
    await browser?.close();
  }
}
