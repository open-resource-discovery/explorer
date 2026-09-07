import type { ReactNode } from "react";
import { useMemo } from "react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import {
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  BanIcon,
  Building2,
  Lock,
  CheckCircle2,
  FlaskConical,
  Code2,
  AlertTriangle,
  Sunset as SunsetIcon,
} from "lucide-react";
import type { ResourceTypeGroup } from "../ORDExplorer";
import type { SearchFilters } from "../SearchBar";
import type {
  Agent,
  ApiResource,
  Capability,
  DataProduct,
  EntityType,
  EventResource,
  IntegrationDependency,
} from "@open-resource-discovery/specification";
import { useResourceSearch, type MatchInfo } from "../useResourceSearch";
import { RESOURCE_TYPE_CONFIG } from "../resourceTypeConfig";
import { CopyButton } from "./shared";

const PROTOCOL_LABEL: Record<string, string> = {
  rest: "REST",
  "odata-v4": "OData v4",
  "odata-v2": "OData v2",
  graphql: "GraphQL",
  soap: "SOAP",
  "sap-rfc": "RFC",
  mcp: "MCP",
  websocket: "WebSocket",
  a2a: "A2A",
  "delta-sharing": "Delta Sharing",
  "soap-inbound": "SOAP↓",
  "soap-outbound": "SOAP↑",
};

const DIRECTION_ICON: Record<string, ReactNode> = {
  inbound: <ArrowDownToLine className="h-3 w-3" />,
  outbound: <ArrowUpFromLine className="h-3 w-3" />,
  mixed: <ArrowLeftRight className="h-3 w-3" />,
};

const ENTITY_LEVEL_LABEL: Record<string, string> = {
  aggregate: "Aggregate",
  "root-entity": "Root",
  "sub-entity": "Sub",
};

// Colored visibility pill — public is intentionally absent (default, not worth labeling)
const VISIBILITY_PILL: Record<string, { icon: ReactNode; pill: string }> = {
  internal: {
    icon: <Building2 className="h-3 w-3" />,
    pill: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400",
  },
  private: {
    icon: <Lock className="h-3 w-3" />,
    pill: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400",
  },
};

// Dot color + pill color for release status
const RELEASE_STATUS_PILL: Record<
  string,
  { dot: string; pill: string; label: string; icon: ReactNode }
