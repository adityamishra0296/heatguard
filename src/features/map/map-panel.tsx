"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

// MapLibre is browser-only, so load the map with ssr disabled and show a
// skeleton (matching its height) while the chunk loads — no layout shift.
const HeatMap = dynamic(() => import("./heat-map").then((m) => m.HeatMap), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100svh_-_3.5rem)] w-full p-4">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  ),
});

/** Client boundary that mounts the interactive heat map. */
export function MapPanel() {
  return <HeatMap />;
}
