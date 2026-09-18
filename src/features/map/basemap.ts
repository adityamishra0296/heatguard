/**
 * MapLibre basemap configuration.
 *
 * Uses CARTO's public **Positron** GL style — a free, **token-less** basemap
 * (vector tiles, glyphs, and sprites served by CARTO with permissive CORS),
 * suitable for development and demos.
 *
 * How to swap for production:
 *  - Point `BASEMAP_STYLE_URL` at a provider style with your API key, e.g.
 *      MapTiler: `https://api.maptiler.com/maps/streets-v2/style.json?key=YOUR_KEY`
 *      Stadia:   `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=YOUR_KEY`
 *  - Or self-host OpenMapTiles and reference your own `style.json`.
 *  - For a dark basemap that matches dark mode, use CARTO "dark-matter":
 *      `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`
 *
 * Note: any basemap needs network access for tiles. Region markers/data come
 * from the local API and still render even if basemap tiles fail to load.
 */
export const BASEMAP_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** Approximate geographic centre of India (lng, lat). */
export const INDIA_CENTER: [number, number] = [80.9, 22.5];

/** Bounding box roughly framing mainland India: [[west, south], [east, north]]. */
export const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [67, 6],
  [98, 37],
];
