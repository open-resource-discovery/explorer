import { useEffect, useRef, useState } from "react";
import type { ResourceTypeGroup } from "./explorerTypes";
import type { SearchFilters } from "./SearchBar";
import { ALL_VISIBILITY, ALL_RELEASE_STATUS } from "./SearchBar";
import type { VisibilityFilter, ReleaseStatusFilter } from "./SearchBar";
import { FilterService } from "./FilterService";

export type Selection =
  | { id: "dashboard" }
  | { id: "resourceList"; resourceType: ResourceTypeGroup }
  | { id: "resourceDetail"; resourceType: ResourceTypeGroup; ordId: string }
  | { id: "packages" }
  | { id: "packageDetail"; ordId: string }
  | { id: "consumptionBundles" }
  | { id: "consumptionBundleDetail"; ordId: string }
  | { id: "products" }
  | { id: "productDetail"; ordId: string }
  | { id: "groups" }
  | { id: "groupDetail"; groupId: string };

// ---------------------------------------------------------------------------
// Hash serialisation
// ---------------------------------------------------------------------------

function pageToHashPath(page: Selection): string {
  if (page.id === "resourceDetail")
    return `/resourceList/${page.resourceType}/${encodeURIComponent(page.ordId)}`;
  if (page.id === "resourceList") return `/resourceList/${page.resourceType}`;
  if (page.id === "packageDetail")
    return `/packages/${encodeURIComponent(page.ordId)}`;
  if (page.id === "consumptionBundleDetail")
    return `/consumptionBundles/${encodeURIComponent(page.ordId)}`;
  if (page.id === "productDetail")
    return `/products/${encodeURIComponent(page.ordId)}`;
  if (page.id === "groupDetail")
    return `/groups/${encodeURIComponent(page.groupId)}`;
  return `/${page.id}`;
}

function hashPathToPage(path: string): Selection | null {
  if (path === "/dashboard" || path === "/") return { id: "dashboard" };
  if (path === "/packages") return { id: "packages" };
  if (path === "/consumptionBundles") return { id: "consumptionBundles" };
  if (path === "/products") return { id: "products" };
  if (path === "/groups") return { id: "groups" };
  const mPkgDetail = path.match(/^\/packages\/(.+)$/);
  if (mPkgDetail)
    return { id: "packageDetail", ordId: decodeURIComponent(mPkgDetail[1]) };
  const mBundleDetail = path.match(/^\/consumptionBundles\/(.+)$/);
  if (mBundleDetail)
    return {
      id: "consumptionBundleDetail",
      ordId: decodeURIComponent(mBundleDetail[1]),
    };
  const mProductDetail = path.match(/^\/products\/(.+)$/);
  if (mProductDetail)
    return {
      id: "productDetail",
      ordId: decodeURIComponent(mProductDetail[1]),
    };
  const mGroupDetail = path.match(/^\/groups\/(.+)$/);
  if (mGroupDetail)
    return { id: "groupDetail", groupId: decodeURIComponent(mGroupDetail[1]) };
  const mDetail = path.match(/^\/resourceList\/([^/]+)\/(.+)$/);
  if (mDetail)
    return {
      id: "resourceDetail",
      resourceType: mDetail[1] as ResourceTypeGroup,
      ordId: decodeURIComponent(mDetail[2]),
    };
  const m = path.match(/^\/resourceList\/(.+)$/);
  if (m) return { id: "resourceList", resourceType: m[1] as ResourceTypeGroup };
  return null;
}

function filtersToParams(filters: SearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.visibility.size > 0)
    p.set("visibility", [...filters.visibility].join(","));
  if (filters.releaseStatus.size > 0)
    p.set("releaseStatus", [...filters.releaseStatus].join(","));
  return p;
}

function paramsToFilters(p: URLSearchParams): SearchFilters {
  const vis = p.get("visibility");
  const rs = p.get("releaseStatus");
  return {
    visibility: vis
      ? new Set(
          vis
            .split(",")
            .filter((v): v is VisibilityFilter =>
              (ALL_VISIBILITY as string[]).includes(v),
            ),
        )
      : new Set<VisibilityFilter>(),
    releaseStatus: rs
      ? new Set(
          rs
            .split(",")
            .filter((v): v is ReleaseStatusFilter =>
              (ALL_RELEASE_STATUS as string[]).includes(v),
            ),
        )
      : new Set<ReleaseStatusFilter>(),
  };
}

function buildHash(
  page: Selection,
  query: string,
  filters: SearchFilters,
): string {
  const path = pageToHashPath(page);
  const p = filtersToParams(filters);
  if (query.trim()) p.set("q", query.trim());
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}

interface ParsedHash {
  selection: Selection;
  query: string;
  filters: SearchFilters;
}

function parseHash(raw: string): ParsedHash {
  // raw is everything after the leading '#', e.g. "/resourceList/apiResources?q=foo"
  const [pathPart, qsPart] = raw.replace(/^#/, "").split("?");
  const selection = hashPathToPage(pathPart ?? "") ?? {
    id: "dashboard" as const,
  };
  const p = new URLSearchParams(qsPart ?? "");
  const query = p.get("q") ?? "";
  const filters = paramsToFilters(p);
  return { selection, query, filters };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface NavState {
  selection: Selection;
  query: string;
  filters: SearchFilters;
  setSelection: (next: Selection) => void;
  setQuery: (q: string) => void;
  setFilters: (f: SearchFilters) => void;
}

export function useNavState(
  enableUrlSync: boolean,
  defaultSelection: Selection = { id: "dashboard" as const },
): NavState {
  const getInitial = (): ParsedHash => {
    if (
      enableUrlSync &&
      typeof window !== "undefined" &&
      window.location.hash
    ) {
      return parseHash(window.location.hash);
    }
    return {
      selection: defaultSelection,
      query: "",
      filters: FilterService.empty(),
    };
  };

  const [{ selection: page, query, filters }, setAll] =
    useState<ParsedHash>(getInitial);

  // True while processing a popstate event — suppresses the outbound pushState
  // so browser forward history is not destroyed.
  const fromPopState = useRef(false);
  // False on first effect run so we replaceState instead of pushState on mount.
  const hasMounted = useRef(false);

  // Sync state → hash
  useEffect(() => {
    if (!enableUrlSync) return;
    if (fromPopState.current) {
      fromPopState.current = false;
      return;
    }
    const hash = buildHash(page, query, filters);
    if (!hasMounted.current) {
      hasMounted.current = true;
      window.history.replaceState({ ...window.history.state }, "", `#${hash}`);
    } else {
      window.history.pushState({ ...window.history.state }, "", `#${hash}`);
    }
  }, [page, query, filters, enableUrlSync]);

  // Sync hash → state (back/forward button)
  useEffect(() => {
    if (!enableUrlSync) return;
    const onPop = () => {
      fromPopState.current = true;
      setAll(parseHash(window.location.hash));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [enableUrlSync]);

  const setSelection = (next: Selection) =>
    setAll((prev) => ({ ...prev, selection: next }));
  const setQuery = (q: string) => setAll((prev) => ({ ...prev, query: q }));
  const setFilters = (f: SearchFilters) =>
    setAll((prev) => ({ ...prev, filters: f }));

  return {
    selection: page,
    query,
    filters,
    setSelection,
    setQuery,
    setFilters,
  };
}
