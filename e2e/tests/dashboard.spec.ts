import { test, expect } from "../fixtures/explorer";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ explorer }) => {
    await explorer.goto();
  });

  test("shows only resource type cards with count > 0", async ({ page }) => {
    // sample doc: api=4, event=2, entityType=2, dataProduct=1, integrationDependency=1, capability=1, agents=2
    await expect(
      page.locator("[data-testid^='resource-type-card-']"),
    ).toHaveCount(7);
  });

  test("API Resources card shows count 4 and is enabled", async ({ page }) => {
    const card = page.locator(
      "[data-testid='resource-type-card-api-resources']",
    );
    await expect(card).toBeEnabled();
    await expect(card).toContainText("4");
  });

  test("Event Resources card shows count 2 and is enabled", async ({
    page,
  }) => {
    const card = page.locator(
      "[data-testid='resource-type-card-event-resources']",
    );
    await expect(card).toBeEnabled();
    await expect(card).toContainText("2");
  });

  test("dashboard and resource list are both visible on load", async ({
    explorer,
  }) => {
    await expect(explorer.dashboard).toBeVisible();
    await expect(explorer.resourceList).toBeVisible();
  });

  test("clicking API Resources card shows the API resource list", async ({
    explorer,
  }) => {
    await explorer.clickResourceTypeCard("apiResources");
    await expect(explorer.resourceList).toBeVisible();
  });

  test("clicking Event Resources card shows the events resource list", async ({
    explorer,
  }) => {
    await explorer.clickResourceTypeCard("eventResources");
    await expect(explorer.resourceList).toBeVisible();
  });
});
