import type { ResourceTypeGroup } from "./explorerTypes";

const ORD_SEGMENT_TO_RESOURCE_TYPE: Record<string, ResourceTypeGroup> = {
  apiResource: "apiResources",
  eventResource: "eventResources",
  entityType: "entityTypes",
  dataProduct: "dataProducts",
  capability: "capabilities",
  agent: "agents",
  integrationDependency: "integrationDependencies",
};

export function ordIdToResourceTypeGroup(
  ordId: string,
): ResourceTypeGroup | null {
  const segment = ordId.split(":")[1];
  if (!segment) return null;
  return ORD_SEGMENT_TO_RESOURCE_TYPE[segment] ?? null;
}
