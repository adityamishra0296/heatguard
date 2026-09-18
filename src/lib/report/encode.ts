/**
 * Encode/decode the user-editable report options to a URL-safe string so the
 * console can pass edits to the standalone print route and the PDF generator.
 *
 * Decoding is defensive: the encoded value arrives from a URL, so it is parsed
 * inside a try/catch and validated with zod. Any malformed input yields `null`,
 * and callers fall back to the defaults.
 */

import { z } from "zod";

import type { ReportOptions } from "./types";

const recommendationSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().max(200),
  detail: z.string().max(2000),
});

export const reportOptionsSchema = z.object({
  recommendations: z.array(recommendationSchema).max(50),
  execSummary: z.string().max(4000).optional(),
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Base64url-encode raw bytes (isomorphic: browser `btoa` or Node `Buffer`). */
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1)
    binary += String.fromCharCode(bytes[i]);
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode a base64url string back to raw bytes (isomorphic). */
function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary =
    typeof atob === "function"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encode report options for use as a URL query parameter. */
export function encodeReportOptions(options: ReportOptions): string {
  return bytesToBase64Url(encoder.encode(JSON.stringify(options)));
}

/** Decode + validate report options, or `null` if absent/malformed. */
export function decodeReportOptions(
  encoded: string | null | undefined,
): ReportOptions | null {
  if (!encoded) return null;
  try {
    const json = decoder.decode(base64UrlToBytes(encoded));
    const parsed = reportOptionsSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
