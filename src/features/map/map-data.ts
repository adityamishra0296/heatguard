import type { HeatAlertLevel } from "@/lib/enums";
import type { RegionOverview } from "@/server/regions";

/** Properties carried by each region point feature on the map. */
export interface RegionFeatureProps {
  id: string;
  name: string;
  state: string;
  districtType: string;
  maxTempC: number;
  heatIndexC: number;
  level: HeatAlertLevel;
  vulnerabilityScore: number;
}

/** Convert regions to a GeoJSON FeatureCollection for the MapLibre source. */
export function toRegionFeatureCollection(
  regions: RegionOverview[],
): GeoJSON.FeatureCollection<GeoJSON.Point, RegionFeatureProps> {
  return {
    type: "FeatureCollection",
    features: regions
      .filter(
        (r) => Number.isFinite(r.longitude) && Number.isFinite(r.latitude),
      )
      .map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
        properties: {
          id: r.id,
          name: r.name,
          state: r.state,
          districtType: r.districtType,
          maxTempC: r.latestReading?.maxTempC ?? 0,
          heatIndexC: r.latestReading?.heatIndexC ?? 0,
          level: r.currentLevel,
          vulnerabilityScore: r.vulnerabilityScore ?? 0,
        },
      })),
  };
}