> = {
  active: {
    dot: "bg-emerald-500",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
    label: "Active",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  beta: {
    dot: "bg-amber-500",
    pill: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
    label: "Beta",
    icon: <FlaskConical className="h-3 w-3" />,
  },
  development: {
    dot: "bg-indigo-500",
    pill: "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400",
    label: "Dev",
    icon: <Code2 className="h-3 w-3" />,
  },
  deprecated: {
    dot: "bg-orange-500",
    pill: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
    label: "Deprecated",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  sunset: {
    dot: "bg-red-500",
    pill: "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
    label: "Sunset",
    icon: <SunsetIcon className="h-3 w-3" />,
  },
};

const PLACEHOLDER_SHORT_DESCRIPTION = "No short description provided";

// Minimal shared shape present on every resource union member.
interface ResourceBase {
  ordId: string;
  title: string;
  shortDescription?: string;
  version?: string;
  visibility?: string;
  releaseStatus?: string;
  disabled?: boolean;
  tags?: string[];
  links?: { url: string; title: string }[];
  partOfPackage: string;
  partOfConsumptionBundles?: { ordId: string }[];
}

type AnyResource =
  | ApiResource
  | EventResource
  | EntityType
  | DataProduct
  | Capability
  | Agent
  | IntegrationDependency;

// Cast is safe: ordId is required on every concrete union member.
function asBase(resource: AnyResource): ResourceBase {
  return resource as unknown as ResourceBase;
}

interface TypeSpecificProps {
  protocol?: string;
  direction?: string;
  level?: string;
  capabilityType?: string;
  mandatory?: boolean;
}

function getTypeSpecificProps(
  resource: AnyResource,
  resourceType: ResourceTypeGroup,
): TypeSpecificProps {
  switch (resourceType) {
    case "apiResources": {
      const r = resource as ApiResource;
      return { protocol: r.apiProtocol, direction: r.direction };
    }
    case "entityTypes":
      return { level: (resource as EntityType).level };
    case "capabilities":
      return { capabilityType: (resource as Capability).type };
    case "integrationDependencies":
      return { mandatory: (resource as IntegrationDependency).mandatory };
    default:
      return {};
  }
}

// Renders a string with uFuzzy match ranges highlighted.
// ranges are [start, end] pairs where end is exclusive (uFuzzy convention).
function HighlightedText({
  text,
  ranges,
}: {
  text: string;
  ranges?: [number, number][];
}) {
  if (!ranges || ranges.length === 0) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark
        key={start}
        className="bg-yellow-200 text-yellow-900 rounded-[2px] px-px"
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

interface ResourceCardProps {
  resource: AnyResource;
  resourceType: ResourceTypeGroup;
  match?: MatchInfo;
  onSelect: (ordId: string) => void;
}

function ResourceCard({
  resource,
  resourceType,
  match,
  onSelect,
}: ResourceCardProps) {
  const base = asBase(resource);
  const { protocol, direction, level, capabilityType, mandatory } =
    getTypeSpecificProps(resource, resourceType);
  const { releaseStatus, visibility, disabled, version, ordId } = base;

  const iconCfg = RESOURCE_TYPE_CONFIG.find((c) => c.type === resourceType)!;
  const visPill = visibility ? VISIBILITY_PILL[visibility] : undefined;
  const statusCfg = releaseStatus
    ? RELEASE_STATUS_PILL[releaseStatus]
    : undefined;

  return (
    <div
      className={`flex flex-col gap-3 rounded-[var(--ord-radius)] border border-border bg-card-bg p-4 hover:shadow-[0_2px_6px_#0002] hover:border-border/80 transition-all cursor-pointer${disabled ? " opacity-50" : ""}`}
      data-testid={`resource-card-${ordId}`}
      onClick={() => onSelect(ordId)}
    >
      {/* Header: icon box + subtitle + arrow */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`shrink-0 rounded-lg border border-border/60 p-1.5 ${iconCfg.bg} ${iconCfg.fg}`}
          >
            {iconCfg.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-card-fg leading-snug truncate">
              <HighlightedText
                text={resource.title ?? ""}
                ranges={match?.titleRanges}
              />
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {iconCfg.singular}
              {version ? ` · v${version}` : ""}
            </p>
          </div>
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5"
          aria-hidden="true"
        />
      </div>

      {/* Short description */}
      {base.shortDescription &&
        base.shortDescription !== PLACEHOLDER_SHORT_DESCRIPTION && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {base.shortDescription}
          </p>
        )}

      {/* Footer: pills + ordId */}
      <div className="flex flex-col gap-1.5 mt-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {disabled && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium border-border text-muted-foreground">
              <BanIcon className="h-3 w-3" />
              disabled
            </span>
          )}
          {visPill && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${visPill.pill}`}
            >
              {visPill.icon}
              {visibility}
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
          {protocol && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {PROTOCOL_LABEL[protocol] ?? protocol}
            </span>
          )}
          {direction && DIRECTION_ICON[direction] && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {DIRECTION_ICON[direction]}
              {direction}
            </span>
          )}
          {level && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {ENTITY_LEVEL_LABEL[level] ?? level}
            </span>
          )}
          {capabilityType && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {capabilityType.split(":").pop() ?? capabilityType}
            </span>
          )}
          {mandatory === true && (
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              mandatory
            </span>
          )}
          {mandatory === false && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              optional
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <code className="text-[10px] font-mono text-muted-foreground truncate flex-1">
            {ordId}
          </code>
          <CopyButton text={ordId} />
        </div>
      </div>
    </div>
  );
}

interface ResourceListPageProps {
  resourceType: ResourceTypeGroup;
  query: string;
  filters: SearchFilters;
  onSelect: (ordId: string) => void;
}

export function ResourceListPage({
  resourceType,
  query,
  filters,
  onSelect,
}: ResourceListPageProps) {
  const document = useOrdDocument();

  const resources = useMemo(
    () => (document[resourceType] ?? []) as AnyResource[],
    [document, resourceType],
  );

  const { filteredResources, matchMap } = useResourceSearch(
    resources,
    query,
    filters,
  );

  const visibleResources = useMemo(
    () =>
      matchMap !== null
        ? filteredResources.filter((r) => matchMap.has(asBase(r).ordId))
        : filteredResources,
    [filteredResources, matchMap],
  );

  return (
    <div data-testid="resource-list">
      {visibleResources.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {query.trim()
            ? `No results for "${query}".`
            : resources.length === 0
              ? `No ${RESOURCE_TYPE_CONFIG.find((c) => c.type === resourceType)!.label.toLowerCase()} found.`
              : "No resources match the active filters."}
        </p>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {visibleResources.map((r) => (
          <ResourceCard
            key={asBase(r).ordId}
            resource={r}
            resourceType={resourceType}
            match={matchMap?.get(asBase(r).ordId)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
