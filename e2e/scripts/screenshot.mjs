// Run with: node e2e/scripts/screenshot.mjs
// Captures mockup (via interaction) and live app side by side for visual diffing.
import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VISUAL_DIR = path.resolve(__dirname, "../visual");
fs.mkdirSync(VISUAL_DIR, { recursive: true });

const MOCKUP_FILE = `file://${path.resolve(__dirname, "../../ORD Explorer (standalone) v0.4.html")}`;
const APP_BASE = "http://localhost:5174";

async function settle(page, ms = 1500) {
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(VISUAL_DIR, `${name}.png`), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

const browser = await chromium.launch({
  args: ["--disable-web-security", "--allow-file-access-from-files"],
});

// ── MOCKUP ──────────────────────────────────────────────────────────────────
console.log("\n[mockup] connections");
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(MOCKUP_FILE, { waitUntil: "load", timeout: 30000 });
  await settle(page, 2000);
  await shot(page, "mockup-connections");

  // Click into ORD Reference Application explorer
  console.log("[mockup] navigating to explorer via 'Open explorer'...");
  await page.getByText("Open explorer").first().click();
  await settle(page, 2000);
  await shot(page, "mockup-connection-detail");

  // Click "Explore" on the System Version perspective to enter the ORD Explorer
  console.log("[mockup] clicking Explore on System Version...");
  const exploreBtn = page.getByRole("button", { name: /Explore/i }).first();
  if (await exploreBtn.isVisible()) {
    await exploreBtn.click();
    await settle(page, 2000);
  }
  await shot(page, "mockup-explorer-dashboard");

  // Navigate to API Resources list — click the API Resources dashboard card
  const apiCard = page.locator("[data-testid], .dashboard-card, button, a").filter({ hasText: /API Resources/i }).first();
  if (await apiCard.isVisible()) {
    await apiCard.click();
    await settle(page, 1000);
  }
  await shot(page, "mockup-resource-list-api");

  // Navigate to Packages — look in sidebar or dashboard
  const packagesLink = page.locator("nav a, nav button, [role=navigation] button, [role=navigation] a, aside a, aside button").filter({ hasText: /^Packages$/i }).first();
  if (await packagesLink.isVisible()) {
    await packagesLink.click();
    await settle(page, 1000);
  } else {
    // Try clicking a Packages card
    const packagesCard = page.locator("button, a, div[role=button]").filter({ hasText: /^Packages$/i }).first();
    if (await packagesCard.isVisible()) { await packagesCard.click(); await settle(page, 1000); }
  }
  await shot(page, "mockup-packages");

  // Navigate to Consumption Bundles
  const cbLink = page.locator("nav a, nav button, aside a, aside button, button, a").filter({ hasText: /Consumption Bundles/i }).first();
  if (await cbLink.isVisible()) {
    await cbLink.click();
    await settle(page, 1000);
  }
  await shot(page, "mockup-consumption-bundles");

  await page.close();
}

// ── APP ──────────────────────────────────────────────────────────────────────
console.log("\n[app] connections");
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${APP_BASE}/connections`, { waitUntil: "networkidle", timeout: 20000 });
  await settle(page, 500);
  await shot(page, "app-connections");

  // Navigate into the explorer
  await page.goto(`${APP_BASE}/connections/ref-app/documents/system-version`, { waitUntil: "networkidle", timeout: 20000 });
  await settle(page, 500);
  await shot(page, "app-explorer-dashboard");

  // API Resources list — click the API Resources stat card on the dashboard
  const apiCard = page.locator('[data-testid="resource-type-card-api-resources"]');
  if (await apiCard.isVisible()) {
    await apiCard.click();
    await settle(page, 800);
  }
  await shot(page, "app-resource-list-api");

  // Packages — click sidebar Packages link
  await page.goto(`${APP_BASE}/connections/ref-app/documents/system-version`, { waitUntil: "networkidle", timeout: 20000 });
  await settle(page, 500);
  const packagesBtn = page.locator("aside").getByRole("button", { name: /^Packages$/i }).first();
  if (await packagesBtn.isVisible()) { await packagesBtn.click(); await settle(page, 800); }
  await shot(page, "app-packages");

  // Consumption Bundles — click sidebar Bundles link
  await page.goto(`${APP_BASE}/connections/ref-app/documents/system-version`, { waitUntil: "networkidle", timeout: 20000 });
  await settle(page, 500);
  const bundlesBtn = page.locator("aside").getByRole("button", { name: /Bundles/i }).first();
  if (await bundlesBtn.isVisible()) { await bundlesBtn.click(); await settle(page, 800); }
  await shot(page, "app-consumption-bundles");

  await page.close();
}

await browser.close();
console.log(`\nAll screenshots saved to e2e/visual/`);
