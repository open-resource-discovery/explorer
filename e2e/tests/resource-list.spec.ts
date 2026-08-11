import { test, expect } from "../fixtures/explorer";

// ordIds from the sample ORD document (sampleOrdDocument.ts)
const REST_API = "sap.xref:apiResource:astronomy:v1";
const ODATA_V4_API = "sap.xref:apiResource:billing:v2";
const INTERNAL_API = "sap.xref:apiResource:configuration:v1";
const DEPRECATED_API = "sap.xref:apiResource:configuration:v1";

test.describe("Resource List", () => {
  test.beforeEach(async ({ explorer }) => {
    await explorer.goto();
    await explorer.clickResourceTypeCard("apiResources");
  });

  test("resource list is visible after clicking API Resources card", async ({
    page,
  }) => {
    await expect(page.locator("[data-testid='resource-list']")).toBeVisible();
  });

  test("API resource cards are visible in the flat list", async ({ page }) => {
    await expect(
      page.locator(`[data-testid='resource-card-${REST_API}']`),
    ).toBeVisible();
    await expect(
      page.locator(`[data-testid='resource-card-${ODATA_V4_API}']`),
    ).toBeVisible();
  });

  test("protocol badge renders correctly", async ({ page }) => {
    const row = page.locator(`[data-testid='resource-card-${REST_API}']`);
    await expect(row).toContainText("REST");
  });

  test("OData v4 protocol badge renders correctly", async ({ page }) => {
    const row = page.locator(`[data-testid='resource-card-${ODATA_V4_API}']`);
    await expect(row).toContainText("OData v4");
  });

  test("visibility badge appears for internal resources", async ({ page }) => {
    const row = page.locator(`[data-testid='resource-card-${INTERNAL_API}']`);
    await expect(row).toContainText("internal");
  });

  test("deprecated release status badge appears on deprecated resources", async ({
    page,
  }) => {
    const row = page.locator(`[data-testid='resource-card-${DEPRECATED_API}']`);
    await expect(row).toContainText("Deprecated");
  });
});
