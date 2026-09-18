/**
 * Deterministic, locale-independent formatting helpers.
 *
 * Dates are formatted in UTC and numbers are grouped manually so that server-
 * and client-rendered output always match (avoiding React hydration mismatches).
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const pad2 = (value: number): string => value.toString().padStart(2, "0");

/** Format an ISO timestamp as e.g. `30 Jun 2026, 14:30 UTC`. */
export function formatDateTimeUTC(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = pad2(date.getUTCDate());
  const month = MONTHS[date.getUTCMonth()];
  const time = `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  return `${day} ${month} ${date.getUTCFullYear()}, ${time} UTC`;
}

/** Format an ISO timestamp as a date only, e.g. `30 Jun 2026`. */
export function formatDateUTC(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${pad2(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Format an ISO timestamp as a short day + month, e.g. `2 May` (UTC). */
export function formatDayMonth(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

/** Format an integer with thousands separators, e.g. `12,400,000`. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
