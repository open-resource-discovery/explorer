import { test, expect } from "../fixtures/explorer";

// ordId from the sample ORD document (sampleOrdDocument.ts). Its primary
// definition is astronomy-v1.oas3.json, served from public/ as a real static
// file — so this test exercises the FULL fetch of a relative definition URL.
const REST_API = "sap.xref:apiResource:astronomy:v1";

test.describe("Definition Preview", () => {
  // This is the only test that fetches a resource definition end-to-end against
  // a real static file. It guards the URL-resolution chain that repeatedly
  // regressed on non-root deploy bases (gh-pages / pr-preview): if a relative
  // definition URL resolves to the wrong path, the fetch 404s and the modal
  // shows "Failed to load definition from …" instead of the rendered content.
  test("previewing a resource definition loads and renders its content", async ({
    explorer,
    page,
  }) => {
    await explorer.goto();
    await explorer.clickResourceTypeCard("apiResources");

    await page.locator(`[data-testid='resource-card-${REST_API}']`).click();

    const previewButton = page.locator(
      "[data-testid='preview-definition-button']",
    );
    await previewButton.waitFor({ timeout: 5000 });
    await previewButton.click();

    // The definition must render — NOT fall back to the fetch-error message.
    await expect(
      page.locator("[data-testid='definition-content']"),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Failed to load definition from/)).toHaveCount(
      0,
    );
  });
});
