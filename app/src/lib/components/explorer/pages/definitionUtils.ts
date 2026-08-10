import type {
  ApiResource,
  EventResource,
  EntityType,
  Capability,
} from "@open-resource-discovery/specification";
import type { AnyResource } from "./resourceTypes";
import type { ResourceTypeGroup } from "../ORDExplorer";

export type ResourceDefinition = {
  type: string;
  customType?: string;
  mediaType?: string;
  url?: string;
  purpose?: string;
  accessStrategies?: { type: string; customType?: string }[];
};

export const RENDERABLE_DEF_TYPES = new Set([
  "openapi-v2",
  "openapi-v3",
  "openapi-v3.1+",
  "asyncapi-v2",
  "asyncapi-v3",
  "a2a-agent-card",
  "sap-csn-interop-effective-v1",
]);

const RENDERABLE_TYPE_PRIORITY = [
  "openapi-v3.1+",
  "openapi-v3",
  "openapi-v2",
  "asyncapi-v3",
  "asyncapi-v2",
  "a2a-agent-card",
  "sap-csn-interop-effective-v1",
];

export function getResourceDefinitions(
  resource: AnyResource,
  resourceType: ResourceTypeGroup,
): ResourceDefinition[] {
  switch (resourceType) {
    case "apiResources":
      return ((resource as ApiResource).resourceDefinitions ??
        []) as ResourceDefinition[];
    case "eventResources":
      return ((resource as EventResource).resourceDefinitions ??
        []) as ResourceDefinition[];
    case "entityTypes":
      return ((resource as EntityType).definitions ??
        []) as ResourceDefinition[];
    case "capabilities":
      return ((resource as Capability).definitions ??
        []) as ResourceDefinition[];
    default:
      return (
        (
          resource as unknown as {
            resourceDefinitions?: ResourceDefinition[];
          }
        ).resourceDefinitions ?? []
      );
  }
}

export function pickPrimaryDefinition(
  defs: ResourceDefinition[],
): ResourceDefinition | null {
  const withUrl = defs.filter((d) => !!d.url);
  const primaries = withUrl.filter((d) => !d.purpose);
  const candidates = primaries.length > 0 ? primaries : withUrl;
  const renderable = candidates.find((d) => RENDERABLE_DEF_TYPES.has(d.type));
  if (renderable) {
    const byPriority = RENDERABLE_TYPE_PRIORITY.map((t) =>
      candidates.find((d) => d.type === t),
    ).find(Boolean);
    return byPriority ?? renderable;
  }
  return candidates[0] ?? null;
}
