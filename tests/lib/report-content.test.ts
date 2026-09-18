import { describe, expect, it } from "vitest";

import { DEFAULT_RECOMMENDATIONS, REPORT_CHAPTERS } from "@/lib/report/content";

const EXPECTED_TITLES = [
  "Introduction to Heat Waves",
  "Literature Review",
  "Study Area Profile",
  "Research Methodology",
  "Heat Wave Response Analysis",
  "Recovery Measures",
  "Future Challenges",
  "Role of Technology",
  "Findings and Recommendations",
  "Conclusion",
];

describe("REPORT_CHAPTERS", () => {
  it("defines the ten chapters in order with sequential ids", () => {
    expect(REPORT_CHAPTERS).toHaveLength(10);
    expect(REPORT_CHAPTERS.map((c) => c.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(REPORT_CHAPTERS.map((c) => c.title)).toEqual(EXPECTED_TITLES);
  });

  it("marks the data-driven chapters and gives every chapter narrative text", () => {
    const dataKeys = REPORT_CHAPTERS.filter((c) => c.kind === "data").map(
      (c) => c.key,
    );
    expect(dataKeys).toEqual([
      "study-area",
      "response",
      "recovery",
      "findings",
    ]);
    for (const chapter of REPORT_CHAPTERS) {
      expect(chapter.paragraphs.length).toBeGreaterThan(0);
      expect(chapter.paragraphs.every((p) => p.trim().length > 0)).toBe(true);
    }
  });
});

describe("DEFAULT_RECOMMENDATIONS", () => {
  it("pre-fills the seven sample recommendations with unique ids and content", () => {
    expect(DEFAULT_RECOMMENDATIONS).toHaveLength(7);
    const ids = DEFAULT_RECOMMENDATIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(7);
    expect(ids).toEqual(
      expect.arrayContaining([
        "urban-greenery",
        "heat-action-plans",
        "cool-roof",
        "public-water",
        "ai-forecasting",
        "awareness",
        "coordination",
      ]),
    );
    for (const rec of DEFAULT_RECOMMENDATIONS) {
      expect(rec.title.trim().length).toBeGreaterThan(0);
      expect(rec.detail.trim().length).toBeGreaterThan(0);
    }
  });
});
