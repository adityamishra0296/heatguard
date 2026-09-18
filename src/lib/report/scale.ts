/**
 * Pure axis/scale helpers for the report's server-rendered SVG figures.
 * Kept framework-free and unit-tested so figure geometry is deterministic.
 */

/**
 * Round `value` up to a "nice" axis maximum — the smallest number of the form
 * 1, 2, 2.5, or 5 × 10ⁿ that is ≥ `value`. Always returns at least 1 so an
 * all-zero series still yields a usable axis.
 */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = Math.pow(10, exponent);
  const fraction = value / magnitude;
  let niceFraction: number;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 2.5) niceFraction = 2.5;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * magnitude;
}

/** Map `value` in [0, domainMax] to a pixel length in [0, rangePx] (clamped). */
export function scaleLinear(
  value: number,
  domainMax: number,
  rangePx: number,
): number {
  if (domainMax <= 0) return 0;
  const ratio = value / domainMax;
  const clamped = Math.max(0, Math.min(1, ratio));
  return clamped * rangePx;
}

/**
 * Project a set of geographic points into a `width`×`height` box with padding,
 * inverting latitude so north is up. Returns pixel coordinates aligned to the
 * input order. A degenerate span (all points identical on an axis) is centred.
 */
export function projectPoints(
  points: { latitude: number; longitude: number }[],
  width: number,
  height: number,
  padding: number,
): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat;
  const spanLng = maxLng - minLng;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  return points.map((p) => {
    const fx = spanLng === 0 ? 0.5 : (p.longitude - minLng) / spanLng;
    const fy = spanLat === 0 ? 0.5 : (p.latitude - minLat) / spanLat;
    return {
      x: padding + fx * innerW,
      y: padding + (1 - fy) * innerH, // invert: higher latitude → smaller y
    };
  });
}
