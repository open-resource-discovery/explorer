import type {
  ApiResource,
  EventResource,
  EntityType,
  DataProduct,
  Capability,
  Agent,
  IntegrationDependency,
  ChangelogEntry,
} from "@open-resource-discovery/specification";

export type AnyResource =
  | ApiResource
  | EventResource
  | EntityType
  | DataProduct
  | Capability
  | Agent
  | IntegrationDependency;

export type WithChangelog = { changelogEntries?: ChangelogEntry[] };

export interface ResourceBase {
  ordId: string;
  title: string;
  shortDescription?: string;
  description?: string;
  version?: string;
  visibility?: string;
  releaseStatus?: string;
  disabled?: boolean;
  tags?: string[];
  links?: { url: string; title: string }[];
  partOfPackage: string;
  partOfConsumptionBundles?: { ordId: string }[];
  lastUpdate?: string;
  deprecationDate?: string;
  sunsetDate?: string;
  successors?: string[];
}

export function asBase(resource: AnyResource): ResourceBase {
  return resource as unknown as ResourceBase;
}
