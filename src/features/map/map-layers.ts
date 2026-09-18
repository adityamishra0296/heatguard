import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
} from "maplibre-gl";

import type { RegionOverview } from "@/server/regions";

import {
  HEAT_COLORS,
  HEATMAP_GRADIENT,
  VULNERABILITY_GRADIENT,
} from "./heat-colors";
import { toRegionFeatureCollection } from "./map-data";

export type MarkerColorMode = "level" | "vulnerability";

export const SOURCE_ID = "regions";
export const HEAT_LAYER = "regions-heat";
export const MARKERS_LAYER = "regions-markers";
export const LABELS_LAYER = "regions-labels";

// Data-driven style expressions (typed so the layer specs stay `any`-free).
const heatmapWeight: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "heatIndexC"],
  30,
  0,
  60,
  1,
];

const heatmapIntensity: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3,
  0.6,
  8,
  1.5,
];

const heatmapRadius: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3,
  18,
  8,
  46,
];

const heatmapColor: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["heatmap-density"],
  ...HEATMAP_GRADIENT.flatMap(([stop, color]): [number, string] => [
    stop,
    color,
  ]),
] as unknown as ExpressionSpecification;

const circleRadius: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "heatIndexC"],
  32,
  6,
  45,
  12,
  60,
  20,
];

const circleColor: ExpressionSpecification = [
  "match",
  ["get", "level"],
  "NORMAL",
  HEAT_COLORS.NORMAL,
  "YELLOW",
  HEAT_COLORS.YELLOW,
  "ORANGE",
  HEAT_COLORS.ORANGE,
  "RED",
  HEAT_COLORS.RED,
  HEAT_COLORS.NORMAL,
];

// Sequential purple shading by vulnerability score (choropleth-style).
const vulnerabilityColor: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "vulnerabilityScore"],
  ...VULNERABILITY_GRADIENT.flatMap(([stop, color]): [number, string] => [
    stop,
    color,
  ]),
] as unknown as ExpressionSpecification;

const labelField: ExpressionSpecification = ["get", "name"];

/** Add the region source and the heatmap, marker, and label layers (idempotent). */
export function addRegionLayers(map: MapLibreMap): void {
  if (map.getSource(SOURCE_ID)) return;

  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: toRegionFeatureCollection([]),
  });

  map.addLayer({
    id: HEAT_LAYER,
    type: "heatmap",
    source: SOURCE_ID,
    paint: {
      "heatmap-weight": heatmapWeight,
      "heatmap-intensity": heatmapIntensity,
      "heatmap-radius": heatmapRadius,
      "heatmap-color": heatmapColor,
      "heatmap-opacity": 0.6,
    },
  });

  map.addLayer({
    id: MARKERS_LAYER,
    type: "circle",
    source: SOURCE_ID,
    paint: {
      "circle-radius": circleRadius,
      "circle-color": circleColor,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.9,
    },
  });

  map.addLayer({
    id: LABELS_LAYER,
    type: "symbol",
    source: SOURCE_ID,
    layout: {
      "text-field": labelField,
      "text-size": 11,
      "text-offset": [0, 1.3],
      "text-anchor": "top",
      "text-font": ["Open Sans Regular"],
    },
    paint: {
      "text-color": "#111827",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.4,
    },
  });
}

/** Push the latest regions into the map source. */
export function updateRegionData(
  map: MapLibreMap,
  regions: RegionOverview[],
): void {
  const source = map.getSource(SOURCE_ID);
  if (source) {
    (source as GeoJSONSource).setData(toRegionFeatureCollection(regions));
  }
}

/** Recolour the markers by alert level or by vulnerability score (choropleth). */
export function setMarkerColorMode(
  map: MapLibreMap,
  mode: MarkerColorMode,
): void {
  if (!map.getLayer(MARKERS_LAYER)) return;
  map.setPaintProperty(
    MARKERS_LAYER,
    "circle-color",
    mode === "vulnerability" ? vulnerabilityColor : circleColor,
  );
}
