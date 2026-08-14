import type { ReactNode } from "react";
import { useState } from "react";
import { Badge, Button } from "@open-resource-discovery/ui-components";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  BanIcon,
  FileCode2,
  CalendarClock,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Globe,
} from "lucide-react";
import type { ResourceTypeGroup } from "../ORDExplorer";
import type {
  Agent,
  ApiResource,
  Capability,
  DataProduct,
  EntityType,
  EventResource,
  IntegrationDependency,
} from "@open-resource-discovery/specification";

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

const RESOURCE_DEFINITION_LABEL: Record<string, string> = {
  "openapi-v2": "OpenAPI 2",
  "openapi-v3": "OpenAPI 3",
  "openapi-v3.1+": "OpenAPI 3.1",
  "raml-v1": "RAML v1",
  edmx: "EDMX",
  "csdl-json": "CSDL JSON",
  "graphql-sdl": "GraphQL SDL",
  "wsdl-v1": "WSDL v1",
  "wsdl-v2": "WSDL v2",
  "asyncapi-v2": "AsyncAPI 2",
  "asyncapi-v3": "AsyncAPI 3",
  "sap-rfc-metadata-v1": "RFC Metadata",
  "sap-sql-api-definition-v1": "SQL API",
  "a2a-agent-card": "A2A Agent Card",
};

export const RESOURCE_TYPE_LABEL: Record<ResourceTypeGroup, string> = {
  apiResources: "APIs",
  eventResources: "Events",
  entityTypes: "Entity Types",
  dataProducts: "Data Products",
  capabilities: "Capabilities",
  agents: "Agents",
  integrationDependencies: "Integrations",
};

// Minimal shared shape present on every resource union member.
export interface ResourceBase {
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

export type AnyResource =
  | ApiResource
  | EventResource
  | EntityType
  | DataProduct
  | Capability
  | Agent
  | IntegrationDependency;

// Cast is safe: ordId is required on every concrete union member.
export function asBase(resource: AnyResource): ResourceBase {
  return resource as unknown as ResourceBase;
}

function getProtocol(
  resource: AnyResource,
  resourceType: ResourceTypeGroup,
): string | undefined {
  if (resourceType === "apiResources")
    return (resource as ApiResource).apiProtocol;
  return undefined;
}

function getCapabilityType(
  resource: AnyResource,
  resourceType: ResourceTypeGroup,
): string | undefined {
  if (resourceType === "capabilities") return (resource as Capability).type;
  return undefined;
}

function getDirection(
  resource: AnyResource,
  resourceType: ResourceTypeGroup,
): string | undefined {
  if (resourceType === "apiResources")
    return (resource as ApiResource).direction;
  return undefined;
}

function getLevel(
  resource: AnyResource,
  resourceType: ResourceTypeGroup,
): string | undefined {
  if (resourceType === "entityTypes") return (resource as EntityType).level;
  return undefined;
}

type BadgeVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "success"
  | "warning"
  | "highlight";

const RELEASE_STATUS_BADGE: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  beta: { label: "beta", variant: "warning" },
  development: { label: "dev", variant: "warning" },
  deprecated: { label: "deprecated", variant: "destructive" },
  sunset: { label: "sunset", variant: "destructive" },
};

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

export interface MatchInfo {
  titleRanges?: [number, number][];
  ordIdRanges?: [number, number][];
}

export interface ResourceCardProps {
  resource: AnyResource;
  resourceType: ResourceTypeGroup;
  match?: MatchInfo;
}

