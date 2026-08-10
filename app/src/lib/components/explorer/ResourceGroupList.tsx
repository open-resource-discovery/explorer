import type { OrdDocument } from "@open-resource-discovery/specification";
import type { ResourceTypeConfig } from "./resourceTypeConfig";
import { RESOURCE_TYPE_CONFIG } from "./resourceTypeConfig";
import { RelationshipCard } from "./RelationshipCard";
import type { Selection } from "./useNavState";

interface ResourceItem {
  ordId: string;
  title: string;
}

export interface ResourceGroup {
  type: ResourceTypeConfig["type"];
  label: string;
  icon: ResourceTypeConfig["icon"];
  bg: string;
  fg: string;
  items: ResourceItem[];
}

function getResourcesWhere(
  document: OrdDocument,
  isMember: (r: unknown) => boolean,
): ResourceGroup[] {
  return RESOURCE_TYPE_CONFIG.flatMap(({ type, label, icon, bg, fg }) => {
    const items = (document[type] ?? []).filter(isMember) as ResourceItem[];
    return items.length > 0 ? [{ type, label, icon, bg, fg, items }] : [];
  });
}

export function getResourcesInPackage(
  document: OrdDocument,
  packageOrdId: string,
): ResourceGroup[] {
  return getResourcesWhere(
    document,
    (r) =>
      "partOfPackage" in (r as object) &&
      (r as { partOfPackage: string }).partOfPackage === packageOrdId,
  );
}

export function getResourcesInBundle(
  document: OrdDocument,
  bundleOrdId: string,
): ResourceGroup[] {
  return getResourcesWhere(
    document,
    (r) =>
      "partOfConsumptionBundles" in (r as object) &&
      Array.isArray(
        (r as { partOfConsumptionBundles: unknown }).partOfConsumptionBundles,
      ) &&
      (
        r as { partOfConsumptionBundles: { ordId: string }[] }
      ).partOfConsumptionBundles.some((ref) => ref.ordId === bundleOrdId),
  );
}

export function getResourcesInProduct(
  document: OrdDocument,
  productOrdId: string,
): ResourceGroup[] {
  return getResourcesWhere(
    document,
    (r) =>
      "partOfProducts" in (r as object) &&
      Array.isArray((r as { partOfProducts: unknown }).partOfProducts) &&
      (r as { partOfProducts: string[] }).partOfProducts.includes(productOrdId),
  );
}

export function getResourcesInGroup(
  document: OrdDocument,
  groupId: string,
): ResourceGroup[] {
  return getResourcesWhere(
    document,
    (r) =>
      "partOfGroups" in (r as object) &&
      Array.isArray((r as { partOfGroups: unknown }).partOfGroups) &&
      (r as { partOfGroups: string[] }).partOfGroups.includes(groupId),
  );
}

interface ResourceGroupListProps {
  heading: string;
  groups: ResourceGroup[];
  onSelect: (s: Selection) => void;
}

export function ResourceGroupList({
  heading,
  groups,
  onSelect,
}: ResourceGroupListProps) {
  if (groups.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {heading}
      </p>
      <div className="space-y-4">
        {groups.map(({ type, label, icon, bg, fg, items }) => (
          <div key={type}>
            <p className="text-xs font-medium text-card-fg mb-1.5">
              {label}{" "}
              <span className="text-muted-foreground">({items.length})</span>
            </p>
            <div className="space-y-1.5">
              {items.map((r) => (
                <RelationshipCard
                  key={r.ordId}
                  title={r.title}
                  subtitle={r.ordId}
                  customBg={bg}
                  customFg={fg}
                  iconNode={icon}
                  onClick={() =>
                    onSelect({
                      id: "resourceDetail",
                      resourceType: type,
                      ordId: r.ordId,
                    })
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
