import { describe, it, expect } from "vitest";
import { getBaseUrl, getFetchUrl } from "./ordUtils";

/**
 * These tests lock in URL resolution for BOTH document URLs and resource
 * definition URLs, which flow through the same getBaseUrl → getFetchUrl chain.
 *
 * The critical cases are the NON-ROOT bases (gh-pages, pr-preview). Every
 * automated environment (unit, e2e, local dev) runs at base "/", where a whole
 * class of path-resolution bugs is invisible. The regressions this file guards
 * against only ever appeared on gh-pages / pr-preview, so they are reproduced
 * here explicitly.
 */

const DOC = "open-resource-discovery/v1/documents/sample";
const DEF = "open-resource-discovery/v1/api-metadata/astronomy-v1.oas3.json";

/** Mirror of connection/seed.ts: origin + BASE_URL (no trailing slash) + /ord-config.json */
function seedOrdConfigUrl(origin: string, baseUrl: string): string {
  return origin + baseUrl.replace(/\/$/, "") + "/ord-config.json";
}

describe("getBaseUrl", () => {
  it("strips the well-known suffix", () => {
    expect(
      getBaseUrl("https://example.com/.well-known/open-resource-discovery"),
    ).toBe("https://example.com");
  });

  it("returns an explicit config baseUrl verbatim", () => {
    expect(
      getBaseUrl(
        "https://example.com/ord-config.json",
        "https://cdn.example.com",
      ),
    ).toBe("https://cdn.example.com");
  });

  it("strips the last segment of a custom config path (root base)", () => {
    expect(getBaseUrl("http://localhost:5173/ord-config.json")).toBe(
      "http://localhost:5173/",
    );
  });

  it("strips the last segment of a custom config path (non-root base)", () => {
    expect(
      getBaseUrl(
        "https://open-resource-discovery.github.io/explorer/ord-config.json",
      ),
    ).toBe("https://open-resource-discovery.github.io/explorer");
  });
});

describe("getFetchUrl", () => {
  it("passes remote (http/https) URLs through unchanged", () => {
    expect(
      getFetchUrl(
        "https://open-resource-discovery.github.io/explorer",
        "https://cdn/x.json",
      ),
    ).toBe("https://cdn/x.json");
  });

  // The regression matrix: document + definition, resolved against every base
  // the app runs under. Definition URLs must land as siblings of the document,
  // NOT nested under .../documents/ (the historical bug), and the base prefix
  // must be preserved (the gh-pages/pr-preview bug).
  const cases: Array<{
    env: string;
    origin: string;
    base: string;
    expectedDoc: string;
    expectedDef: string;
  }> = [
    {
      env: "local dev / e2e (root base)",
      origin: "http://localhost:5173",
      base: "/",
      expectedDoc:
        "http://localhost:5173/open-resource-discovery/v1/documents/sample",
      expectedDef:
        "http://localhost:5173/open-resource-discovery/v1/api-metadata/astronomy-v1.oas3.json",
    },
    {
      env: "gh-pages (two-segment base)",
      origin: "https://open-resource-discovery.github.io",
      base: "/explorer/",
      expectedDoc:
        "https://open-resource-discovery.github.io/explorer/open-resource-discovery/v1/documents/sample",
      expectedDef:
        "https://open-resource-discovery.github.io/explorer/open-resource-discovery/v1/api-metadata/astronomy-v1.oas3.json",
    },
    {
      env: "pr-preview (deep base)",
      origin: "https://open-resource-discovery.github.io",
      base: "/explorer/pr-preview/pr-5/",
      expectedDoc:
        "https://open-resource-discovery.github.io/explorer/pr-preview/pr-5/open-resource-discovery/v1/documents/sample",
      expectedDef:
        "https://open-resource-discovery.github.io/explorer/pr-preview/pr-5/open-resource-discovery/v1/api-metadata/astronomy-v1.oas3.json",
    },
  ];

  for (const { env, origin, base, expectedDoc, expectedDef } of cases) {
    it(`resolves document + definition correctly: ${env}`, () => {
      const baseUrl = getBaseUrl(seedOrdConfigUrl(origin, base));
      expect(getFetchUrl(baseUrl, DOC)).toBe(expectedDoc);
      expect(getFetchUrl(baseUrl, DEF)).toBe(expectedDef);
    });
  }

  it("does NOT nest definition URLs under the document path", () => {
    // The historical bug: resolving DEF against the document URL (as a file)
    // produced .../documents/open-resource-discovery/... — a duplicated segment.
    const baseUrl = getBaseUrl(
      seedOrdConfigUrl(
        "https://open-resource-discovery.github.io",
        "/explorer/",
      ),
    );
    const def = getFetchUrl(baseUrl, DEF);
    expect(def).not.toContain("/documents/open-resource-discovery");
  });
});
