/**
 * Screenshot script: captures mockup (port 8080) and live app (port 5174) side by side.
 * Usage: npx playwright test e2e/scripts/screenshot.ts --config e2e/scripts/screenshot.config.ts
 * Or run via: npm run screenshot (once added to package.json)
 */
import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VISUAL_DIR = path.resolve(__dirname, "../visual");

const MOCKUP_BASE = "http://localhost:8080";
const APP_BASE = "http://localhost:5174";

// Pages to capture: [label, mockupPath, appPath]
const PAGES: [string, string, string][] = [
  ["dashboard", "/", "/connections/ref-app/documents/system-version"],
  [
    "resource-list",
    "/#/resourceList/apiResources",
    "/connections/ref-app/documents/system-version#/resourceList/apiResources",
  ],
  [
    "resource-detail",
    "/#/resourceList/apiResources/sap.s4:apiBusinessPartner:v1",
    "/connections/ref-app/documents/system-version#/resourceList/apiResources/sap.s4:apiBusinessPartner:v1",
  ],
  [
    "packages",
    "/#/packages",
    "/connections/ref-app/documents/system-version#/packages",
  ],
  [
    "consumption-bundles",
    "/#/consumptionBundles",
    "/connections/ref-app/documents/system-version#/consumptionBundles",
  ],
];

async function waitForAppReady(page: import("@playwright/test").Page) {
  // Wait for any loading spinners to disappear and content to render
  await page
    .waitForLoadState("networkidle", { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(1000);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  for (const [label, mockupPath, appPath] of PAGES) {
    console.log(`Screenshotting: ${label}`);

    // Mockup
    const mockupPage = await context.newPage();
    try {
      await mockupPage.goto(`${MOCKUP_BASE}${mockupPath}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForAppReady(mockupPage);
      await mockupPage.screenshot({
        path: path.join(VISUAL_DIR, `mockup-${label}.png`),
        fullPage: false,
      });
      console.log(`  ✓ mockup-${label}.png`);
    } catch (e) {
      console.error(`  ✗ mockup-${label}: ${e}`);
    } finally {
      await mockupPage.close();
    }

    // Live app
    const appPage = await context.newPage();
    try {
      await appPage.goto(`${APP_BASE}${appPath}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForAppReady(appPage);
      await appPage.screenshot({
        path: path.join(VISUAL_DIR, `app-${label}.png`),
        fullPage: false,
      });
      console.log(`  ✓ app-${label}.png`);
    } catch (e) {
      console.error(`  ✗ app-${label}: ${e}`);
    } finally {
      await appPage.close();
    }
  }

  await browser.close();
  console.log(`\nScreenshots saved to e2e/visual/`);
}

main().catch(console.error);
