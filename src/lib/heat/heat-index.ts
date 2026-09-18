/**
 * Heat-index ("feels-like" temperature) calculation.
 *
 * Pure, framework-agnostic domain logic — no side effects — so it can be unit
 * tested and reused by the seed, the server, and the UI.
 */

/** Convert a temperature from degrees Celsius to degrees Fahrenheit. */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/** Convert a temperature from degrees Fahrenheit to degrees Celsius. */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

/** Clamp a relative-humidity percentage into the valid 0–100 range. */
function clampHumidity(humidityPct: number): number {
  if (Number.isNaN(humidityPct)) return 0;
  return Math.min(100, Math.max(0, humidityPct));
}

/** Round to a single decimal place. */
function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Compute the NOAA heat index in degrees Celsius.
 *
 * Implements the NOAA/NWS algorithm: Steadman's simple formula for cooler
 * conditions, the Rothfusz multiple-regression for hot conditions, and the
 * standard low- and high-humidity adjustments. The regression operates in
 * Fahrenheit; inputs and the result are in Celsius.
 *
 * @see https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
 *
 * @param tempC - Air (dry-bulb) temperature in degrees Celsius.
 * @param humidityPct - Relative humidity as a percentage (0–100).
 * @returns The heat index in degrees Celsius, rounded to one decimal place.
 */
export function computeHeatIndex(tempC: number, humidityPct: number): number {
  const rh = clampHumidity(humidityPct);
  const tempF = celsiusToFahrenheit(tempC);

  // Steadman's simple formula — the accepted heat index in cooler conditions.
  const simpleF = 0.5 * (tempF + 61 + (tempF - 68) * 1.2 + rh * 0.094);

  // Below ~80°F (averaged with the temperature), the simple formula applies.
  if ((simpleF + tempF) / 2 < 80) {
    return roundToTenth(fahrenheitToCelsius(simpleF));
  }

  // Rothfusz multiple-regression (valid for hot conditions).
  let heatIndexF =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * rh -
    0.22475541 * tempF * rh -
    0.00683783 * tempF * tempF -
    0.05481717 * rh * rh +
    0.00122874 * tempF * tempF * rh +
    0.00085282 * tempF * rh * rh -
    0.00000199 * tempF * tempF * rh * rh;

  // Low-humidity adjustment (hot, very dry air — e.g. arid Rajasthan).
  if (rh < 13 && tempF >= 80 && tempF <= 112) {
    heatIndexF -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
  }

  // High-humidity adjustment (warm, very humid air — e.g. coastal Odisha).
  if (rh > 85 && tempF >= 80 && tempF <= 87) {
    heatIndexF += ((rh - 85) / 10) * ((87 - tempF) / 5);
  }

  return roundToTenth(fahrenheitToCelsius(heatIndexF));
}
