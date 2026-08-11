import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNavState } from "./useNavState";
import { FilterService } from "./FilterService";

describe("useNavState — initial state", () => {
  it("defaults to dashboard selection", () => {
    const { result } = renderHook(() => useNavState(false));
    expect(result.current.selection).toEqual({ id: "dashboard" });
  });

  it("accepts a custom default selection", () => {
    const { result } = renderHook(() =>
      useNavState(false, { id: "resourceList", resourceType: "apiResources" }),
    );
    expect(result.current.selection).toEqual({
      id: "resourceList",
      resourceType: "apiResources",
    });
  });

  it("starts with an empty query", () => {
    const { result } = renderHook(() => useNavState(false));
    expect(result.current.query).toBe("");
  });

  it("starts with empty filters", () => {
    const { result } = renderHook(() => useNavState(false));
    expect(FilterService.isNoneActive(result.current.filters)).toBe(true);
  });
});

describe("useNavState — setSelection", () => {
  it("updates the selection", () => {
    const { result } = renderHook(() => useNavState(false));
    act(() => {
      result.current.setSelection({ id: "packages" });
    });
    expect(result.current.selection).toEqual({ id: "packages" });
  });

  it("carries resourceType when selecting resourceList", () => {
    const { result } = renderHook(() => useNavState(false));
    act(() => {
      result.current.setSelection({
        id: "resourceList",
        resourceType: "dataProducts",
      });
    });
    expect(result.current.selection).toEqual({
      id: "resourceList",
      resourceType: "dataProducts",
    });
  });

  it("works for consumptionBundles", () => {
    const { result } = renderHook(() => useNavState(false));
    act(() => {
      result.current.setSelection({ id: "consumptionBundles" });
    });
    expect(result.current.selection).toEqual({ id: "consumptionBundles" });
  });

  it("does not affect query", () => {
    const { result } = renderHook(() => useNavState(false));
    act(() => {
      result.current.setQuery("hello");
    });
    act(() => {
      result.current.setSelection({ id: "packages" });
    });
    expect(result.current.query).toBe("hello");
  });
});

describe("useNavState — setQuery", () => {
  it("updates the query", () => {
    const { result } = renderHook(() => useNavState(false));
    act(() => {
      result.current.setQuery("payment");
    });
    expect(result.current.query).toBe("payment");
  });

  it("clears to empty string", () => {
    const { result } = renderHook(() => useNavState(false));
    act(() => {
      result.current.setQuery("payment");
    });
    act(() => {
      result.current.setQuery("");
    });
    expect(result.current.query).toBe("");
  });

  it("does not affect selection", () => {
    const { result } = renderHook(() => useNavState(false));
    act(() => {
      result.current.setSelection({ id: "packages" });
    });
    act(() => {
      result.current.setQuery("anything");
    });
    expect(result.current.selection).toEqual({ id: "packages" });
  });
});

describe("useNavState — setFilters", () => {
  it("updates the filters", () => {
    const { result } = renderHook(() => useNavState(false));
    const next = FilterService.toggleVisibility(
      FilterService.empty(),
      "public",
    );
    act(() => {
      result.current.setFilters(next);
    });
    expect(result.current.filters.visibility.has("public")).toBe(true);
  });

  it("does not affect selection or query", () => {
    const { result } = renderHook(() => useNavState(false));
    act(() => {
      result.current.setSelection({ id: "packages" });
      result.current.setQuery("search");
    });
    act(() => {
      result.current.setFilters(FilterService.reset());
    });
    expect(result.current.selection).toEqual({ id: "packages" });
    expect(result.current.query).toBe("search");
  });
});

describe("useNavState — state independence", () => {
  it("two instances do not share state", () => {
    const a = renderHook(() => useNavState(false));
    const b = renderHook(() => useNavState(false));
    act(() => {
      a.result.current.setSelection({ id: "packages" });
    });
    expect(b.result.current.selection).toEqual({ id: "dashboard" });
  });
});
