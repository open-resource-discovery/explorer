import { type Page, type Locator } from "@playwright/test";
import { test as base, expect } from "./base";
import { slugify } from "../../app/src/lib/utils/slugify";
import type { ResourceTypeGroup } from "../../app/src/lib/components/explorer/ORDExplorer";

const RESOURCE_TYPE_LABEL: Record<ResourceTypeGroup, string> = {
  apiResources: "API Resources",
  eventResources: "Event Resources",
  entityTypes: "Entity Types",
  dataProducts: "Data Products",
  capabilities: "Capabilities",
  agents: "Agents",
  integrationDependencies: "Integration Dependencies",
};

export class ORDExplorerPage {
  readonly page: Page;
  readonly dashboard: Locator;
  readonly resourceList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboard = page.locator("[data-testid='dashboard']");
    this.resourceList = page.locator("[data-testid='resource-list']");
    this.searchInput = page.locator("[data-testid='search-input']");
  }

  async goto() {
    await this.page.goto("/connections/local-dev/documents/system-instance");
    await this.dashboard.waitFor({ timeout: 10000 });
  }

  async clickResourceTypeCard(type: ResourceTypeGroup) {
    await this.page
      .locator(
        `[data-testid='resource-type-card-${slugify(RESOURCE_TYPE_LABEL[type])}']`,
      )
      .click();
    await this.resourceList.waitFor({ timeout: 5000 });
  }

  packageGroup(ordId: string): Locator {
    return this.page.locator(`[data-testid='package-group-${ordId}']`);
  }

  resourceRow(ordId: string): Locator {
    return this.page.locator(`[data-testid='resource-row-${ordId}']`);
  }
}

export const test = base.extend<{ explorer: ORDExplorerPage }>({
  explorer: async ({ page, baseURL }, use) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.addInitScript((origin: string) => {
      const LOCAL_CONNECTION = {
        id: "local-dev",
        name: "Local Dev Server",
        ordConfigUrl: origin + "/ord-config.json",
        type: "system-endpoint",
        auth: "none",
      };
      localStorage.setItem(
        "explorer:connections",
        JSON.stringify([LOCAL_CONNECTION]),
      );
    }, baseURL ?? "http://localhost:5175");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(new ORDExplorerPage(page));

    if (pageErrors.length > 0) {
      throw new Error(`Page errors during test:\n${pageErrors.join("\n")}`);
    }
  },
});

export { expect };
