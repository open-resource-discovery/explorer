import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import type { DataProduct } from "@open-resource-discovery/specification";
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

export function DataProductOverview({
  resource,
  onSelect,
}: {
  resource: DataProduct;
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

  const entityTypeIds = resource.entityTypes ?? [];

  const relationshipGroups = [
    packageRelGroup(document, base.partOfPackage, onSelect),
    bundleRelGroups(document, base.partOfConsumptionBundles ?? [], onSelect),
    productRelGroups(document, resource.partOfProducts ?? [], onSelect),
    groupRelGroups(document, resource.partOfGroups ?? [], onSelect),
    resourceRelGroup(document, "Entity types", entityTypeIds, onSelect),
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
      resourceType="dataProducts"
      detailFields={detailFields}
      relationshipGroups={relationshipGroups}
    />
  );
}
