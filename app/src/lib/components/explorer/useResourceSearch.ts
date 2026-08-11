import { useDeferredValue, useMemo } from "react";
import uFuzzy from "@leeoniya/ufuzzy";
import type { SearchFilters } from "./SearchBar";
import { FilterService } from "./FilterService";

export interface MatchInfo {
  titleRanges?: [number, number][];
  ordIdRanges?: [number, number][];
}

// Shared instance — stateless, safe to reuse across components.
const uf = new uFuzzy({ intraIns: 5 });

export interface ResourceBase {
  ordId: string;
  title?: string;
  version?: string;
  visibility?: string;
  releaseStatus?: string;
}

/**
 * Filters resources by visibility/releaseStatus and runs fuzzy search.
 * Returns the filtered resources visible under the current query, plus a
 * matchMap of highlight ranges for rendering (null when no query is active).
 */
export function useResourceSearch<T extends ResourceBase>(
  resources: T[],
  query: string,
  filters: SearchFilters,
): { filteredResources: T[]; matchMap: Map<string, MatchInfo> | null } {
  const deferredQuery = useDeferredValue(query);

  const filteredResources = useMemo(
    () =>
      resources.filter((r) =>
        FilterService.resourceMatchesFilters(
          r.visibility,
          r.releaseStatus,
          filters,
        ),
      ),
    [resources, filters],
  );

  const corpus = useMemo(
    () => filteredResources.map((r) => `${r.title ?? ""} ${r.ordId}`),
    [filteredResources],
  );

  const matchMap = useMemo((): Map<string, MatchInfo> | null => {
    const q = deferredQuery.trim();
    if (!q) return null;

    const [idxs, info, order] = uf.search(corpus, q, 0);
    if (!idxs || !info || !order) return new Map();

    const map = new Map<string, MatchInfo>();
    for (let i = 0; i < order.length; i++) {
      const idx = order[i];
      const resource = filteredResources[idxs[idx]];
      const ordId = resource.ordId;
      const title = resource.title ?? "";
      const titleLen = title.length + 1; // +1 for the space separator
      const ranges = info.ranges[idx];

      const titleRanges: [number, number][] = [];
      const ordIdRanges: [number, number][] = [];

      if (ranges) {
        for (let j = 0; j < ranges.length; j += 2) {
          const start = ranges[j];
          const end = ranges[j + 1];
          if (end <= titleLen - 1) {
            titleRanges.push([start, end]);
          } else if (start >= titleLen) {
            ordIdRanges.push([start - titleLen, end - titleLen]);
          }
        }
      }

      map.set(ordId, {
        titleRanges: titleRanges.length > 0 ? titleRanges : undefined,
        ordIdRanges: ordIdRanges.length > 0 ? ordIdRanges : undefined,
      });
    }
    return map;
  }, [deferredQuery, corpus, filteredResources]);

  return { filteredResources, matchMap };
}
