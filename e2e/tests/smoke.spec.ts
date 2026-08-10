import { test, expect } from "../fixtures/explorer";

test("dashboard is visible on load", async ({ explorer }) => {
  await explorer.goto();
  await expect(explorer.dashboard).toBeVisible();
});
