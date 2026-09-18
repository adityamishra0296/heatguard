import type { Metadata } from "next";

import { MapPanel } from "@/features/map/map-panel";

export const metadata: Metadata = {
  title: "Map",
  description:
    "Interactive GIS map of heat-wave hotspots across the monitored regions.",
};

/** Full-bleed GIS map module. Data is fetched client-side by the map component. */
export default function MapPage() {
  return <MapPanel />;
}
