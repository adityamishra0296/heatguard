import { describe, expect, it } from "vitest";

import {
  celsiusToFahrenheit,
  computeHeatIndex,
  fahrenheitToCelsius,
} from "@/lib/heat/heat-index";

describe("temperature conversions", () => {
  it("converts Celsius to Fahrenheit", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6, 1);
  });

  it("round-trips through Fahrenheit", () => {
    expect(fahrenheitToCelsius(celsiusToFahrenheit(42))).toBeCloseTo(42, 5);
  });
});

describe("computeHeatIndex", () => {
  it("matches the NOAA reference: 90°F / 70% RH ≈ 105°F (≈40.6°C)", () => {
    const hi = computeHeatIndex(32.22, 70);
    expect(fahrenheitToCelsius(105)).toBeCloseTo(40.6, 1);
    expect(hi).toBeGreaterThan(39);
    expect(hi).toBeLessThan(42);
  });

  it("returns near the air temperature in cool, dry conditions", () => {
    const hi = computeHeatIndex(20, 40);
    expect(hi).toBeGreaterThan(16);
    expect(hi).toBeLessThan(23);
  });

  it("increases with humidity at a fixed hot temperature", () => {
    expect(computeHeatIndex(38, 70)).toBeGreaterThan(computeHeatIndex(38, 20));
  });

  it("increases with temperature at a fixed humidity", () => {
    expect(computeHeatIndex(42, 55)).toBeGreaterThan(computeHeatIndex(34, 55));
  });

  it("reaches the extreme-danger range for very hot, humid conditions", () => {
    expect(computeHeatIndex(45, 55)).toBeGreaterThan(48);
  });

  // --- Edge cases -----------------------------------------------------------

  it("handles 0% humidity (finite, at/below air temperature)", () => {
    const hi = computeHeatIndex(40, 0);
    expect(Number.isFinite(hi)).toBe(true);
    // Bone-dry air feels no hotter than the actual temperature.
    expect(hi).toBeLessThanOrEqual(41);
  });

  it("handles 100% humidity (finite, well above air temperature)", () => {
    const hi = computeHeatIndex(40, 100);
    expect(Number.isFinite(hi)).toBe(true);
    expect(hi).toBeGreaterThan(40);
  });

  it("handles extreme heat (50°C) across the humidity range", () => {
    for (const rh of [0, 25, 50, 75, 100]) {
      const hi = computeHeatIndex(50, rh);
      expect(Number.isFinite(hi)).toBe(true);
    }
    // More humidity never lowers the heat index at extreme temperature.
    expect(computeHeatIndex(50, 100)).toBeGreaterThan(computeHeatIndex(50, 0));
  });

  it("handles cold temperatures without throwing", () => {
    expect(Number.isFinite(computeHeatIndex(-5, 50))).toBe(true);
    expect(Number.isFinite(computeHeatIndex(0, 100))).toBe(true);
  });

  it("clamps out-of-range humidity instead of producing NaN", () => {
    expect(computeHeatIndex(40, 150)).toBe(computeHeatIndex(40, 100));
    expect(computeHeatIndex(40, -20)).toBe(computeHeatIndex(40, 0));
  });
});
