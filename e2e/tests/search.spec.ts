import { test, expect } from "../fixtures/explorer";

// ordIds from the sample ORD document (sampleOrdDocument.ts)
const BILLING_API = "sap.xref:apiResource:billing:v2";
const SETTINGS_API = "sap.xref:apiResource:settings:v1";

test.describe("Search", () => {
  test.beforeEach(async ({ explorer }) => {
    await explorer.goto();
    await explorer.clickResourceTypeCard("apiResources");
  });

  test("typing a query filters to matching resources", async ({
    explorer,
    page,
  }) => {
    await explorer.searchInput.fill("billing");
    await expect(
      page.locator(`[data-testid='resource-card-${BILLING_API}']`),
    ).toBeVisible();
  });

  test("match characters are highlighted in the result row", async ({
    explorer,
    page,
  }) => {
    await explorer.searchInput.fill("Billing");
    const row = page.locator(`[data-testid='resource-card-${BILLING_API}']`);
    await expect(row.locator("mark")).toBeVisible();
  });

  test("search matches on ordId as well as title", async ({
    explorer,
    page,
  }) => {
    // "settings" is in the ordId
    await explorer.searchInput.fill("settings");
    await expect(
      page.locator(`[data-testid='resource-card-${SETTINGS_API}']`),
    ).toBeVisible();
  });

  test("no results message appears for unmatched query", async ({
    explorer,
    page,
  }) => {
    await explorer.searchInput.fill("zzz");
    await expect(page.getByText(/No results for/)).toBeVisible();
  });

  test("clearing the search shows all resources again", async ({
    explorer,
    page,
  }) => {
    await explorer.searchInput.fill("billing");
    await expect(
      page.locator(`[data-testid='resource-card-${BILLING_API}']`),
    ).toBeVisible();
    await expect(
      page.locator(`[data-testid='resource-card-${SETTINGS_API}']`),
    ).not.toBeVisible();

    await explorer.searchInput.clear();
    await expect(
      page.locator(`[data-testid='resource-card-${SETTINGS_API}']`),
    ).toBeVisible();
  });

  test("search is case-insensitive", async ({ explorer, page }) => {
    await explorer.searchInput.fill("BILLING");
    await expect(
      page.locator(`[data-testid='resource-card-${BILLING_API}']`),
    ).toBeVisible();
  });
});
