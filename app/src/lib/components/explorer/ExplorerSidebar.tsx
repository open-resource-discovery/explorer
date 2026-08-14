import { useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Package,
  Box,
  ShoppingBag,
  Layers2,
} from "lucide-react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { RESOURCE_TYPE_CONFIG } from "./resourceTypeConfig";
import { FilterService } from "./FilterService";
import type {
  SearchFilters,
  VisibilityFilter,
  ReleaseStatusFilter,
} from "./SearchBar";
import {
  VISIBILITY_COLORS,
  VISIBILITY_ICON,
  VISIBILITY_LABEL,
  RELEASE_STATUS_COLORS,
  RELEASE_STATUS_ICON,
  RELEASE_STATUS_LABEL,
} from "./SearchBar";
import { FilterStrip } from "./FilterStrip";
import type { Selection } from "./useNavState";
import type { ResourceTypeGroup } from "./explorerTypes";
import { useResourceSearch } from "./useResourceSearch";
import type { ResourceBase } from "./useResourceSearch";
import { Button, Input } from "@open-resource-discovery/ui-components";

interface SidebarSectionProps {
  type: ResourceTypeGroup;
  label: string;
  query: string;
  filters: SearchFilters;
  selection: Selection;
  onSelect: (s: Selection) => void;
}

