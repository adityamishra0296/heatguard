"use client";

import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreateSurveyInput } from "@/lib/api/schemas";
import { submitSurvey } from "@/lib/api-client";
import { csvDateUTC, toCsv } from "@/lib/csv";
import { formatDateTimeUTC } from "@/lib/format";
import { computeSurveySummary } from "@/lib/survey";
import type { SurveyResponseRow } from "@/server/surveys";

import { SurveyForm } from "./survey-form";
import { SurveySummaryPanel } from "./survey-summary-panel";

interface RegionOption {
  id: string;
  name: string;
  state: string;
}

type SurveyRow = SurveyResponseRow & { pending?: boolean };

const yesNo = (value: boolean): string => (value ? "Yes" : "No");

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Client-side Field Survey workspace. Owns the response list so a newly
 *  submitted response appears instantly (optimistic), drives the summary and
 *  the CSV exports from the currently-filtered set, and rolls back on failure. */
export function SurveyModule({
  regions,
  initialResponses,
}: {
  regions: RegionOption[];
  initialResponses: SurveyResponseRow[];
}) {
  const [responses, setResponses] = useState<SurveyRow[]>(initialResponses);
  const [regionFilter, setRegionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const regionsById = useMemo(() => {
    const map = new Map<string, RegionOption>();
    for (const region of regions) map.set(region.id, region);
    return map;
  }, [regions]);

  const filtered = useMemo(() => {
    return responses.filter((row) => {
      if (regionFilter && row.regionId !== regionFilter) return false;
      const day = row.submittedAt.slice(0, 10);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      return true;
    });
  }, [responses, regionFilter, fromDate, toDate]);

  const summary = useMemo(
    () =>
      computeSurveySummary(
        filtered.map((row) => ({
          awarenessLevel: row.awarenessLevel,
          hasHeatPlan: row.hasHeatPlan,
          accessToShade: row.accessToShade,
          accessToDrinkingWater: row.accessToDrinkingWater,
        })),
      ),
    [filtered],
  );

  const handleSubmit = useCallback(
    async (values: CreateSurveyInput) => {
      const region = regionsById.get(values.regionId);
      const tempId = `pending-${Date.now()}`;
      const optimistic: SurveyRow = {
        id: tempId,
        regionId: values.regionId,
        regionName: region?.name ?? "—",
        regionState: region?.state ?? "—",
        submittedAt: new Date().toISOString(),
        awarenessLevel: values.awarenessLevel,
        hasHeatPlan: values.hasHeatPlan,
        accessToShade: values.accessToShade,
        accessToDrinkingWater: values.accessToDrinkingWater,
        notes: values.notes ?? null,
        pending: true,
      };

      setResponses((current) => [optimistic, ...current]);

      try {
        const created = await submitSurvey(values);
        setResponses((current) =>
          current.map((row) =>
            row.id === tempId
              ? {
                  ...optimistic,
                  id: created.id,
                  submittedAt: created.submittedAt,
                  notes: created.notes,
                  pending: false,
                }
              : row,
          ),
        );
      } catch (error) {
        setResponses((current) => current.filter((row) => row.id !== tempId));
        throw error;
      }
    },
    [regionsById],
  );

  const exportResponses = useCallback(() => {
    const headers = [
      "Region",
      "State",
      "Submitted (UTC)",
      "Awareness (1-5)",
      "Heat action plan",
      "Access to shade",
      "Access to drinking water",
      "Notes",
    ];
    const rows = filtered.map((row) => [
      row.regionName,
      row.regionState,
      csvDateUTC(row.submittedAt),
      row.awarenessLevel,
      yesNo(row.hasHeatPlan),
      yesNo(row.accessToShade),
      yesNo(row.accessToDrinkingWater),
      row.notes ?? "",
    ]);
    downloadCsv("heatguard-survey-responses.csv", toCsv(headers, rows));
  }, [filtered]);

  const exportSummary = useCallback(() => {
    const rows: (string | number)[][] = [
      ["Responses", summary.count],
      ["Average awareness (1-5)", summary.averageAwareness ?? ""],
      ["% with heat action plan", summary.withHeatPlanPct ?? ""],
      ["% with access to shade", summary.withShadePct ?? ""],
      ["% with access to drinking water", summary.withWaterAccessPct ?? ""],
      ...summary.awarenessDistribution.map((bucket) => [
        `Awareness level ${bucket.level} (count)`,
        bucket.count,
      ]),
    ];
    downloadCsv(
      "heatguard-survey-summary.csv",
      toCsv(["Metric", "Value"], rows),
    );
  }, [summary]);

  const filtersActive = regionFilter !== "" || fromDate !== "" || toDate !== "";
  const controlClass =
    "h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SurveyForm regions={regions} onSubmit={handleSubmit} />
        </div>
        <div className="lg:col-span-2">
          <SurveySummaryPanel summary={summary} />
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-region"
                className="text-xs font-medium text-muted-foreground"
              >
                Region
              </label>
              <select
                id="filter-region"
                value={regionFilter}
                onChange={(event) => setRegionFilter(event.target.value)}
                className={controlClass}
              >
                <option value="">All regions</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name} · {region.state}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-from"
                className="text-xs font-medium text-muted-foreground"
              >
                From
              </label>
              <input
                id="filter-from"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className={controlClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-to"
                className="text-xs font-medium text-muted-foreground"
              >
                To
              </label>
              <input
                id="filter-to"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className={controlClass}
              />
            </div>
            {filtersActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRegionFilter("");
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportResponses}
              disabled={filtered.length === 0}
            >
              <Download className="size-4" aria-hidden />
              Responses CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportSummary}
              disabled={filtered.length === 0}
            >
              <Download className="size-4" aria-hidden />
              Summary CSV
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          Showing {filtered.length} of {responses.length} response
          {responses.length === 1 ? "" : "s"}.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Field survey responses</caption>
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Region
                </th>
                <th scope="col" className="py-2 pr-3 text-center font-medium">
                  Awareness
                </th>
                <th scope="col" className="py-2 pr-3 text-center font-medium">
                  Heat plan
                </th>
                <th scope="col" className="py-2 pr-3 text-center font-medium">
                  Shade
                </th>
                <th scope="col" className="py-2 pr-3 text-center font-medium">
                  Water
                </th>
                <th
                  scope="col"
                  className="hidden py-2 pr-3 font-medium md:table-cell"
                >
                  Notes
                </th>
                <th scope="col" className="py-2 pr-0 text-right font-medium">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No responses match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.pending
                        ? "border-b border-border/60 opacity-60"
                        : "border-b border-border/60"
                    }
                  >
                    <td className="py-2 pr-3">
                      <span className="font-medium">{row.regionName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {row.regionState}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-center tabular-nums">
                      {row.awarenessLevel}
                    </td>
                    <td className="py-2 pr-3 text-center">
                      {yesNo(row.hasHeatPlan)}
                    </td>
                    <td className="py-2 pr-3 text-center">
                      {yesNo(row.accessToShade)}
                    </td>
                    <td className="py-2 pr-3 text-center">
                      {yesNo(row.accessToDrinkingWater)}
                    </td>
                    <td className="hidden max-w-xs py-2 pr-3 text-muted-foreground md:table-cell">
                      <span className="line-clamp-2">{row.notes ?? "—"}</span>
                    </td>
                    <td className="py-2 pr-0 text-right text-xs text-muted-foreground">
                      {row.pending
                        ? "Saving…"
                        : formatDateTimeUTC(row.submittedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
