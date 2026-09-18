"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { KPICard } from "@/components/kpi-card";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTimeUTC, formatNumber } from "@/lib/format";
import { BarChartSVG, LEVEL_COLORS, RegionMapSVG } from "@/lib/report/figures";
import { encodeReportOptions } from "@/lib/report/encode";
import type {
  ReportModel,
  ReportOptions,
  ReportRecommendation,
} from "@/lib/report/types";

const LEVEL_LABEL = {
  NORMAL: "Normal",
  YELLOW: "Yellow",
  ORANGE: "Orange",
  RED: "Red",
} as const;

/** Paper-styled container so figure previews match the printed (light) report. */
function Paper({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-white p-4 text-neutral-900">
      {children}
    </div>
  );
}

export function ReportWorkspace({
  model,
  defaultRecommendations,
}: {
  model: ReportModel;
  defaultRecommendations: ReportRecommendation[];
}) {
  const [recommendations, setRecommendations] = useState<
    ReportRecommendation[]
  >(defaultRecommendations);
  const [execSummary, setExecSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options: ReportOptions = useMemo(
    () => ({
      recommendations,
      execSummary: execSummary.trim() ? execSummary.trim() : undefined,
    }),
    [recommendations, execSummary],
  );

  const printHref = useMemo(
    () => `/report/print?o=${encodeReportOptions(options)}`,
    [options],
  );

  const levelData = model.response.levelCounts.map((l) => ({
    label: LEVEL_LABEL[l.level],
    value: l.count,
    color: LEVEL_COLORS[l.level],
  }));

  const elevated = model.response.levelCounts
    .filter((l) => l.level === "ORANGE" || l.level === "RED")
    .reduce((sum, l) => sum + l.count, 0);

  function updateRec(id: string, field: "title" | "detail", value: string) {
    setRecommendations((current) =>
      current.map((rec) => (rec.id === id ? { ...rec, [field]: value } : rec)),
    );
  }

  function removeRec(id: string) {
    setRecommendations((current) => current.filter((rec) => rec.id !== id));
  }

  function addRec() {
    setRecommendations((current) => [
      ...current,
      { id: `rec-${Date.now()}`, title: "", detail: "" },
    ]);
  }

  async function downloadPdf() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ options }),
      });

      if (!response.ok) {
        let message = "The report PDF could not be generated.";
        try {
          const body = (await response.json()) as {
            error?: { message?: string };
          };
          if (body?.error?.message) message = body.error.message;
        } catch {
          // non-JSON error
        }
        setError(message);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "heatguard-report.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(
        "Could not reach the PDF service. Use “Open print view” and print to PDF from your browser.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        as="h1"
        title="Reports"
        description="Auto-generate the project's final report from live data, then export to PDF."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={printHref} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" aria-hidden />
                Open print view
              </a>
            </Button>
            <Button onClick={downloadPdf} disabled={generating}>
              {generating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              {generating ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        }
      />

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-heat-orange/40 bg-heat-orange/10 px-4 py-3 text-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-heat-orange"
            aria-hidden
          />
          <p>{error}</p>
        </div>
      ) : null}

      {/* Snapshot / preview */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Report snapshot"
          description="What the generated report will contain."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Districts"
            value={String(model.studyArea.regionCount)}
            sublabel={`${model.studyArea.stateCount} states`}
            icon={FileText}
          />
          <KPICard
            label="Active warnings"
            value={String(model.response.activeAlertCount)}
            sublabel={`${elevated} at Orange/Red`}
            tone={elevated > 0 ? "warning" : "neutral"}
          />
          <KPICard
            label="At-risk districts"
            value={String(model.vulnerability.atRisk.length)}
            sublabel="Heat × vulnerability"
            tone={model.vulnerability.atRisk.length > 0 ? "danger" : "neutral"}
          />
          <KPICard
            label="Status code"
            value={model.response.statusCode?.code ?? "—"}
            sublabel={model.response.statusCode?.overall ?? "n/a"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">
              Alert-level distribution
            </h3>
            <Paper>
              <BarChartSVG
                data={levelData}
                ariaLabel="Alert-level distribution preview"
              />
            </Paper>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">
              District map snapshot
            </h3>
            <Paper>
              <RegionMapSVG
                regions={model.studyArea.regions}
                colorBy="level"
                ariaLabel="District map snapshot preview"
                height={320}
              />
            </Paper>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Data as of{" "}
          {model.meta.dataAsOf ? formatDateTimeUTC(model.meta.dataAsOf) : "—"}.
          Total population covered:{" "}
          {formatNumber(model.studyArea.totalPopulation)}.
        </p>
      </section>

      {/* Editable executive summary */}
      <Card className="p-5">
        <label htmlFor="exec-summary" className="text-sm font-semibold">
          Executive summary{" "}
          <span className="font-normal text-muted-foreground">
            (optional override)
          </span>
        </label>
        <p className="mt-0.5 mb-2 text-xs text-muted-foreground">
          Leave blank to auto-generate a summary from live data.
        </p>
        <textarea
          id="exec-summary"
          value={execSummary}
          onChange={(e) => setExecSummary(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Write a custom executive summary…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Card>

      {/* Editable recommendations */}
      <Card className="p-5">
        <SectionHeader
          title="Recommendations"
          description="Pre-filled with the project's sample recommendations. Edit before exporting."
          actions={
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRecommendations(defaultRecommendations)}
              >
                <RotateCcw className="size-4" aria-hidden />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={addRec}>
                <Plus className="size-4" aria-hidden />
                Add
              </Button>
            </div>
          }
        />
        <ol className="mt-4 flex flex-col gap-4">
          {recommendations.map((rec, index) => (
            <li key={rec.id} className="rounded-md border border-border p-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`rec-title-${rec.id}`} className="sr-only">
                      Recommendation {index + 1} title
                    </label>
                    <input
                      id={`rec-title-${rec.id}`}
                      value={rec.title}
                      onChange={(e) =>
                        updateRec(rec.id, "title", e.target.value)
                      }
                      placeholder="Recommendation title"
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`rec-detail-${rec.id}`} className="sr-only">
                      Recommendation {index + 1} detail
                    </label>
                    <textarea
                      id={`rec-detail-${rec.id}`}
                      value={rec.detail}
                      onChange={(e) =>
                        updateRec(rec.id, "detail", e.target.value)
                      }
                      rows={2}
                      placeholder="Describe the recommended action…"
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove recommendation ${index + 1}`}
                  onClick={() => removeRec(rec.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
          {recommendations.length === 0 ? (
            <li className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No recommendations. Use “Add” to create one or “Reset” to restore
              the defaults.
            </li>
          ) : null}
        </ol>
      </Card>
    </div>
  );
}
