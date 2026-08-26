import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { Box, Package, ShoppingBag, Users, Building2 } from "lucide-react";
import type { ResourceTypeGroup } from "../ORDExplorer";
import { ResourceListPage } from "./ResourceListPage";
import { PackagesPage } from "./PackagesPage";
import { ConsumptionBundlesPage } from "./ConsumptionBundlesPage";
import { ProductsPage } from "./ProductsPage";
import { GroupsPage } from "./GroupsPage";
import type { SearchFilters } from "../SearchBar";
import type { Selection } from "../useNavState";
import type { ReactNode } from "react";
import { normalizeTestId } from "@lib/utils/normalize-test-id";
import { useResourceSearch } from "../useResourceSearch";
import type { ResourceBase } from "../useResourceSearch";
import { RESOURCE_TYPE_CONFIG } from "../resourceTypeConfig";
import { Button } from "@open-resource-discovery/ui-components";

interface DashboardCardProps {
  icon: ReactNode;
  bg?: string;
  fg?: string;
  label: string;
  count: number;
  /** When provided, shows "of totalCount" when count differs; card is hidden at the call site when totalCount === 0 */
  totalCount?: number;
  selected?: boolean;
  testId?: string;
  onClick?: () => void;
}

function DashboardCard({
  icon,
  bg = "bg-slate-100 dark:bg-slate-800",
  fg = "text-slate-600 dark:text-slate-400",
  label,
  count,
  totalCount,
  selected = false,
  testId,
  onClick,
}: DashboardCardProps) {
  const isFiltered = totalCount !== undefined && count !== totalCount;
  const isEmpty = count === 0;

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className={`rounded-md p-1.5 w-fit ${bg} ${fg}`}>{icon}</div>
        {onClick && !isEmpty && (
          <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-card-fg leading-none">
          {count}
        </span>
        {isFiltered && (
          <span className="text-xs text-muted-foreground font-normal">
            of {totalCount}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-muted-foreground leading-tight">
        {label}
      </p>
    </>
  );

  if (onClick) {
    return (
      <Button
        variant="ghost"
        onClick={onClick}
        disabled={isEmpty}
        aria-pressed={selected}
        data-testid={testId}
        className={`group h-auto w-full items-start whitespace-normal flex flex-col gap-2 rounded-[var(--ord-radius)] border p-3 text-left shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-40 ${
          selected
            ? "border-primary bg-primary/5 ring-1 ring-primary"
            : "border-card-border bg-card-bg hover:bg-muted/50"
        }`}
      >
        {content}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--ord-radius)] border border-card-border bg-card-bg p-3 shadow-sm opacity-70">
      {content}
    </div>
  );
}

interface DashboardPageProps {
  query: string;
  filters: SearchFilters;
  selection: Selection;
  onSelect: (next: Selection) => void;
  onSelectDetail: (resourceType: ResourceTypeGroup, ordId: string) => void;
}

export function DashboardPage({
  query,
  filters,
  selection,
  onSelect,
  onSelectDetail,
}: DashboardPageProps) {
  const document = useOrdDocument();

  const { filteredResources: filteredApis, matchMap: apiMatchMap } =
    useResourceSearch(
      (document.apiResources ?? []) as ResourceBase[],
      query,
      filters,
    );
  const { filteredResources: filteredEvents, matchMap: eventMatchMap } =
    useResourceSearch(
      (document.eventResources ?? []) as ResourceBase[],
      query,
      filters,
    );
  const {
    filteredResources: filteredEntityTypes,
    matchMap: entityTypeMatchMap,
  } = useResourceSearch(
    (document.entityTypes ?? []) as ResourceBase[],
    query,
    filters,
  );
  const {
    filteredResources: filteredDataProducts,
    matchMap: dataProductMatchMap,
  } = useResourceSearch(
    (document.dataProducts ?? []) as ResourceBase[],
    query,
    filters,
  );
  const {
    filteredResources: filteredCapabilities,
    matchMap: capabilityMatchMap,
  } = useResourceSearch(
    (document.capabilities ?? []) as ResourceBase[],
    query,
    filters,
  );
  const { filteredResources: filteredAgents, matchMap: agentMatchMap } =
    useResourceSearch(
      (document.agents ?? []) as ResourceBase[],
      query,
      filters,
    );
  const {
    filteredResources: filteredIntegrations,
    matchMap: integrationMatchMap,
  } = useResourceSearch(
    (document.integrationDependencies ?? []) as ResourceBase[],
    query,
    filters,
  );

  const filteredCounts: Record<ResourceTypeGroup, number> = {
    apiResources: apiMatchMap !== null ? apiMatchMap.size : filteredApis.length,
    eventResources:
      eventMatchMap !== null ? eventMatchMap.size : filteredEvents.length,
    entityTypes:
      entityTypeMatchMap !== null
        ? entityTypeMatchMap.size
        : filteredEntityTypes.length,
    dataProducts:
      dataProductMatchMap !== null
        ? dataProductMatchMap.size
        : filteredDataProducts.length,
    capabilities:
      capabilityMatchMap !== null
        ? capabilityMatchMap.size
        : filteredCapabilities.length,
    agents: agentMatchMap !== null ? agentMatchMap.size : filteredAgents.length,
    integrationDependencies:
      integrationMatchMap !== null
        ? integrationMatchMap.size
        : filteredIntegrations.length,
  };

  const totalCounts: Record<ResourceTypeGroup, number> = {
    apiResources: (document.apiResources ?? []).length,
    eventResources: (document.eventResources ?? []).length,
    entityTypes: (document.entityTypes ?? []).length,
    dataProducts: (document.dataProducts ?? []).length,
    capabilities: (document.capabilities ?? []).length,
    agents: (document.agents ?? []).length,
    integrationDependencies: (document.integrationDependencies ?? []).length,
  };

  return (
    <div className="bg-background" data-testid="dashboard">
      {document.description && (
        <p className="px-6 pt-4 pb-3 max-w-2xl text-sm text-muted-foreground leading-relaxed border-b border-border">
          {document.description}
        </p>
      )}

      <div className="p-4 space-y-4">
        {/* Unified stat card grid — resources + document items in one row */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {RESOURCE_TYPE_CONFIG.filter(({ type }) => totalCounts[type] > 0).map(
            ({ type, label, icon, bg, fg }) => {
              const sel: Selection = {
                id: "resourceList",
                resourceType: type,
              };
              const isSelected =
                selection.id === "resourceList" &&
                selection.resourceType === type;
              return (
                <DashboardCard
                  key={type}
                  icon={icon}
                  bg={bg}
                  fg={fg}
                  label={label}
                  count={filteredCounts[type]}
                  totalCount={totalCounts[type]}
                  selected={isSelected}
                  testId={`resource-type-card-${normalizeTestId(label)}`}
                  onClick={() => onSelect(sel)}
                />
              );
            },
          )}
          {/* Document items */}
          <DashboardCard
            icon={<Package className="h-4 w-4" />}
            label="Packages"
            count={(document.packages ?? []).length}
            selected={selection.id === "packages"}
            onClick={() => onSelect({ id: "packages" })}
          />
          {(document.products ?? []).length > 0 && (
            <DashboardCard
              icon={<ShoppingBag className="h-4 w-4" />}
              label="Products"
              count={(document.products ?? []).length}
            />
          )}
          <DashboardCard
            icon={<Box className="h-4 w-4" />}
            label="Consumption Bundles"
            count={(document.consumptionBundles ?? []).length}
            selected={selection.id === "consumptionBundles"}
            onClick={() => onSelect({ id: "consumptionBundles" })}
          />
          {(document.vendors ?? []).length > 0 && (
            <DashboardCard
              icon={<Building2 className="h-4 w-4" />}
              label="Vendors"
              count={(document.vendors ?? []).length}
            />
          )}
          {(document.groups ?? []).length > 0 && (
            <DashboardCard
              icon={<Users className="h-4 w-4" />}
              label="Groups"
              count={(document.groups ?? []).length}
            />
          )}
        </div>

        {selection.id === "resourceList" && (
          <ResourceListPage
            resourceType={selection.resourceType}
            query={query}
            filters={filters}
            onSelect={(ordId) => onSelectDetail(selection.resourceType, ordId)}
          />
        )}
        {selection.id === "packages" && <PackagesPage onSelect={onSelect} />}
        {selection.id === "consumptionBundles" && (
          <ConsumptionBundlesPage onSelect={onSelect} />
        )}
        {selection.id === "products" && <ProductsPage onSelect={onSelect} />}
        {selection.id === "groups" && <GroupsPage onSelect={onSelect} />}
      </div>
    </div>
  );
}
