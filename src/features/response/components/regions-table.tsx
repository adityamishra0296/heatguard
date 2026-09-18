"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { AlertBadge } from "@/components/alert-badge";
import { formatDateTimeUTC } from "@/lib/format";
import type { RegionOverview } from "@/server/regions";

type SortKey = "heatIndex" | "state";
type SortDir = "asc" | "desc";

const heatIndexOf = (region: RegionOverview): number =>
  region.latestReading?.heatIndexC ?? Number.NEGATIVE_INFINITY;

/** Sortable, keyboard-navigable table of monitored regions. */
export function RegionsTable({ regions }: { regions: RegionOverview[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("heatIndex");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...regions];
    copy.sort((a, b) => {
      const cmp =
        sortKey === "heatIndex"
          ? heatIndexOf(a) - heatIndexOf(b)
          : a.state.localeCompare(b.state) || a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [regions, sortKey, sortDir]);

  function toggleSort(key: SortKey): void {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "heatIndex" ? "desc" : "asc");
    }
  }

  const ariaSort = (key: SortKey): "ascending" | "descending" | "none" =>
    key === sortKey ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  function sortIcon(key: SortKey): ReactNode {
    if (key !== sortKey) {
      return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5" aria-hidden />
    ) : (
      <ArrowDown className="size-3.5" aria-hidden />
    );
  }

  const sortButton =
    "inline-flex items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">
          Monitored regions with current max temperature, heat index, alert
          level and last update. Sortable by heat index and by state.
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-medium">
              Region
            </th>
            <th
              scope="col"
              aria-sort={ariaSort("state")}
              className="px-4 py-3 font-medium"
            >
              <button
                type="button"
                onClick={() => toggleSort("state")}
                className={sortButton}
              >
                State {sortIcon("state")}
              </button>
            </th>
            <th
              scope="col"
              className="hidden px-4 py-3 text-right font-medium sm:table-cell"
            >
              Max temp
            </th>
            <th
              scope="col"
              aria-sort={ariaSort("heatIndex")}
              className="px-4 py-3 text-right font-medium"
            >
              <button
                type="button"
                onClick={() => toggleSort("heatIndex")}
                className={`${sortButton} ml-auto`}
              >
                Heat index {sortIcon("heatIndex")}
              </button>
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Alert
            </th>
            <th
              scope="col"
              className="hidden px-4 py-3 font-medium md:table-cell"
            >
              Last updated
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((region) => (
            <tr
              key={region.id}
              className="border-b border-border last:border-0 hover:bg-muted/40"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/regions/${region.id}`}
                  className="rounded font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {region.name}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {region.districtType}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {region.state}
              </td>
              <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                {region.latestReading
                  ? `${region.latestReading.maxTempC.toFixed(1)}°C`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">
                {region.latestReading
                  ? `${region.latestReading.heatIndexC.toFixed(1)}°C`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <AlertBadge level={region.currentLevel} />
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                {region.latestReading
                  ? formatDateTimeUTC(region.latestReading.timestamp)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
