import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AlertBadge } from "@/components/alert-badge";
import { Card } from "@/components/ui/card";
import { toHeatAlertLevel } from "@/lib/enums";
import { getPredictedRiskSummary } from "@/server/ml";

/** Async server component: top regions by predicted 7-day peak risk. */
export async function PredictedRiskWidget() {
  const summary = await getPredictedRiskSummary(7);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-semibold">Predicted risk · next 7 days</h2>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Model estimate
        </span>
      </div>

      {summary === null ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Prediction service offline — the live data below is unaffected.
        </p>
      ) : summary.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No predictions available.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {summary.slice(0, 5).map((region) => (
            <li
              key={region.regionId}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
            >
              <AlertBadge level={toHeatAlertLevel(region.peakLevel)} />
              <Link
                href={`/regions/${region.regionId}`}
                className="rounded font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {region.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {region.state}
              </span>
              <span className="ml-auto text-sm tabular-nums">
                peak {region.peakPredictedHeatIndexC}°C
              </span>
              <span className="text-xs text-muted-foreground">
                · {region.daysElevated}d elevated
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Peak predicted heat index. AI model estimate — not authoritative.
      </p>
    </Card>
  );
}
