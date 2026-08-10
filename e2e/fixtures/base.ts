import { test as base, expect } from "@playwright/test";

const appPort = process.env.E2E_APP_PORT ?? "5175";

export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  baseURL: async ({}, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(`http://localhost:${appPort}`);
  },
});

export { expect };
