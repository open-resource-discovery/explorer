import {
  Search,
  Globe,
  Lock,
  Building2,
  CheckCircle2,
  FlaskConical,
  Code2,
  AlertTriangle,
  Sunset,
} from "lucide-react";
import type { ReactNode } from "react";
import { FilterService } from "./FilterService";

export type VisibilityFilter = "public" | "internal" | "private";
export type ReleaseStatusFilter =
  "active" | "beta" | "deprecated" | "sunset" | "development";

export interface SearchFilters {
  visibility: Set<VisibilityFilter>;
  releaseStatus: Set<ReleaseStatusFilter>;
}

export const ALL_VISIBILITY: VisibilityFilter[] = [
  "public",
  "internal",
  "private",
];
export const ALL_RELEASE_STATUS: ReleaseStatusFilter[] = [
  "active",
  "beta",
  "development",
  "deprecated",
  "sunset",
];

// Pastel color tokens per filter value.
// inactive: soft tinted bg + matching border, subtle text
// active: saturated bg + white text
export interface ChipColor {
  inactive: string;
  active: string;
}

export const VISIBILITY_COLORS: Record<VisibilityFilter, ChipColor> = {
  public: {
    inactive:
      "border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900",
    active: "border-transparent bg-sky-500 text-white dark:bg-sky-600",
  },
  internal: {
    inactive:
      "border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400 dark:hover:bg-violet-900",
    active: "border-transparent bg-violet-500 text-white dark:bg-violet-600",
  },
  private: {
    inactive:
      "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900",
    active: "border-transparent bg-rose-500 text-white dark:bg-rose-600",
  },
};

export const RELEASE_STATUS_COLORS: Record<ReleaseStatusFilter, ChipColor> = {
  active: {
    inactive:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900",
    active: "border-transparent bg-emerald-500 text-white dark:bg-emerald-600",
  },
  beta: {
    inactive:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900",
    active: "border-transparent bg-amber-500 text-white dark:bg-amber-600",
  },
  development: {
    inactive:
      "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900",
    active: "border-transparent bg-indigo-500 text-white dark:bg-indigo-600",
  },
  deprecated: {
    inactive:
      "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400 dark:hover:bg-orange-900",
    active: "border-transparent bg-orange-500 text-white dark:bg-orange-600",
  },
  sunset: {
    inactive:
      "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
    active: "border-transparent bg-red-500 text-white dark:bg-red-600",
  },
};

export const VISIBILITY_ICON: Record<VisibilityFilter, ReactNode> = {
  public: <Globe className="h-3 w-3" />,
  internal: <Building2 className="h-3 w-3" />,
  private: <Lock className="h-3 w-3" />,
};

export const RELEASE_STATUS_ICON: Record<ReleaseStatusFilter, ReactNode> = {
  active: <CheckCircle2 className="h-3 w-3" />,
  beta: <FlaskConical className="h-3 w-3" />,
  development: <Code2 className="h-3 w-3" />,
  deprecated: <AlertTriangle className="h-3 w-3" />,
  sunset: <Sunset className="h-3 w-3" />,
};

export const VISIBILITY_LABEL: Record<VisibilityFilter, string> = {
  public: "Public",
  internal: "Internal",
  private: "Private",
};

export const RELEASE_STATUS_LABEL: Record<ReleaseStatusFilter, string> = {
  active: "Active",
  beta: "Beta",
  development: "Dev",
  deprecated: "Deprecated",
  sunset: "Sunset",
};

interface ChipProps {
  label: string;
  icon: ReactNode;
  color: ChipColor;
  active: boolean;
  pending?: boolean;
  onToggle: () => void;
}

function Chip({ label, icon, color, active, pending, onToggle }: ChipProps) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
        active ? color.active : color.inactive
      } ${pending ? "motion-safe:animate-pulse" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}

interface SearchBarProps {
  query: string;
  filters: SearchFilters;
  deferredFilters?: SearchFilters;
  onQueryChange: (q: string) => void;
  onFiltersChange: (f: SearchFilters) => void;
  placeholder?: string;
}

export function SearchBar({
  query,
  filters,
  deferredFilters,
  onQueryChange,
  onFiltersChange,
  placeholder,
}: SearchBarProps) {
  const anyActive =
    filters.visibility.size > 0 || filters.releaseStatus.size > 0;

  return (
    <div className="border-b border-border px-6 py-3 space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder ?? "Search resources…"}
          aria-label="Search resources"
          className="w-full rounded-[var(--ord-radius)] border border-border bg-background pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="search-input"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div
          role="group"
          aria-labelledby="filter-visibility-label"
          className="flex items-center gap-1.5"
        >
          <span
            id="filter-visibility-label"
            className="text-xs text-muted-foreground shrink-0"
          >
            Visibility
          </span>
          {ALL_VISIBILITY.map((v) => (
            <Chip
              key={v}
              label={VISIBILITY_LABEL[v]}
              icon={VISIBILITY_ICON[v]}
              color={VISIBILITY_COLORS[v]}
              active={filters.visibility.has(v)}
              pending={
                deferredFilters
                  ? filters.visibility.has(v) !==
                    deferredFilters.visibility.has(v)
                  : false
              }
              onToggle={() =>
                onFiltersChange(FilterService.toggleVisibility(filters, v))
              }
            />
          ))}
        </div>
        <div
          role="group"
          aria-labelledby="filter-status-label"
          className="flex items-center gap-1.5"
        >
          <span
            id="filter-status-label"
            className="text-xs text-muted-foreground shrink-0"
          >
            Status
          </span>
          {ALL_RELEASE_STATUS.map((s) => (
            <Chip
              key={s}
              label={RELEASE_STATUS_LABEL[s]}
              icon={RELEASE_STATUS_ICON[s]}
              color={RELEASE_STATUS_COLORS[s]}
              active={filters.releaseStatus.has(s)}
              pending={
                deferredFilters
                  ? filters.releaseStatus.has(s) !==
                    deferredFilters.releaseStatus.has(s)
                  : false
              }
              onToggle={() =>
                onFiltersChange(FilterService.toggleReleaseStatus(filters, s))
              }
            />
          ))}
        </div>
        {anyActive && (
          <button
            onClick={() => onFiltersChange(FilterService.empty())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