export function ResourceCard({
  resource,
  resourceType,
  match,
}: ResourceCardProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const base = asBase(resource);
  const protocol = getProtocol(resource, resourceType);
  const capabilityType = getCapabilityType(resource, resourceType);
  const direction = getDirection(resource, resourceType);
  const level = getLevel(resource, resourceType);
  const { releaseStatus, visibility, disabled, version, ordId } = base;
  const mandatory =
    resourceType === "integrationDependencies"
      ? (resource as IntegrationDependency).mandatory
      : undefined;

  // Resource definitions: each type uses its own field name.
  const rawDefs =
    resourceType === "apiResources"
      ? (resource as ApiResource).resourceDefinitions
      : resourceType === "eventResources"
        ? (resource as EventResource).resourceDefinitions
        : resourceType === "capabilities" || resourceType === "entityTypes"
          ? (resource as Capability).definitions
          : undefined;
  const resourceDefinitions = rawDefs?.map((d) => ({
    type: (d as { type: string }).type,
    url: (d as { url: string }).url,
  }));

  const deprecationDate =
    resourceType !== "integrationDependencies"
      ? (resource as ApiResource).deprecationDate
      : undefined;
  const sunsetDate = (resource as ApiResource).sunsetDate;
  const successors = (resource as ApiResource).successors;
  const isDeprecatedOrSunset =
    releaseStatus === "deprecated" || releaseStatus === "sunset";
  const description = (resource as ApiResource).description;
  const hasLongDesc =
    description &&
    description !== base.shortDescription &&
    description.length > 0;

  // DataProduct-specific fields.
  const dp = resourceType === "dataProducts" ? (resource as DataProduct) : null;
  const dpType = dp?.type;
  const dpCategory = dp?.category;
  const dpLifecycle = dp?.lifecycleStatus;
  const dpResponsible = dp?.responsible;
  const dpOutputPorts = dp?.outputPorts ?? [];
  const dpInputPortCount = dp?.inputPorts?.length ?? 0;
  const dpOutputPortCount = dpOutputPorts.length;

  // Agent-specific fields.
  const agent = resourceType === "agents" ? (resource as Agent) : null;
  const agentExposedApis = agent?.exposedApiResources ?? [];
  const agentIntegrationDeps = agent?.integrationDependencies ?? [];

  // Integration dependency aspects.
  const aspects =
    resourceType === "integrationDependencies"
      ? ((resource as IntegrationDependency).aspects ?? [])
      : [];

  // Typed resource-specific links.
  const resourceLinks =
    resourceType === "apiResources"
      ? ((resource as ApiResource).apiResourceLinks ?? [])
      : resourceType === "eventResources"
        ? ((resource as EventResource).eventResourceLinks ?? [])
        : resourceType === "dataProducts"
          ? ((resource as DataProduct).dataProductLinks ?? [])
          : [];

  // API entry points.
  const entryPoints =
    resourceType === "apiResources"
      ? ((resource as ApiResource).entryPoints ?? [])
      : [];

  const links = base.links ?? [];
  const tags = base.tags ?? [];

  // responsible is on most resource types except IntegrationDependency.
  const responsible =
    resourceType === "dataProducts"
      ? undefined
      : resourceType === "integrationDependencies"
        ? undefined
        : (resource as ApiResource).responsible;

  const policyLevel = (resource as ApiResource).policyLevel;
  const customPolicyLevel = (resource as ApiResource).customPolicyLevel;
  const systemInstanceAware = (resource as ApiResource).systemInstanceAware;

  // partOfConsumptionBundles references.
  const consumptionBundleRefs = base.partOfConsumptionBundles ?? [];

  return (
    <div
      className={`flex flex-col gap-1.5 px-4 py-3 bg-card-bg border-b border-border last:border-b-0 ${disabled ? "opacity-50" : ""}`}
      data-testid={`resource-row-${ordId}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-card-fg leading-snug">
          <HighlightedText
            text={resource.title ?? ""}
            ranges={match?.titleRanges}
          />
        </span>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {disabled && (
            <Badge
              variant="outline"
              size="sm"
              className="text-muted-foreground"
            >
              <BanIcon className="h-3 w-3 mr-0.5" />
              disabled
            </Badge>
          )}
          {mandatory === true && (
            <Badge variant="destructive" size="sm">
              mandatory
            </Badge>
          )}
          {mandatory === false && (
            <Badge variant="outline" size="sm">
              optional
            </Badge>
          )}
          {level && (
            <Badge variant="secondary" size="sm">
              {ENTITY_LEVEL_LABEL[level] ?? level}
            </Badge>
          )}
          {capabilityType && (
            <Badge variant="outline" size="sm">
              {capabilityType.split(":").pop() ?? capabilityType}
            </Badge>
          )}
          {direction && DIRECTION_ICON[direction] && (
            <Badge variant="outline" size="sm" title={direction}>
              {DIRECTION_ICON[direction]}
              {direction}
            </Badge>
          )}
          {protocol && (
            <Badge variant="outline" size="sm">
              {PROTOCOL_LABEL[protocol] ?? protocol}
            </Badge>
          )}
          {visibility && visibility !== "public" && (
            <Badge variant="secondary" size="sm">
              {visibility}
            </Badge>
          )}
          {releaseStatus && RELEASE_STATUS_BADGE[releaseStatus] && (
            <Badge
              variant={RELEASE_STATUS_BADGE[releaseStatus].variant}
              size="sm"
            >
              {RELEASE_STATUS_BADGE[releaseStatus].label}
            </Badge>
          )}
        </div>
      </div>
      {base.shortDescription && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {base.shortDescription}
        </p>
      )}
      {hasLongDesc && (
        <div>
          {descExpanded && (
            <p className="text-xs text-muted-foreground whitespace-pre-line mb-1">
              {description}
            </p>
          )}
          <Button
            onClick={() => setDescExpanded((v) => !v)}
            aria-expanded={descExpanded}
            aria-label={`${descExpanded ? "Collapse" : "Expand"} description for ${resource.title}`}
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`h-3 w-3 transition-transform ${descExpanded ? "rotate-180" : ""}`}
            />
            {descExpanded ? "Less" : "More"}
          </Button>
        </div>
      )}
      {resourceDefinitions && resourceDefinitions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resourceDefinitions.map((def, i) => (
            <a
              key={i}
              href={def.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${RESOURCE_DEFINITION_LABEL[def.type] ?? def.type} (opens in new tab)`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <FileCode2 className="h-3 w-3" aria-hidden="true" />
              {RESOURCE_DEFINITION_LABEL[def.type] ?? def.type}
            </a>
          ))}
        </div>
      )}
      {entryPoints.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entryPoints.map((ep, i) => (
            <a
              key={i}
              href={ep}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Entry point: ${ep} (opens in new tab)`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Globe className="h-3 w-3" aria-hidden="true" />
              {ep}
            </a>
          ))}
        </div>
      )}
      {dp && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {dpType && (
            <span>
              <span className="font-medium text-card-fg">{dpType}</span> type
            </span>
          )}
          {dpCategory && (
            <span>
              <span className="font-medium text-card-fg">{dpCategory}</span>{" "}
              category
            </span>
          )}
          {dpInputPortCount > 0 && (
            <span>
              {dpInputPortCount} input port{dpInputPortCount !== 1 ? "s" : ""}
            </span>
          )}
          {dpOutputPortCount > 0 && (
            <span>
              {dpOutputPortCount} output port
              {dpOutputPortCount !== 1 ? "s" : ""}
            </span>
          )}
          {dpOutputPorts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dpOutputPorts.map((op) => (
                <span
                  key={op.ordId}
                  className="font-mono text-xs text-muted-foreground bg-muted rounded px-1"
                  title={op.ordId}
                >
                  {op.ordId}
                </span>
              ))}
            </div>
          )}
          {dpLifecycle && dpLifecycle !== "active" && (
            <Badge variant="warning" size="sm">
              {dpLifecycle.replace(/-/g, " ")}
            </Badge>
          )}
          {dpResponsible && (
            <span>
              by{" "}
              <span className="font-medium text-card-fg">{dpResponsible}</span>
            </span>
          )}
        </div>
      )}
      {agent &&
        (agentExposedApis.length > 0 || agentIntegrationDeps.length > 0) && (
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            {agentExposedApis.length > 0 && (
              <span className="flex items-center gap-1 flex-wrap">
                <span className="shrink-0">Exposes:</span>
                {agentExposedApis.map((a) => (
                  <span
                    key={a.ordId}
                    className="font-mono bg-muted rounded px-1"
                    title={a.ordId}
                  >
                    {a.ordId}
                  </span>
                ))}
              </span>
            )}
            {agentIntegrationDeps.length > 0 && (
              <span>
                {agentIntegrationDeps.length} integration dep
                {agentIntegrationDeps.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      {aspects.length > 0 && (
        <div className="flex flex-col gap-1 mt-0.5">
          {aspects.map((asp, i) => (
            <div
              key={i}
              className="text-xs text-muted-foreground flex items-start gap-1.5"
            >
              {asp.mandatory ? (
                <Badge variant="destructive" size="sm">
                  mandatory
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">
                  optional
                </Badge>
              )}
              <span className="truncate">{asp.title}</span>
              {(asp.apiResources ?? []).length > 0 && (
                <span className="font-mono truncate">
                  {(asp.apiResources ?? []).map((r) => r.ordId).join(", ")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {isDeprecatedOrSunset &&
        (deprecationDate ||
          sunsetDate ||
          (successors && successors.length > 0)) && (
          <div className="flex flex-col gap-0.5 rounded border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300">
            {deprecationDate && (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3 shrink-0" />
                Deprecated: {deprecationDate}
              </span>
            )}
            {sunsetDate && (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3 shrink-0" />
                Sunset: {sunsetDate}
              </span>
            )}
            {successors && successors.length > 0 && (
              <span className="flex items-center gap-1 flex-wrap">
                <ArrowRight className="h-3 w-3 shrink-0" />
                Use instead:{" "}
                {successors.map((s) => (
                  <span
                    key={s}
                    className="font-mono truncate max-w-xs"
                    title={s}
                  >
                    {s}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}
      {(resourceLinks.length > 0 || links.length > 0) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {resourceLinks.map((rl, i) => (
            <a
              key={`rl-${i}`}
              href={(rl as { url: string }).url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${(rl as { type: string }).type.replace(/-/g, " ")} (opens in new tab)`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              {(rl as { type: string }).type.replace(/-/g, " ")}
            </a>
          ))}
          {links.map((l, i) => (
            <a
              key={`l-${i}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${l.title} (opens in new tab)`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              {l.title}
            </a>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        {version && (
          <span className="text-xs font-mono text-muted-foreground">
            v{version}
          </span>
        )}
        {ordId && (
          <p
            className={`text-xs font-mono text-muted-foreground ${match?.ordIdRanges ? "" : "truncate"}`}
          >
            <HighlightedText text={ordId} ranges={match?.ordIdRanges} />
          </p>
        )}
      </div>
      {consumptionBundleRefs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground shrink-0">Auth:</span>
          {consumptionBundleRefs.map((ref) => (
            <span
              key={ref.ordId}
              className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-xs"
              title={ref.ordId}
            >
              {ref.ordId}
            </span>
          ))}
        </div>
      )}
      {(tags.length > 0 ||
        responsible ||
        policyLevel ||
        systemInstanceAware) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {systemInstanceAware && (
            <Badge
              variant="outline"
              size="sm"
              title="Behaviour differs per tenant"
            >
              tenant-aware
            </Badge>
          )}
          {policyLevel && policyLevel !== "none" && (
            <Badge variant="outline" size="sm">
              {policyLevel === "custom"
                ? (customPolicyLevel ?? "custom")
                : policyLevel}
            </Badge>
          )}
          {responsible && (
            <span className="text-xs text-muted-foreground">{responsible}</span>
          )}
          {tags.map((t) => (
            <span
              key={t}
              className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
