import { useState } from "react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { Badge } from "@open-resource-discovery/ui-components";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { ResourceTypeGroup } from "../ORDExplorer";
import { RESOURCE_TYPE_CONFIG } from "../resourceTypeConfig";
import type { AnyResource, WithChangelog } from "./resourceTypes";
import { asBase } from "./resourceTypes";
import { VISIBILITY_PILL, RELEASE_STATUS_PILL } from "./pillConfig";
import { CopyButton } from "./shared";
import { getResourceDefinitions } from "./definitionUtils";
import { OverviewTab } from "./OverviewTab";
import { formatDate } from "./overviews/OverviewBase";
import { SchemaTab } from "./SchemaTab";
import { RawJsonTab } from "./RawJsonTab";
import { ChangelogTab } from "./ChangelogTab";
import type { Selection } from "../useNavState";
import { ordIdToResourceTypeGroup } from "../ordIdUtils";

type Tab = "overview" | "schema" | "raw" | "changelog";

const TABS: {
  id: Tab;
  label: string;
  getCount?: (r: AnyResource, t: ResourceTypeGroup) => number;
  show?: (r: AnyResource) => boolean;
}[] = [
  { id: "overview", label: "Overview" },
  {
    id: "schema",
    label: "Resource Definitions",
    getCount: (r, t) => getResourceDefinitions(r, t).length,
  },
  { id: "raw", label: "Raw JSON" },
  {
    id: "changelog",
    label: "Changelog",
    getCount: (r) => (r as WithChangelog).changelogEntries?.length ?? 0,
    show: (r) => !!(r as WithChangelog).changelogEntries?.length,
  },
];

export interface ResourceDetailPageProps {
  resourceType: ResourceTypeGroup;
  ordId: string;
  onSelect: (s: Selection) => void;
}

export function ResourceDetailPage({
  resourceType,
  ordId,
  onSelect,
}: ResourceDetailPageProps) {
  const document = useOrdDocument();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const resources = (document[resourceType] ?? []) as AnyResource[];
  const resource = resources.find((r) => asBase(r).ordId === ordId);

  if (!resource) {
    return (
      <div className="px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Resource not found: {ordId}
        </p>
      </div>
    );
  }

  const base = asBase(resource);
  const iconCfg = RESOURCE_TYPE_CONFIG.find((c) => c.type === resourceType)!;
  const visPill = base.visibility
    ? VISIBILITY_PILL[base.visibility]
    : undefined;
  const statusCfg = base.releaseStatus
    ? RELEASE_STATUS_PILL[base.releaseStatus]
    : undefined;

  const isDeprecatedOrSunset =
    base.releaseStatus === "deprecated" || base.releaseStatus === "sunset";
  const successors =
    (resource as AnyResource & { successors?: string[] }).successors ?? [];

  return (
    <div className="bg-background" data-testid="resource-detail">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-start gap-3 mb-2">
          <div
            className={`shrink-0 rounded-lg border border-border/60 p-2 ${iconCfg.bg} ${iconCfg.fg}`}
          >
            {iconCfg.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-card-fg">{base.title}</h1>
              {base.version && (
                <Badge variant="outline" size="sm">
                  v{base.version}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <span className="text-sm text-muted-foreground">
                {iconCfg.singular}
              </span>
              {(visPill || statusCfg) && (
                <span className="text-muted-foreground">·</span>
              )}
              {visPill && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${visPill.pill}`}
                >
                  {visPill.icon}
                  {base.visibility === "public" ? "Public" : base.visibility}
                </span>
              )}
              {statusCfg && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusCfg.pill}`}
                >
                  {statusCfg.icon}
                  {statusCfg.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mb-0 mt-2">
              <code className="text-xs font-mono bg-muted/40 border border-border rounded px-2 py-1 text-muted-foreground">
                {base.ordId}
              </code>
              <CopyButton text={base.ordId} />
            </div>
          </div>
        </div>

        {isDeprecatedOrSunset &&
          (base.deprecationDate ||
            base.sunsetDate ||
            successors.length > 0) && (
            <div className="flex flex-col gap-0.5 rounded border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 mb-3">
              {base.deprecationDate && (
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3 shrink-0" />
                  Deprecated: {formatDate(base.deprecationDate)}
                </span>
              )}
              {base.sunsetDate && (
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3 shrink-0" />
                  Sunset: {formatDate(base.sunsetDate)}
                </span>
              )}
              {successors.length > 0 && (
                <span className="flex items-center gap-1 flex-wrap">
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  Use instead:{" "}
                  {successors.map((s) => {
                    const rtype = ordIdToResourceTypeGroup(s);
                    const found = rtype
                      ? (
                          document[rtype] as
                            { ordId: string; title: string }[] | undefined
                        )?.find((r) => r.ordId === s)
                      : undefined;
                    return rtype && found ? (
                      <button
                        key={s}
                        onClick={() =>
                          onSelect({
                            id: "resourceDetail",
                            resourceType: rtype,
                            ordId: s,
                          })
                        }
                        className="font-mono truncate max-w-xs underline hover:text-orange-600 dark:hover:text-orange-200 transition-colors"
                        title={s}
                      >
                        {found.title}
                      </button>
                    ) : (
                      <span
                        key={s}
                        className="font-mono truncate max-w-xs"
                        title={s}
                      >
                        {s}
                      </span>
                    );
                  })}
                </span>
              )}
            </div>
          )}

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-border -mb-px">
          {TABS.filter((tab) => !tab.show || tab.show(resource)).map((tab) => {
            const count = tab.getCount
              ? tab.getCount(resource, resourceType)
              : undefined;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`detail-tab-${tab.id}`}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span
                    className={`ml-1.5 rounded-full text-[10px] px-1.5 py-0.5 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-6">
        {activeTab === "overview" && (
          <OverviewTab
            resource={resource}
            resourceType={resourceType}
            onSelect={onSelect}
          />
        )}
        {activeTab === "schema" && (
          <SchemaTab resource={resource} resourceType={resourceType} />
        )}
        {activeTab === "raw" && <RawJsonTab resource={resource} />}
        {activeTab === "changelog" && <ChangelogTab resource={resource} />}
      </div>
    </div>
  );
}
