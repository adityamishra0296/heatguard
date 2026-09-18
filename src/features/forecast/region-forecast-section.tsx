import { Sparkles } from "lucide-react";

import { AlertBadge } from "@/components/alert-badge";
import { Card } from "@/components/ui/card";
import { toHeatAlertLevel } from "@/lib/enums";
import { formatDayMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getRegionForecast, type HealthRiskCategory } from "@/server/ml";

const RISK_TEXT: Record<HealthRiskCategory, string> = {
  Low: "text-heat-normal",
  Moderate: "text-heat-yellow",
  High: "text-heat-orange",
  Severe: "text-heat-red",
};

/** Async server component: 7-day forecast for a region (degrades if offline). */
export async function RegionForecastSection({
  regionId,
}: {
  regionId: string;
}) {
  const forecast = await getRegionForecast(regionId, 7);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-semibold">7-day forecast</h2>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Model estimate
        </span>
      </div>

      {forecast === null ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Forecast unavailable — the prediction service is offline. The rest of
          the dashboard is unaffected.
        </p>
      ) : forecast.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No forecast available for this region.
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <div className="flex gap-2">
              {forecast.map((day) => (
                <div
                  key={day.date}
                  className="flex w-28 shrink-0 flex-col items-center gap-1 rounded-lg border border-border p-3 text-center"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatDayMonth(day.date)}
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {day.predictedHeatIndexC}°C
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    max {day.predictedMaxTempC}°C
                  </p>
                  <AlertBadge level={toHeatAlertLevel(day.predictedLevel)} />
                  <p
                    className={cn(
                      "text-xs font-medium",
                      RISK_TEXT[day.healthRisk],
                    )}
                  >
                    {day.healthRisk} risk
                  </p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Predicted heat index per day. AI model estimate — not an
            authoritative forecast.
          </p>
        </>
      )}
    </Card>
  );
}
