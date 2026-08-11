import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import type { IntegrationDependency } from "@open-resource-discovery/specification";
import type { Selection } from "../../useNavState";
import { asBase } from "../resourceTypes";
import {
  OverviewBase,
  packageRelGroup,
  groupRelGroups,
  resourceRelGroup,
  formatDate,
} from "./OverviewBase";

export function IntegrationDependencyOverview({
  resource,
  onSelect,
}: {
  resource: IntegrationDependency;
  onSelect: (s: Selection) => void;
}) {
  const document = useOrdDocument();
  const base = asBase(resource);

  const detailFields = [
    ...(resource.mandatory !== undefined
      ? [{ label: "Mandatory", value: resource.mandatory ? "yes" : "no" }]
      : []),
    ...(base.lastUpdate
      ? [{ label: "Last Update", value: formatDate(base.lastUpdate) }]
      : []),
    ...(base.deprecationDate
      ? [{ label: "Deprecation Date", value: formatDate(base.deprecationDate) }]
      : []),
    ...(base.sunsetDate
      ? [{ label: "Sunset Date", value: formatDate(base.sunsetDate) }]
      : []),
  ];

  const relatedIntegrationIds = resource.relatedIntegrationDependencies ?? [];

  const relationshipGroups = [
    packageRelGroup(document, base.partOfPackage, onSelect),
    groupRelGroups(document, resource.partOfGroups ?? [], onSelect),
    resourceRelGroup(
      document,
      "Related integrations",
      relatedIntegrationIds,
      onSelect,
    ),
    resourceRelGroup(
      document,
      "Successors",
      resource.successors ?? [],
      onSelect,
    ),
  ];

  return (
    <OverviewBase
      resource={resource}
      resourceType="integrationDependencies"
      detailFields={detailFields}
      relationshipGroups={relationshipGroups}
    />
  );
}
