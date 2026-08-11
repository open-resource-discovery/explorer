import { describe, it, expect, vi, afterEach } from "vitest";
import { discoverDocuments } from "./discovery";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("discoverDocuments", () => {
  it("returns documents mapped from the well-known response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          openResourceDiscovery: "1.8",
          documents: [
            { url: "/open-resource-discovery/v1/documents/system-version" },
            { url: "/open-resource-discovery/v1/documents/catalog" },
          ],
        }),
      }),
    );

    const docs = await discoverDocuments("https://example.com");
    expect(docs).toEqual([
      {
        id: "system-version",
        name: "system-version",
        path: "/open-resource-discovery/v1/documents/system-version",
      },
      {
        id: "catalog",
        name: "catalog",
        path: "/open-resource-discovery/v1/documents/catalog",
      },
    ]);
  });

  it("strips trailing slashes from baseUrl before appending the well-known path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ openResourceDiscovery: "1.8", documents: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await discoverDocuments("https://example.com///");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/.well-known/open-resource-discovery",
    );
  });

  it("returns empty array when documents field is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ openResourceDiscovery: "1.8" }),
      }),
    );

    const docs = await discoverDocuments("https://example.com");
    expect(docs).toEqual([]);
  });

  it("throws when the server responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    await expect(discoverDocuments("https://example.com")).rejects.toThrow(
      "Discovery failed: 404 Not Found",
    );
  });

  it("preserves full URL for cross-origin document urls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          openResourceDiscovery: "1.8",
          documents: [
            { url: "https://cdn.other-domain.com/ord/v1/documents/catalog" },
          ],
        }),
      }),
    );

    const docs = await discoverDocuments("https://example.com");
    expect(docs).toEqual([
      {
        id: "catalog",
        name: "catalog",
        path: "https://cdn.other-domain.com/ord/v1/documents/catalog",
      },
    ]);
  });
});
