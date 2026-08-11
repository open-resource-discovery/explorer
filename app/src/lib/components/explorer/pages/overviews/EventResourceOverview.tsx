import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import type { EventResource } from "@open-resource-discovery/specification";
import type { Selection } from "../../useNavState";
import { asBase } from "../resourceTypes";
import {
  OverviewBase,
  packageRelGroup,
  bundleRelGroups,
  productRelGroups,
  groupRelGroups,
  resourceRelGroup,
  formatDate,
} from "./OverviewBase";
import { getExposedEntityTypeIds } from "./overviewUtils";

export function EventResourceOverview({
  resource,
  onSelect,
}: {
  resource: EventResource;
  onSelect: (s: Selection) => void;
}) {
  const document = useOrdDocument();
  const base = asBase(resource);

  const detailFields = [
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

  const exposedEntityTypeIds = getExposedEntityTypeIds(resource);
  const relatedApiIds = (resource.relatedApiResources ?? []).map(
    (r) => r.ordId,
  );
  const relatedEventIds = (resource.relatedEventResources ?? []).map(
    (r) => r.ordId,
  );

  const relationshipGroups = [
    packageRelGroup(document, base.partOfPackage, onSelect),
    bundleRelGroups(document, base.partOfConsumptionBundles ?? [], onSelect),
    productRelGroups(document, resource.partOfProducts ?? [], onSelect),
    groupRelGroups(document, resource.partOfGroups ?? [], onSelect),
    resourceRelGroup(
      document,
      "Exposed entity types",
      exposedEntityTypeIds,
      onSelect,
    ),
    resourceRelGroup(
      document,
      "Related API resources",
      relatedApiIds,
      onSelect,
    ),
    resourceRelGroup(
      document,
      "Related event resources",
      relatedEventIds,
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
      resourceType="eventResources"
      detailFields={detailFields}
      relationshipGroups={relationshipGroups}
    />
  );
}
