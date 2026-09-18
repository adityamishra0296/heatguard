"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  type FilterSpecification,
} from "maplibre-gl";
import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchRegionsOverview } from "@/lib/api-client";
import type { RegionOverview } from "@/server/regions";

import { BASEMAP_STYLE_URL, INDIA_BOUNDS, INDIA_CENTER } from "./basemap";
import { MapControls } from "./map-controls";
import { MapLegend } from "./map-legend";
import {
  addRegionLayers,
  setMarkerColorMode,
  updateRegionData,
  HEAT_LAYER,
  LABELS_LAYER,
  MARKERS_LAYER,
} from "./map-layers";
import { RegionPanel } from "./region-panel";

declare global {
  interface Window {
    /** The active MapLibre instance, exposed for debugging and e2e tests. */
    heatGuardMap?: MapLibreMap;
  }
}

type Status = "loading" | "ready" | "error";

const MARKER_LAYERS = [MARKERS_LAYER, LABELS_LAYER];
const ALL_LAYERS = [MARKERS_LAYER, LABELS_LAYER, HEAT_LAYER];

/** Self-contained interactive heat map: fetches regions, renders MapLibre layers,
 *  and manages selection, toggles, and loading/error states. */
export function HeatMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const regionsRef = useRef<RegionOverview[]>([]);
  const loadedRef = useRef(false);

  const [status, setStatus] = useState<Status>("loading");
  const [regions, setRegions] = useState<RegionOverview[]>([]);
  const [selected, setSelected] = useState<RegionOverview | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [alertOnly, setAlertOnly] = useState(false);
  const [vulnerabilityShading, setVulnerabilityShading] = useState(false);

  // Fetch regions. `status` starts as "loading"; the retry button re-sets it,
  // so this only sets state asynchronously (after the request resolves).
  const loadData = useCallback(async () => {
    try {
      const data = await fetchRegionsOverview();
      regionsRef.current = data;
      setRegions(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Fetch on mount. State is only set after the async request resolves, not
    // synchronously within the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  // Initialise the map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: BASEMAP_STYLE_URL,
      center: INDIA_CENTER,
      zoom: 3.6,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(
      new NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    map.on("load", () => {
      loadedRef.current = true;
      window.heatGuardMap = map;
      addRegionLayers(map);
      updateRegionData(map, regionsRef.current);
      map.fitBounds(INDIA_BOUNDS, { padding: 48, duration: 0 });

      map.on("click", MARKERS_LAYER, (event) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id !== "string") return;
        setSelected(regionsRef.current.find((r) => r.id === id) ?? null);
      });
      map.on("mouseenter", MARKERS_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MARKERS_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      loadedRef.current = false;
      if (window.heatGuardMap === map) window.heatGuardMap = undefined;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Push data to the map when it changes (once the style is ready).
  useEffect(() => {
    regionsRef.current = regions;
    const map = mapRef.current;
    if (map && loadedRef.current) updateRegionData(map, regions);
  }, [regions]);

  // Marker + label visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    for (const id of MARKER_LAYERS) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(
          id,
          "visibility",
          showMarkers ? "visible" : "none",
        );
      }
    }
  }, [showMarkers]);

  // Heatmap visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (map.getLayer(HEAT_LAYER)) {
      map.setLayoutProperty(
        HEAT_LAYER,
        "visibility",
        showHeatmap ? "visible" : "none",
      );
    }
  }, [showHeatmap]);

  // Marker colour mode: alert level vs vulnerability choropleth.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    setMarkerColorMode(map, vulnerabilityShading ? "vulnerability" : "level");
  }, [vulnerabilityShading]);

  // Alert-only filter (Orange/Red).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const filter: FilterSpecification | null = alertOnly
      ? ["in", ["get", "level"], ["literal", ["ORANGE", "RED"]]]
      : null;
    for (const id of ALL_LAYERS) {
      if (map.getLayer(id)) map.setFilter(id, filter);
    }
  }, [alertOnly]);

  return (
    <div className="relative h-[calc(100svh_-_3.5rem)] w-full overflow-hidden">
      {/* size-full (not absolute): MapLibre forces position:relative on the
          container, which would break `inset-0` sizing. */}
      <div ref={containerRef} className="size-full" />

      {/* Overlays (transparent to map interaction except over the cards). */}
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-3 top-3 z-10">
          <MapControls
            toggles={[
              {
                id: "markers",
                label: "Markers",
                checked: showMarkers,
                onChange: setShowMarkers,
              },
              {
                id: "heatmap",
                label: "Heatmap",
                checked: showHeatmap,
                onChange: setShowHeatmap,
              },
              {
                id: "alert",
                label: "Alert-only (Orange / Red)",
                checked: alertOnly,
                onChange: setAlertOnly,
              },
              {
                id: "vulnerability",
                label: "Vulnerability shading",
                checked: vulnerabilityShading,
                onChange: setVulnerabilityShading,
              },
            ]}
          />
        </div>

        <div className="pointer-events-auto absolute bottom-3 left-3 z-10">
          <MapLegend
            colorMode={vulnerabilityShading ? "vulnerability" : "level"}
          />
        </div>

        {selected ? (
          <div className="pointer-events-auto absolute right-3 top-3 z-10">
            <RegionPanel region={selected} onClose={() => setSelected(null)} />
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="pointer-events-auto absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-1.5 text-sm shadow-md backdrop-blur">
              <span
                className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
                aria-hidden
              />
              Loading region data…
            </div>
          </div>
        ) : null}

        {status === "error" ? (
          <div
            role="alert"
            className="pointer-events-auto absolute left-1/2 top-3 z-20 -translate-x-1/2"
          >
            <div className="flex max-w-xs flex-col items-center gap-2 rounded-lg border border-border bg-background/95 p-4 text-center text-sm shadow-md backdrop-blur">
              <TriangleAlert className="size-6 text-destructive" aria-hidden />
              <p className="font-medium">Couldn’t load region data</p>
              <p className="text-muted-foreground">
                The basemap still works; region markers need the API.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setStatus("loading");
                  void loadData();
                }}
              >
                <RotateCw className="size-4" aria-hidden />
                Retry
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
