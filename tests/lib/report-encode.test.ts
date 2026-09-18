import { describe, expect, it } from "vitest";

import { decodeReportOptions, encodeReportOptions } from "@/lib/report/encode";
import type { ReportOptions } from "@/lib/report/types";

const sample: ReportOptions = {
  recommendations: [
    {
      id: "a",
      title: "Greenery",
      detail: "Plant trees, expand shade — cover 30%.",
    },
    { id: "b", title: "Water", detail: "Public drinking-water points." },
  ],
  execSummary: 'Custom summary with a comma, quotes "x", and unicode °C.',
};

describe("encode/decode report options", () => {
  it("round-trips options through a URL-safe string", () => {
    const encoded = encodeReportOptions(sample);
    expect(encoded).not.toMatch(/[+/=]/); // base64url: no +, /, or padding
    expect(decodeReportOptions(encoded)).toEqual(sample);
  });

  it("returns null for absent input", () => {
    expect(decodeReportOptions(null)).toBeNull();
    expect(decodeReportOptions(undefined)).toBeNull();
    expect(decodeReportOptions("")).toBeNull();
  });

  it("returns null for malformed base64/JSON", () => {
    expect(decodeReportOptions("%%%not-base64%%%")).toBeNull();
  });

  it("returns null when the decoded shape fails validation", () => {
    const badShape = Buffer.from(
      JSON.stringify({ recommendations: [{ id: "x" }] }),
      "utf-8",
    ).toString("base64url");
    expect(decodeReportOptions(badShape)).toBeNull();
  });
});
