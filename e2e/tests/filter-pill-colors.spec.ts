import { test, expect } from "../fixtures/explorer";
import type { Locator } from "@playwright/test";

// Regression guard for the ui-components 0.1.6 -> 0.2.0 layout break.
//
// ui-components 0.2.0 shipped an UNLAYERED, `.ord-ui`-scoped preflight
// (`.ord-ui :where(button) { background-color: transparent }`). Unlayered CSS
// outranks any `@layer`, so it silently overrode the explorer's Tailwind color
// utilities (which live in `@layer utilities`) and flattened every filter pill
// to a transparent, monochrome background. The fix demotes the vendor stylesheet
// into `@layer components` (see app/src/lib/styles.css) so `@layer utilities`
// wins again. These tests go red on the broken build and green once fixed.

const TRANSPARENT = "rgba(0, 0, 0, 0)";

// Filter pill values, keyed by the `data-testid={`filter-pill-${value}`}` that
// FilterStrip renders. Kept as string arrays because the test only needs the
// testid suffix, not the source union types.
const VISIBILITY_VALUES: readonly string[] = ["public", "internal", "private"];
const RELEASE_STATUS_VALUES: readonly string[] = [
  "active",
  "beta",
  "development",
  "deprecated",
  "sunset",
];

async function backgroundColorOf(pill: Locator): Promise<string> {
  return pill.evaluate(
    (el: Element): string => getComputedStyle(el).backgroundColor,
  );
}

test.describe("Filter pill colors", () => {
  test.beforeEach(async ({ explorer }) => {
    await explorer.goto();
  });

  test("visibility pills are color-coded, not transparent", async ({
    page,
  }) => {
    const backgrounds: string[] = [];
    for (const value of VISIBILITY_VALUES) {
      const pill = page.getByTestId(`filter-pill-${value}`);
      await expect(pill).toBeVisible();
      const bg = await backgroundColorOf(pill);
      expect(bg, `visibility pill "${value}" must not be transparent`).not.toBe(
        TRANSPARENT,
      );
      backgrounds.push(bg);
    }
    // Distinct backgrounds prove the pills are color-coded rather than all
    // collapsed to the same (default) fill by an errant global reset.
    expect(new Set(backgrounds).size).toBe(VISIBILITY_VALUES.length);
  });

  test("release status pills are color-coded, not transparent", async ({
    page,
  }) => {
    const backgrounds: string[] = [];
    for (const value of RELEASE_STATUS_VALUES) {
      const pill = page.getByTestId(`filter-pill-${value}`);
      await expect(pill).toBeVisible();
      const bg = await backgroundColorOf(pill);
      expect(bg, `status pill "${value}" must not be transparent`).not.toBe(
        TRANSPARENT,
      );
      backgrounds.push(bg);
    }
    expect(new Set(backgrounds).size).toBe(RELEASE_STATUS_VALUES.length);
  });
});
