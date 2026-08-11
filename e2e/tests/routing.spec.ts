import { test, expect } from "../fixtures/base";

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript((origin: string) => {
    const conn = {
      id: "local-dev",
      name: "Local Dev Server",
      ordConfigUrl: origin + "/ord-config.json",
      type: "system-endpoint",
      auth: "none",
    };
    localStorage.setItem("explorer:connections", JSON.stringify([conn]));
  }, baseURL ?? "http://localhost:5175");
});

test.describe("Routing", () => {
  test("/ redirects to /connections", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/connections$/);
  });

  test("/connections renders the connections list", async ({ page }) => {
    await page.goto("/connections");
    await expect(
      page.getByRole("heading", { name: "Connections" }),
    ).toBeVisible();
  });

  test("/connections/$id renders the connection detail page", async ({
    page,
  }) => {
    await page.goto("/connections/local-dev");
    await expect(
      page.getByRole("heading", { name: "Local Dev Server" }),
    ).toBeVisible();
  });

  test("/connections/$id/documents/$docId renders the ORD explorer", async ({
    page,
  }) => {
    await page.route("**/.well-known/open-resource-discovery", (route) =>
      route.fulfill({
        json: {
          openResourceDiscoveryV1: {
            documents: [
              {
                url: "/ord/v1/documents/local",
                accessStrategies: [{ type: "open" }],
              },
            ],
          },
        },
      }),
    );
    await page.route("**/ord/v1/documents/local", (route) =>
      route.fulfill({
        json: { perspective: "system-instance", apiResources: [] },
      }),
    );
    await page.goto("/connections/local-dev/documents/system-instance");
    await expect(page.locator("[data-testid='dashboard']")).toBeVisible();
  });
});
