import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import type { Capability } from "@open-resource-discovery/specification";
import type { Selection } from "../../useNavState";
import { asBase } from "../resourceTypes";
import {
  OverviewBase,
  packageRelGroup,
  groupRelGroups,
  resourceRelGroup,
  formatDate,
} from "./OverviewBase";

export function CapabilityOverview({
  resource,
  onSelect,
}: {
  resource: Capability;
  onSelect: (s: Selection) => void;
}) {
  const document = useOrdDocument();
  const base = asBase(resource);

  const detailFields = [
    ...(resource.type
      ? [
          {
            label: "Type",
            value: resource.type.split(":").pop() ?? resource.type,
          },
        ]
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

  const relatedEntityIds = resource.relatedEntityTypes ?? [];
  const relatedApiIds = (resource.relatedApiResources ?? []).map(
    (r) => r.ordId,
  );
  const relatedEventIds = (resource.relatedEventResources ?? []).map(
    (r) => r.ordId,
  );
  const relatedCapabilityIds = (resource.relatedCapabilities ?? []).map(
    (r) => r.ordId,
  );

  const relationshipGroups = [
    packageRelGroup(document, base.partOfPackage, onSelect),
    groupRelGroups(document, resource.partOfGroups ?? [], onSelect),
    resourceRelGroup(
      document,
      "Related entity types",
      relatedEntityIds,
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
      "Related capabilities",
      relatedCapabilityIds,
      onSelect,
    ),
  ];

  return (
    <OverviewBase
      resource={resource}
      resourceType="capabilities"
      detailFields={detailFields}
      relationshipGroups={relationshipGroups}
    />
  );
}
