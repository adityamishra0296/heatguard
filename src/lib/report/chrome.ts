/**
 * Locate a Chrome/Chromium executable for server-side PDF generation.
 *
 * `puppeteer-core` does not bundle a browser, so the PDF route relies on a
 * system install. This resolver checks environment overrides first, then common
 * install paths across macOS and Linux. When nothing is found the caller
 * degrades gracefully to the browser-based print fallback.
 */

import { existsSync } from "node:fs";

const CANDIDATE_PATHS: (string | undefined)[] = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
];

/** Return the first existing browser executable path, or `null` if none exist. */
export function resolveChromePath(): string | null {
  for (const candidate of CANDIDATE_PATHS) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}
