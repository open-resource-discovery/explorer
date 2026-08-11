import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import type { ApiResource } from "@open-resource-discovery/specification";
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

export function ApiResourceOverview({
  resource,
  onSelect,
}: {
  resource: ApiResource;
  onSelect: (s: Selection) => void;
}) {
  const document = useOrdDocument();
  const base = asBase(resource);

  const detailFields = [
    ...(resource.apiProtocol
      ? [{ label: "Protocol", value: resource.apiProtocol }]
      : []),
    ...(resource.direction
      ? [{ label: "Direction", value: resource.direction }]
      : []),
    ...((resource.entryPoints ?? []).length > 0
      ? [
          {
            label: "Entry Points",
            value: (resource.entryPoints ?? []).join(", "),
          },
        ]
      : []),
    ...(resource.extensible
      ? [{ label: "Extensible", value: resource.extensible.supported }]
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

  const exposedEntityTypeIds = getExposedEntityTypeIds(resource);

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
      "Successors",
      resource.successors ?? [],
      onSelect,
    ),
  ];

  return (
    <OverviewBase
      resource={resource}
      resourceType="apiResources"
      detailFields={detailFields}
      relationshipGroups={relationshipGroups}
      apiLinks={resource.apiResourceLinks ?? []}
    />
  );
}
