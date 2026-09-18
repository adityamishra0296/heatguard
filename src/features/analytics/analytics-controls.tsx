"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnalyticsRegion } from "@/server/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;

function shiftDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

const PRESETS = [7, 14, 30] as const;

/** Region selector + date-range picker. Any change pushes new search params so
 *  the server re-renders every chart from freshly aggregated data. */
export function AnalyticsControls({
  regions,
  selectedId,
  from,
  to,
  min,
  max,
}: {
  regions: AnalyticsRegion[];
  selectedId: string;
  from: string;
  to: string;
  min: string;
  max: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = (next: { region?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams({
      region: next.region ?? selectedId,
      from: next.from ?? from,
      to: next.to ?? to,
    });
    startTransition(() =>
      router.push(`/analytics?${params.toString()}`, { scroll: false }),
    );
  };

  const applyPreset = (days: number) => {
    const candidate = shiftDate(max, -(days - 1));
    push({ from: candidate < min ? min : candidate, to: max });
  };

  const groups = new Map<string, AnalyticsRegion[]>();
  for (const region of regions) {
    const list = groups.get(region.state) ?? [];
    list.push(region);
    groups.set(region.state, list);
  }

  const fieldClass =
    "h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="analytics-region"
          className="text-xs font-medium text-muted-foreground"
        >
          Region
        </label>
        <select
          id="analytics-region"
          value={selectedId}
          onChange={(event) => push({ region: event.target.value })}
          className={`${fieldClass} w-44`}
        >
          {[...groups.entries()].map(([state, items]) => (
            <optgroup key={state} label={state}>
              {items.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="analytics-from"
          className="text-xs font-medium text-muted-foreground"
        >
          From
        </label>
        <input
          id="analytics-from"
          type="date"
          value={from}
          min={min}
          max={to}
          onChange={(event) =>
            event.target.value && push({ from: event.target.value })
          }
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="analytics-to"
          className="text-xs font-medium text-muted-foreground"
        >
          To
        </label>
        <input
          id="analytics-to"
          type="date"
          value={to}
          min={from}
          max={max}
          onChange={(event) =>
            event.target.value && push({ to: event.target.value })
          }
          className={fieldClass}
        />
      </div>

      <div className="flex items-center gap-1">
        {PRESETS.map((days) => (
          <Button
            key={days}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(days)}
          >
            {days}d
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => push({ from: min, to: max })}
        >
          All
        </Button>
      </div>

      {isPending ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Updating…
        </span>
      ) : null}
    </div>
  );
}
