import { describe, expect, it } from "vitest";

import { formatDateTimeUTC, formatDateUTC, formatNumber } from "@/lib/format";

describe("formatDateTimeUTC", () => {
  it("formats an ISO timestamp in UTC", () => {
    expect(formatDateTimeUTC("2026-06-30T00:00:00.000Z")).toBe(
      "30 Jun 2026, 00:00 UTC",
    );
    expect(formatDateTimeUTC("2026-01-05T14:30:00.000Z")).toBe(
      "05 Jan 2026, 14:30 UTC",
    );
  });

  it("returns an em dash for invalid input", () => {
    expect(formatDateTimeUTC("not-a-date")).toBe("—");
  });
});

describe("formatDateUTC", () => {
  it("formats a date only", () => {
    expect(formatDateUTC("2026-06-30T00:00:00.000Z")).toBe("30 Jun 2026");
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(12_400_000)).toBe("12,400,000");
    expect(formatNumber(880_000)).toBe("880,000");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(0)).toBe("0");
  });

  it("rounds and handles non-finite values", () => {
    expect(formatNumber(1234.6)).toBe("1,235");
    expect(formatNumber(Number.NaN)).toBe("—");
  });
});
