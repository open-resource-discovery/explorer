import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useResourceSearch } from "./useResourceSearch";
import { FilterService } from "./FilterService";
import type { SearchFilters } from "./SearchBar";

const empty = (): SearchFilters => FilterService.empty();

const resources = [
  {
    ordId: "sap:api:Billing:v1",
    title: "Billing API",
    visibility: "public",
    releaseStatus: "active",
  },
  {
    ordId: "sap:api:Orders:v1",
    title: "Orders API",
    visibility: "internal",
    releaseStatus: "beta",
  },
  {
    ordId: "sap:api:Inventory:v1",
    title: "Inventory API",
    visibility: "private",
    releaseStatus: "deprecated",
  },
  {
    ordId: "sap:event:StockChanged:v1",
    title: "Stock Changed Event",
    visibility: "public",
    releaseStatus: "active",
  },
];

describe("useResourceSearch — no query, no filters", () => {
  it("returns all resources when query is empty and filters are empty", () => {
    const { result } = renderHook(() =>
      useResourceSearch(resources, "", empty()),
    );
    expect(result.current.filteredResources).toHaveLength(4);
    expect(result.current.matchMap).toBeNull();
  });
});

describe("useResourceSearch — visibility filter", () => {
  it("filters to public resources only", () => {
    const filters: SearchFilters = {
      visibility: new Set(["public"]),
      releaseStatus: new Set(),
    };
    const { result } = renderHook(() =>
      useResourceSearch(resources, "", filters),
    );
    expect(result.current.filteredResources).toHaveLength(2);
    expect(
      result.current.filteredResources.every((r) => r.visibility === "public"),
    ).toBe(true);
  });

  it("filters to internal resources only", () => {
    const filters: SearchFilters = {
      visibility: new Set(["internal"]),
      releaseStatus: new Set(),
    };
    const { result } = renderHook(() =>
      useResourceSearch(resources, "", filters),
    );
    expect(result.current.filteredResources).toHaveLength(1);
    expect(result.current.filteredResources[0].ordId).toBe("sap:api:Orders:v1");
  });
});

describe("useResourceSearch — releaseStatus filter", () => {
  it("filters to active resources only", () => {
    const filters: SearchFilters = {
      visibility: new Set(),
      releaseStatus: new Set(["active"]),
    };
    const { result } = renderHook(() =>
      useResourceSearch(resources, "", filters),
    );
    expect(result.current.filteredResources).toHaveLength(2);
    expect(
      result.current.filteredResources.every(
        (r) => r.releaseStatus === "active",
      ),
    ).toBe(true);
  });
});

describe("useResourceSearch — fuzzy search", () => {
  it("returns a matchMap when query is non-empty", () => {
    const { result } = renderHook(() =>
      useResourceSearch(resources, "Billing", empty()),
    );
    expect(result.current.matchMap).not.toBeNull();
    expect(result.current.matchMap!.has("sap:api:Billing:v1")).toBe(true);
  });

  it("matchMap does not contain non-matching resources", () => {
    const { result } = renderHook(() =>
      useResourceSearch(resources, "Billing", empty()),
    );
    expect(result.current.matchMap!.has("sap:event:StockChanged:v1")).toBe(
      false,
    );
  });

  it("returns empty matchMap when query matches nothing", () => {
    const { result } = renderHook(() =>
      useResourceSearch(resources, "zzzzznomatch", empty()),
    );
    expect(result.current.matchMap).not.toBeNull();
    expect(result.current.matchMap!.size).toBe(0);
  });

  it("search on ordId — finds match by ordId fragment", () => {
    const { result } = renderHook(() =>
      useResourceSearch(resources, "Inventory", empty()),
    );
    expect(result.current.matchMap!.has("sap:api:Inventory:v1")).toBe(true);
  });

  it("matchMap entry for title match has titleRanges", () => {
    const { result } = renderHook(() =>
      useResourceSearch(resources, "Billing", empty()),
    );
    const info = result.current.matchMap!.get("sap:api:Billing:v1");
    expect(info).toBeDefined();
    expect(info!.titleRanges).toBeDefined();
    expect(info!.titleRanges!.length).toBeGreaterThan(0);
  });

  it("returns null matchMap when query is whitespace-only", () => {
    const { result } = renderHook(() =>
      useResourceSearch(resources, "   ", empty()),
    );
    expect(result.current.matchMap).toBeNull();
  });
});

describe("useResourceSearch — combined filter + search", () => {
  it("applies filter before search — restricted visibility + query", () => {
    const filters: SearchFilters = {
      visibility: new Set(["public"]),
      releaseStatus: new Set(),
    };
    const { result } = renderHook(() =>
      useResourceSearch(resources, "API", filters),
    );
    // Only public resources reach the fuzzy search: Billing API and Stock Changed Event
    // "API" matches Billing API but not Stock Changed Event
    expect(result.current.matchMap!.has("sap:api:Billing:v1")).toBe(true);
    expect(result.current.matchMap!.has("sap:api:Orders:v1")).toBe(false); // filtered out (internal)
  });
});