function SidebarSection({
  type,
  label,
  query,
  filters,
  selection,
  onSelect,
}: SidebarSectionProps) {
  const document = useOrdDocument();
  const resources = (document[type] ?? []) as ResourceBase[];
  const { filteredResources } = useResourceSearch(resources, query, filters);

  const isTypeSelected =
    selection.id === "resourceList" && selection.resourceType === type;
  const selectedOrdId =
    selection.id === "resourceDetail" && selection.resourceType === type
      ? selection.ordId
      : null;

  const [open, setOpen] = useState(true);

  if (resources.length === 0 || filteredResources.length === 0) return null;

  return (
    <div className="border-b border-border/60 last:border-0">
      <Button
        className="flex w-full items-center bg-muted/50 hover:bg-muted/70 pl-6 pr-3 py-2"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span
          className={`flex-1 text-left text-xs font-semibold uppercase tracking-wide ${isTypeSelected ? "text-primary" : "text-muted-foreground"}`}
        >
          {label}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </Button>

      {open && (
        <div className="pb-1">
          {filteredResources.slice(0, 50).map((r) => {
            const isSelected = selectedOrdId === r.ordId;
            return (
              <Button
                key={r.ordId}
                className={`flex w-full items-baseline gap-1.5 px-6 py-1 text-left hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/8" : ""}`}
                onClick={() =>
                  onSelect({
                    id: "resourceDetail",
                    resourceType: type,
                    ordId: r.ordId,
                  })
                }
              >
                <span
                  className={`min-w-0 flex-1 truncate text-xs font-medium leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}
                >
                  {r.title}
                </span>
                {r.version && (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    v{r.version.split(".")[0]}
                  </span>
                )}
              </Button>
            );
          })}
          {filteredResources.length > 50 && (
            <Button
              className="w-full px-6 py-1 text-left text-xs text-primary hover:underline"
              onClick={() =>
                onSelect({ id: "resourceList", resourceType: type })
              }
            >
              + {filteredResources.length - 50} more…
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface FlatListSectionProps {
  listId: "packages" | "consumptionBundles" | "products" | "groups";
  label: string;
  icon: ReactNode;
  items: { id: string; title: string; version?: string }[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  getSelectedId: (s: Selection) => string | null;
  buildDetailSelection: (id: string) => Selection;
}

function FlatListSection({
  listId,
  label,
  icon,
  items,
  selection,
  onSelect,
  getSelectedId,
  buildDetailSelection,
}: FlatListSectionProps) {
  const [open, setOpen] = useState(true);

  const isListSelected = selection.id === listId;
  const selectedId = getSelectedId(selection);

  if (items.length === 0) return null;

  return (
    <div className="border-b border-border/60 last:border-0">
      <Button
        className="flex w-full items-center bg-muted/50 hover:bg-muted/70 pl-6 pr-3 py-2"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span
          className={`flex flex-1 items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide ${isListSelected ? "text-primary" : "text-muted-foreground"}`}
        >
          {icon}
          {label}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </Button>

      {open && (
        <div className="pb-1">
          {items.slice(0, 50).map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <Button
                key={item.id}
                className={`flex w-full items-baseline gap-1.5 px-6 py-1 text-left hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/8" : ""}`}
                onClick={() => onSelect(buildDetailSelection(item.id))}
              >
                <span
                  className={`min-w-0 flex-1 truncate text-xs font-medium leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}
                >
                  {item.title}
                </span>
                {item.version && (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    v{item.version.split(".")[0]}
                  </span>
                )}
              </Button>
            );
          })}
          {items.length > 50 && (
            <Button
              className="w-full px-6 py-1 text-left text-xs text-primary hover:underline"
              onClick={() => onSelect({ id: listId })}
            >
              + {items.length - 50} more…
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ExplorerSidebarProps {
  query: string;
  filters: SearchFilters;
  selection: Selection;
  onQueryChange: (q: string) => void;
  onFiltersChange: (f: SearchFilters) => void;
  onSelect: (s: Selection) => void;
  width: number;
  onWidthChange: (w: number) => void;
}

export function ExplorerSidebar({
  query,
  filters,
  selection,
  onQueryChange,
  onFiltersChange,
  onSelect,
  width,
  onWidthChange,
}: ExplorerSidebarProps) {
  const document = useOrdDocument();
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const next = Math.min(
          480,
          Math.max(160, startWidth.current + ev.clientX - startX.current),
        );
        onWidthChange(next);
      };
      const onMouseUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
      // width is captured into startWidth.current at mousedown, so it is not a stale-closure risk
    },
    [onWidthChange],
  );

  const visibilities: VisibilityFilter[] = ["public", "internal", "private"];
  const statusRows: ReleaseStatusFilter[][] = [
    ["active", "beta", "development"],
    ["deprecated", "sunset"],
  ];

  const hasPackages = (document.packages ?? []).length > 0;
  const hasBundles = (document.consumptionBundles ?? []).length > 0;
  const hasProducts = (document.products ?? []).length > 0;
  const hasGroups = (document.groups ?? []).length > 0;

  return (
    <div className="relative flex shrink-0" style={{ width }}>
      <aside className="flex w-full flex-col overflow-y-auto border-r border-border bg-background">
        {/* Search */}
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Filter resources…"
              data-testid="search-input"
              className="w-full rounded-md border border-border bg-muted/40 py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Visibility filters */}
        <div className="border-b border-border px-3 py-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Visibility
          </p>
          <FilterStrip
            rows={[
              visibilities.map((v) => ({
                value: v,
                label: VISIBILITY_LABEL[v],
                icon: VISIBILITY_ICON[v],
                colors: VISIBILITY_COLORS[v],
              })),
            ]}
            activeValues={filters.visibility}
            onToggle={(v) =>
              onFiltersChange(FilterService.toggleVisibility(filters, v))
            }
          />
        </div>

        {/* Release Status filters */}
        <div className="border-b border-border px-3 py-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Release Status
          </p>
          <FilterStrip
            rows={statusRows.map((row) =>
              row.map((s) => ({
                value: s,
                label: RELEASE_STATUS_LABEL[s],
                icon: RELEASE_STATUS_ICON[s],
                colors: RELEASE_STATUS_COLORS[s],
              })),
            )}
            activeValues={filters.releaseStatus}
            onToggle={(s) =>
              onFiltersChange(FilterService.toggleReleaseStatus(filters, s))
            }
          />
        </div>

        {/* Resource type tree */}
        <div className="flex-1 overflow-y-auto">
          {RESOURCE_TYPE_CONFIG.map(({ type, label }) => (
            <SidebarSection
              key={type}
              type={type}
              label={label}
              query={query}
              filters={filters}
              selection={selection}
              onSelect={onSelect}
            />
          ))}

          {/* Packages */}
          {hasPackages && (
            <FlatListSection
              listId="packages"
              label="Packages"
              icon={<Package className="h-3.5 w-3.5 shrink-0" />}
              items={(document.packages ?? []).map((p) => ({
                ...p,
                id: p.ordId,
              }))}
              selection={selection}
              onSelect={onSelect}
              getSelectedId={(s) => (s.id === "packageDetail" ? s.ordId : null)}
              buildDetailSelection={(id) => ({
                id: "packageDetail",
                ordId: id,
              })}
            />
          )}

          {/* Consumption Bundles */}
          {hasBundles && (
            <FlatListSection
              listId="consumptionBundles"
              label="Bundles"
              icon={<Box className="h-3.5 w-3.5 shrink-0" />}
              items={(document.consumptionBundles ?? []).map((b) => ({
                ...b,
                id: b.ordId,
              }))}
              selection={selection}
              onSelect={onSelect}
              getSelectedId={(s) =>
                s.id === "consumptionBundleDetail" ? s.ordId : null
              }
              buildDetailSelection={(id) => ({
                id: "consumptionBundleDetail",
                ordId: id,
              })}
            />
          )}

          {/* Products */}
          {hasProducts && (
            <FlatListSection
              listId="products"
              label="Products"
              icon={<ShoppingBag className="h-3.5 w-3.5 shrink-0" />}
              items={(document.products ?? []).map((p) => ({
                ...p,
                id: p.ordId,
              }))}
              selection={selection}
              onSelect={onSelect}
              getSelectedId={(s) => (s.id === "productDetail" ? s.ordId : null)}
              buildDetailSelection={(id) => ({
                id: "productDetail",
                ordId: id,
              })}
            />
          )}

          {/* Groups */}
          {hasGroups && (
            <FlatListSection
              listId="groups"
              label="Groups"
              icon={<Layers2 className="h-3.5 w-3.5 shrink-0" />}
              items={(document.groups ?? []).map((g) => ({
                ...g,
                id: g.groupId,
              }))}
              selection={selection}
              onSelect={onSelect}
              getSelectedId={(s) => (s.id === "groupDetail" ? s.groupId : null)}
              buildDetailSelection={(id) => ({
                id: "groupDetail",
                groupId: id,
              })}
            />
          )}
        </div>
      </aside>

      {/* Drag handle — outside the scrollable aside so it stays fixed */}
      <div
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30 transition-colors"
        aria-hidden="true"
      />
    </div>
  );
}
