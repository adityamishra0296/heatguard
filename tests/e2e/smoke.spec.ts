import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end smoke test: walk the operator console through its core modules via
 * real sidebar navigation, asserting each page renders, and run an axe-core
 * accessibility scan on each. We fail only on `serious`/`critical` violations —
 * a strong proxy for a Lighthouse accessibility score in the 95+ range.
 */

const A11Y_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const BLOCKING_IMPACTS = new Set(["serious", "critical"]);

async function expectNoSeriousA11yViolations(
  page: Page,
  options: { exclude?: string } = {},
) {
  let builder = new AxeBuilder({ page }).withTags(A11Y_TAGS);
  if (options.exclude) builder = builder.exclude(options.exclude);
  const results = await builder.analyze();

  const blocking = results.violations.filter(
    (v) => v.impact && BLOCKING_IMPACTS.has(v.impact),
  );
  const summary = blocking
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
    .join("\n");
  expect(blocking, summary).toEqual([]);
}

test("console smoke: Overview → Map → Analytics → Alerts → Reports", async ({
  page,
}) => {
  // 1. Overview (dashboard)
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Live Monitoring" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expectNoSeriousA11yViolations(page);

  // 2. Map — navigate via the sidebar. MapLibre's own DOM is third-party, so we
  //    scan our chrome but exclude the map surface itself.
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.locator(".maplibregl-canvas")).toBeAttached({
    timeout: 20_000,
  });
  await expectNoSeriousA11yViolations(page, { exclude: ".maplibregl-map" });

  // 3. Analytics
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await expect(page).toHaveURL(/\/analytics/);
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
  await expectNoSeriousA11yViolations(page);

  // 4. Alerts
  await page.getByRole("link", { name: "Alerts", exact: true }).click();
  await expect(page).toHaveURL(/\/alerts$/);
  await expect(
    page.getByRole("heading", { name: "Early Warning & Alerts" }),
  ).toBeVisible();
  await expectNoSeriousA11yViolations(page);

  // 5. Reports
  await page.getByRole("link", { name: "Reports", exact: true }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(
    page.getByRole("button", { name: /Download PDF/ }),
  ).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});
