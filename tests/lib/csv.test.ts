import { describe, expect, it } from "vitest";

import { csvDateUTC, escapeCsvField, toCsv } from "@/lib/csv";

describe("escapeCsvField", () => {
  it("leaves simple values unquoted", () => {
    expect(escapeCsvField("hello")).toBe("hello");
    expect(escapeCsvField(42)).toBe("42");
    expect(escapeCsvField(null)).toBe("");
  });

  it("quotes and escapes commas, quotes, and newlines", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("builds CRLF-delimited rows with a header and a UTF-8 BOM", () => {
    const csv = toCsv(
      ["a", "b"],
      [
        [1, "x"],
        [2, "y,z"],
      ],
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM
    const withoutBom = csv.slice(1);
    expect(withoutBom).toBe('a,b\r\n1,x\r\n2,"y,z"\r\n');
  });

  it("can omit the BOM", () => {
    const csv = toCsv(["a"], [["1"]], { bom: false });
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    expect(csv).toBe("a\r\n1\r\n");
  });
});

describe("csvDateUTC", () => {
  it("formats an ISO timestamp in UTC", () => {
    expect(csvDateUTC("2026-06-30T00:00:00.000Z")).toBe("2026-06-30 00:00");
    expect(csvDateUTC("2026-01-05T14:30:00.000Z")).toBe("2026-01-05 14:30");
  });

  it("returns empty for invalid input", () => {
    expect(csvDateUTC("nope")).toBe("");
  });
});
