export function getExposedEntityTypeIds(resource: {
  exposedEntityTypes?: { ordId: string }[];
  entityTypeMappings?: { entityTypeTargets: unknown[] }[];
}): string[] {
  const ids: string[] = [];
  (resource.exposedEntityTypes ?? []).forEach((e) => ids.push(e.ordId));
  if (ids.length === 0) {
    (resource.entityTypeMappings ?? []).forEach((m) =>
      m.entityTypeTargets.forEach((t) => {
        if (t !== null && typeof t === "object" && "ordId" in t)
          ids.push((t as { ordId: string }).ordId);
      }),
    );
  }
  return ids;
}
