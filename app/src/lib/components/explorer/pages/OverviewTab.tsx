import type {
  Agent,
  ApiResource,
  Capability,
  DataProduct,
  EntityType,
  EventResource,
  IntegrationDependency,
} from "@open-resource-discovery/specification";
import type { ResourceTypeGroup } from "../explorerTypes";
import type { Selection } from "../useNavState";
import { AgentOverview } from "./overviews/AgentOverview";
import { ApiResourceOverview } from "./overviews/ApiResourceOverview";
import { CapabilityOverview } from "./overviews/CapabilityOverview";
import { DataProductOverview } from "./overviews/DataProductOverview";
import { EntityTypeOverview } from "./overviews/EntityTypeOverview";
import { EventResourceOverview } from "./overviews/EventResourceOverview";
import { IntegrationDependencyOverview } from "./overviews/IntegrationDependencyOverview";
import type { AnyResource } from "./resourceTypes";

export function OverviewTab({
  resource,
  resourceType,
  onSelect,
}: {
  resource: AnyResource;
  resourceType: ResourceTypeGroup;
  onSelect: (s: Selection) => void;
}) {
  switch (resourceType) {
    case "apiResources":
      return (
        <ApiResourceOverview
          resource={resource as ApiResource}
          onSelect={onSelect}
        />
      );
    case "eventResources":
      return (
        <EventResourceOverview
          resource={resource as EventResource}
          onSelect={onSelect}
        />
      );
    case "entityTypes":
      return (
        <EntityTypeOverview
          resource={resource as EntityType}
          onSelect={onSelect}
        />
      );
    case "dataProducts":
      return (
        <DataProductOverview
          resource={resource as DataProduct}
          onSelect={onSelect}
        />
      );
    case "capabilities":
      return (
        <CapabilityOverview
          resource={resource as Capability}
          onSelect={onSelect}
        />
      );
    case "agents":
      return <AgentOverview resource={resource as Agent} onSelect={onSelect} />;
    case "integrationDependencies":
      return (
        <IntegrationDependencyOverview
          resource={resource as IntegrationDependency}
          onSelect={onSelect}
        />
      );
  }
}
