import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the HeatGuard end-to-end smoke test.
 *
 * Uses the **system Google Chrome** (`channel: "chrome"`) so no Playwright
 * browser download is required — the same browser the PDF service relies on.
 * The web server is started from the production build; run `npm run build`
 * (and, on a fresh checkout, `npm run db:seed`) first.
 */
const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    channel: "chrome",
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run start",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
