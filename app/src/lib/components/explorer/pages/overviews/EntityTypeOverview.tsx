import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import type { EntityType } from "@open-resource-discovery/specification";
import type { Selection } from "../../useNavState";
import { asBase } from "../resourceTypes";
import {
  OverviewBase,
  packageRelGroup,
  productRelGroups,
  groupRelGroups,
  resourceRelGroup,
  formatDate,
} from "./OverviewBase";

export function EntityTypeOverview({
  resource,
  onSelect,
}: {
  resource: EntityType;
  onSelect: (s: Selection) => void;
}) {
  const document = useOrdDocument();
  const base = asBase(resource);

  const detailFields = [
    ...(resource.level ? [{ label: "Level", value: resource.level }] : []),
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

  const relatedEntityIds = (resource.relatedEntityTypes ?? []).map(
    (r) => r.ordId,
  );

  const relationshipGroups = [
    packageRelGroup(document, base.partOfPackage, onSelect),
    productRelGroups(document, resource.partOfProducts ?? [], onSelect),
    groupRelGroups(document, resource.partOfGroups ?? [], onSelect),
    resourceRelGroup(
      document,
      "Related entity types",
      relatedEntityIds,
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
      resourceType="entityTypes"
      detailFields={detailFields}
      relationshipGroups={relationshipGroups}
    />
  );
}
