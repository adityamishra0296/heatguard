import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

import { AlertBadge } from "@/components/alert-badge";
import { Button } from "@/components/ui/button";
import type { RegionOverview } from "@/server/regions";

/** Side panel showing a selected region's current status, with a link to its
 *  full detail report. */
export function RegionPanel({
  region,
  onClose,
}: {
  region: RegionOverview;
  onClose: () => void;
}) {
  const reading = region.latestReading;

  return (
    <div
      role="dialog"
      aria-label={`${region.name} details`}
      className="w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {region.state} · {region.districtType}
          </p>
          <h2 className="truncate text-lg font-semibold">{region.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded p-1 text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-3">
        <AlertBadge level={region.currentLevel} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Current temp</dt>
          <dd className="font-medium tabular-nums">
            {reading ? `${reading.maxTempC.toFixed(1)}°C` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Heat index</dt>
          <dd className="font-medium tabular-nums">
            {reading ? `${reading.heatIndexC.toFixed(1)}°C` : "—"}
          </dd>
        </div>
      </dl>

      <Button asChild className="mt-4 w-full">
        <Link href={`/regions/${region.id}`}>
          View full report
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
