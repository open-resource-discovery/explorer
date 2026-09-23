import { useDeferredValue, useEffect, useRef, useState } from "react";
import type { OrdDocument } from "@open-resource-discovery/specification";
import { OrdDocumentContext } from "@lib/context/OrdDocumentContext";
import { DefinitionContentProvider } from "@lib/context/DefinitionContentProvider";
import { NavExtensionContext } from "@lib/context/NavExtensionContext";
import { ThemeRootContent } from "@lib/components/ThemeRoot";
import { DashboardPage } from "./pages/DashboardPage";
import { PackageDetailPage } from "./pages/PackageDetailPage";
import { ConsumptionBundleDetailPage } from "./pages/ConsumptionBundleDetailPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { ResourceDetailPage } from "./pages/ResourceDetailPage";
import { ExplorerSidebar } from "./ExplorerSidebar";
import { useNavState } from "./useNavState";
import type { Selection } from "./useNavState";
import { RESOURCE_TYPE_CONFIG } from "./resourceTypeConfig";
import { useProxy } from "@lib/proxy";
import { ConnectionIdContext } from "@lib/context/ConnectionIdContext";
import { asBase } from "./pages/ResourceCard";
import { useContext } from "react";

export type { ResourceTypeGroup } from "./explorerTypes";

function firstNonEmptySelection(document: OrdDocument): Selection {
  for (const { type } of RESOURCE_TYPE_CONFIG) {
    if ((document[type] ?? []).length > 0) {
      return { id: "resourceList", resourceType: type };
    }
  }
  return { id: "dashboard" };
}

export interface ORDExplorerProps {
  document: OrdDocument;
  className?: string;
  connectionId?: string;
  prefetchDefinitions?: boolean;
  /** When true, serialises navigation and filter state into the URL hash so
   *  views are deep-linkable and survive reload. Leave false (default) when
   *  embedding in a host app that manages its own routing. */
  enableUrlSync?: boolean;
}

export function ORDExplorer({
  document,
  className,
  connectionId = "",
  prefetchDefinitions = false,
  enableUrlSync = false,
}: ORDExplorerProps) {
  const [defaultSelection] = useState(() => firstNonEmptySelection(document));
  const { selection, query, filters, setSelection, setQuery, setFilters } =
    useNavState(enableUrlSync, defaultSelection);
  const deferredFilters = useDeferredValue(filters);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const scrollRef = useRef<HTMLDivElement>(null);
  const proxy = useProxy();
  const { setResourceDetailLabel, setResetExplorer } =
    useContext(NavExtensionContext);

  useEffect(() => {
    setResetExplorer(() => setSelection(defaultSelection));
    return () => setResetExplorer(() => {});
  }, [setResetExplorer, setSelection, defaultSelection]);

  useEffect(() => {
    if (selection.id === "resourceDetail") {
      const resources = (document[selection.resourceType] ?? []) as Parameters<
        typeof asBase
      >[0][];
      const resource = resources.find(
        (r) => asBase(r).ordId === selection.ordId,
      );
      setResourceDetailLabel(
        resource ? asBase(resource).title : selection.ordId,
      );
    } else {
      setResourceDetailLabel(null);
    }
  }, [selection, document, setResourceDetailLabel]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [selection]);

  return (
    <OrdDocumentContext.Provider value={document}>
      <ConnectionIdContext.Provider value={connectionId}>
        <DefinitionContentProvider
          document={document}
          prefetch={prefetchDefinitions}
          connectionId={connectionId}
          proxyAvailable={proxy.available}
          proxyBaseUrl={proxy.proxyBaseUrl}
        >
          <ThemeRootContent className={className}>
            <div className="flex h-full overflow-hidden">
              {/* Left sidebar */}
              <ExplorerSidebar
                query={query}
                filters={filters}
                selection={selection}
                onQueryChange={setQuery}
                onFiltersChange={setFilters}
                onSelect={setSelection}
                width={sidebarWidth}
                onWidthChange={setSidebarWidth}
              />

              {/* Main content */}
              <div
                className="flex min-w-0 flex-1 flex-col overflow-auto"
                ref={scrollRef}
              >
                <div className="w-full max-w-[1080px] mx-auto">
                  {(selection.id === "dashboard" ||
                    selection.id === "resourceList" ||
                    selection.id === "packages" ||
                    selection.id === "consumptionBundles" ||
                    selection.id === "products" ||
                    selection.id === "groups") && (
                    <DashboardPage
                      query={query}
                      filters={deferredFilters}
                      selection={selection}
                      onSelect={setSelection}
                      onSelectDetail={(resourceType, ordId) =>
                        setSelection({
                          id: "resourceDetail",
                          resourceType,
                          ordId,
                        })
                      }
                    />
                  )}
                  {selection.id === "resourceDetail" && (
                    <ResourceDetailPage
                      key={`${selection.resourceType}/${selection.ordId}`}
                      resourceType={selection.resourceType}
                      ordId={selection.ordId}
                      onSelect={setSelection}
                    />
                  )}
                  {selection.id === "packageDetail" && (
                    <PackageDetailPage
                      ordId={selection.ordId}
                      onSelect={setSelection}
                    />
                  )}
                  {selection.id === "consumptionBundleDetail" && (
                    <ConsumptionBundleDetailPage
                      ordId={selection.ordId}
                      onSelect={setSelection}
                    />
                  )}
                  {selection.id === "productDetail" && (
                    <ProductDetailPage
                      ordId={selection.ordId}
                      onSelect={setSelection}
                    />
                  )}
                  {selection.id === "groupDetail" && (
                    <GroupDetailPage
                      groupId={selection.groupId}
                      onSelect={setSelection}
                    />
                  )}
                </div>
              </div>
            </div>
          </ThemeRootContent>
        </DefinitionContentProvider>
      </ConnectionIdContext.Provider>
    </OrdDocumentContext.Provider>
  );
}
