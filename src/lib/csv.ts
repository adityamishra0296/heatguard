/**
 * Minimal, dependency-free CSV helpers (RFC 4180) that open cleanly in Excel and
 * Google Sheets: interior quotes doubled, fields with commas/quotes/newlines
 * quoted, CRLF line endings, and an optional UTF-8 BOM so non-ASCII text renders
 * correctly in Excel.
 */

type CsvValue = string | number | boolean | null | undefined;

/** UTF-8 byte-order mark; prompts Excel to decode the file as UTF-8. */
const BOM = "﻿";

/** Escape a single CSV cell. */
export function escapeCsvField(value: CsvValue): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Build a CSV document from a header row and data rows. */
export function toCsv(
  headers: string[],
  rows: CsvValue[][],
  options: { bom?: boolean } = {},
): string {
  const { bom = true } = options;
  const encodeRow = (row: CsvValue[]): string =>
    row.map(escapeCsvField).join(",");
  const content = [encodeRow(headers), ...rows.map(encodeRow)].join("\r\n");
  return `${bom ? BOM : ""}${content}\r\n`;
}

/** Format an ISO timestamp as `YYYY-MM-DD HH:MM` (UTC) for a CSV cell. */
export function csvDateUTC(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number): string => String(value).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    ` ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  );
}
