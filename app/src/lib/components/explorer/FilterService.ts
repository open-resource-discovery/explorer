import type {
  VisibilityFilter,
  ReleaseStatusFilter,
  SearchFilters,
} from "./SearchBar";
import { ALL_VISIBILITY, ALL_RELEASE_STATUS } from "./SearchBar";

// Mutual exclusivity groups: selecting one deactivates the others in the same group.
// Each sub-array is one exclusive group.
const VISIBILITY_EXCLUSIVE_GROUPS: VisibilityFilter[][] = [
  ["public", "internal", "private"],
];

const RELEASE_STATUS_EXCLUSIVE_GROUPS: ReleaseStatusFilter[][] = [
  ["active", "beta", "development", "deprecated", "sunset"],
];

function resolveExclusions<T extends string>(
  current: Set<T>,
  toggled: T,
  groups: T[][],
): Set<T> {
  const next = new Set(current);
  if (next.has(toggled)) {
    next.delete(toggled);
    return next;
  }
  // Activate: remove mutual exclusives
  for (const group of groups) {
    if (group.includes(toggled)) {
      for (const member of group) {
        if (member !== toggled) next.delete(member);
      }
    }
  }
  next.add(toggled);
  return next;
}

export const FilterService = {
  toggleVisibility(filters: SearchFilters, v: VisibilityFilter): SearchFilters {
    return {
      ...filters,
      visibility: resolveExclusions(
        filters.visibility,
        v,
        VISIBILITY_EXCLUSIVE_GROUPS,
      ),
    };
  },

  toggleReleaseStatus(
    filters: SearchFilters,
    s: ReleaseStatusFilter,
  ): SearchFilters {
    return {
      ...filters,
      releaseStatus: resolveExclusions(
        filters.releaseStatus,
        s,
        RELEASE_STATUS_EXCLUSIVE_GROUPS,
      ),
    };
  },

  isAllActive(filters: SearchFilters): boolean {
    return (
      filters.visibility.size === ALL_VISIBILITY.length &&
      filters.releaseStatus.size === ALL_RELEASE_STATUS.length
    );
  },

  isNoneActive(filters: SearchFilters): boolean {
    return filters.visibility.size === 0 && filters.releaseStatus.size === 0;
  },

  reset(): SearchFilters {
    return {
      visibility: new Set(ALL_VISIBILITY),
      releaseStatus: new Set(ALL_RELEASE_STATUS),
    };
  },

  empty(): SearchFilters {
    return {
      visibility: new Set(),
      releaseStatus: new Set(),
    };
  },

  // Empty set means "no restriction" — show all.
  resourceMatchesFilters(
    visibility: string | undefined,
    releaseStatus: string | undefined,
    filters: SearchFilters,
  ): boolean {
    if (filters.visibility.size > 0) {
      const vis = (visibility ?? "public") as VisibilityFilter;
      if (!filters.visibility.has(vis)) return false;
    }
    if (filters.releaseStatus.size > 0) {
      const status = (releaseStatus ?? "active") as ReleaseStatusFilter;
      if (!filters.releaseStatus.has(status)) return false;
    }
    return true;
  },
};
