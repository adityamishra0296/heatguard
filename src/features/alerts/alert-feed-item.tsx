import { AlertBadge } from "@/components/alert-badge";
import { Button } from "@/components/ui/button";
import { toHeatAlertLevel } from "@/lib/enums";
import { formatDateTimeUTC } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AlertWithRegionDTO } from "@/server/alerts";

const LEFT_BORDER: Record<string, string> = {
  NORMAL: "border-l-heat-normal",
  YELLOW: "border-l-heat-yellow",
  ORANGE: "border-l-heat-orange",
  RED: "border-l-heat-red",
};

/** A single alert row: level, region, heat index, message, time, acknowledge. */
export function AlertFeedItem({
  alert,
  onAcknowledge,
  isPending,
}: {
  alert: AlertWithRegionDTO;
  onAcknowledge: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-2 border-l-4 py-3 pl-3 sm:flex-row sm:items-center sm:gap-4",
        // Acknowledged alerts are de-emphasised with a neutral border (not a
        // blanket opacity, which would drop text below the AA contrast ratio);
        // the badge still carries the level colour and an "Acknowledged" label.
        alert.active
          ? (LEFT_BORDER[alert.level] ?? "border-l-border")
          : "border-l-border",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <AlertBadge level={toHeatAlertLevel(alert.level)} />
          <span className="font-medium">{alert.region.name}</span>
          <span className="text-xs text-muted-foreground">
            {alert.region.state}
          </span>
          {alert.heatIndexC !== null ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              · {alert.heatIndexC.toFixed(1)}°C
            </span>
          ) : null}
          {alert.active ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Active
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Acknowledged</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{alert.message}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateTimeUTC(alert.issuedAt)}
        </p>
      </div>

      {alert.active ? (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onAcknowledge(alert.id)}
          className="shrink-0"
        >
          {isPending ? "Acknowledging…" : "Acknowledge"}
        </Button>
      ) : null}
    </li>
  );
}
