// Adapted from @open-resource-discovery/crawler
import type { OrdDocument } from "@open-resource-discovery/specification";

const DEFAULT_SYSTEM_PERSPECTIVE = "system-instance";

export interface MergeOptions {
  handlePerspectives?: boolean;
  priorityMode?: boolean;
  errorStrategy?: "log" | "collect";
  resourceStrategies?: Record<string, "merge" | "prioritize">;
}

export interface MergeResult {
  documents: OrdDocument[];
  errors: string[];
}

function mergePropertyWithOptions<T extends { ordId?: string }>(
  target: T[] | undefined,
  source: T[] | undefined,
  options: MergeOptions,
  errors: string[],
): T[] | undefined {
  if (!target && !source) return undefined;

  const result: T[] = [];

  if (options.priorityMode) {
    // In priority mode, source takes precedence
    if (source) {
      result.push(...source);
    }

    for (const targetEntry of target || []) {
      if (result.find((entry) => entry.ordId === targetEntry.ordId)) {
        if (options.errorStrategy === "collect") {
          errors.push(`Duplicate ORD ID "${targetEntry.ordId}" found.`);
        } else {
          console.info(`${targetEntry.ordId}: sap-ord-duplicate-resource`);
        }
        continue;
      }
      result.push(targetEntry);
    }
  } else {
    // In non-priority mode, merge equally
    if (target) {
      result.push(...target);
    }

    for (const sourceEntry of source || []) {
      if (result.find((entry) => entry.ordId === sourceEntry.ordId)) {
        if (options.errorStrategy === "collect") {
          errors.push(`Duplicate ORD ID "${sourceEntry.ordId}" found.`);
        } else {
          console.info(`${sourceEntry.ordId}: sap-ord-duplicate-resource`);
        }
        continue;
      }
      result.push(sourceEntry);
    }
  }

  return result.length > 0 ? result : undefined;
}

function mergeResourceWithOptions<T>(
  prop: keyof T,
  target: T[] | undefined,
  source: T[] | undefined,
  options: MergeOptions,
): T[] | undefined {
  if (!target && !source) return undefined;

  const result: T[] = [];

  if (options.priorityMode) {
    // Source takes precedence
    if (source) {
      result.push(...source);
    }

    for (const targetEntry of target || []) {
      if (result.find((entry) => entry[prop] === targetEntry[prop])) {
        continue;
      }
      result.push(targetEntry);
    }
  } else {
    // Merge without priority
    return [...(target || []), ...(source || [])];
  }

  return result.length > 0 ? result : undefined;
}

function mergeDocumentWithOptions(
  target: OrdDocument,
  source: OrdDocument,
  options: MergeOptions,
  errors: string[],
): OrdDocument {
  const result: OrdDocument = options.priorityMode
    ? { ...source, ...target }
    : { ...target, ...source };

  // Preserve the openResourceDiscovery from target if it exists (it was already calculated as the highest version)
  if (target.openResourceDiscovery) {
    result.openResourceDiscovery = target.openResourceDiscovery;
  }

  // Handle resources that require ordId checking
  const ordIdResources = [
    "apiResources",
    "eventResources",
    "entityTypes",
    "dataProducts",
    "capabilities",
    "integrationDependencies",
  ] as const;

  for (const resource of ordIdResources) {
    if (target[resource] || source[resource]) {
      (result as unknown as Record<string, unknown>)[resource] =
        mergePropertyWithOptions(
          target[resource] as { ordId?: string }[] | undefined,
          source[resource] as { ordId?: string }[] | undefined,
          options,
          errors,
        );
    }
  }

  // Handle resources with different id properties
  if (target.packages || source.packages) {
    result.packages = options.priorityMode
      ? mergeResourceWithOptions(
          "ordId",
          target.packages,
          source.packages,
          options,
        )
      : mergePropertyWithOptions(
          target.packages,
          source.packages,
          options,
          errors,
        );
  }

  if (target.products || source.products) {
    result.products = options.priorityMode
      ? mergeResourceWithOptions(
          "ordId",
          target.products,
          source.products,
          options,
        )
      : mergePropertyWithOptions(
          target.products,
          source.products,
          options,
          errors,
        );
  }

  if (target.consumptionBundles || source.consumptionBundles) {
    result.consumptionBundles = options.priorityMode
      ? mergeResourceWithOptions(
          "ordId",
          target.consumptionBundles,
          source.consumptionBundles,
          options,
        )
      : mergePropertyWithOptions(
          target.consumptionBundles,
          source.consumptionBundles,
          options,
          errors,
        );
  }

  if (target.vendors || source.vendors) {
    result.vendors = options.priorityMode
      ? mergeResourceWithOptions(
          "ordId",
          target.vendors,
          source.vendors,
          options,
        )
      : mergePropertyWithOptions(
          target.vendors,
          source.vendors,
          options,
          errors,
        );
  }

  if (target.groups || source.groups) {
    result.groups = options.priorityMode
      ? mergeResourceWithOptions(
          "groupId",
          target.groups,
          source.groups,
          options,
        )
      : [...(target.groups || []), ...(source.groups || [])];
  }

  if (target.groupTypes || source.groupTypes) {
    result.groupTypes = options.priorityMode
      ? mergeResourceWithOptions(
          "groupTypeId",
          target.groupTypes,
          source.groupTypes,
          options,
        )
      : [...(target.groupTypes || []), ...(source.groupTypes || [])];
  }

  if (target.tombstones || source.tombstones) {
    result.tombstones = [
      ...(target.tombstones || []),
      ...(source.tombstones || []),
    ];
  }

  return result;
}

export function mergeDocumentsWithOptions(
  allDocuments: OrdDocument[],
  options: MergeOptions = {},
): MergeResult {
  const errors: string[] = [];

  if (options.handlePerspectives) {
    // Group documents by perspective
    const perspectiveGroups = new Map<string, OrdDocument[]>();

    for (const doc of allDocuments) {
      const perspective = doc.perspective || DEFAULT_SYSTEM_PERSPECTIVE;
      if (!perspectiveGroups.has(perspective)) {
        perspectiveGroups.set(perspective, []);
      }
      perspectiveGroups.get(perspective)!.push(doc);
    }

    // If there are multiple perspectives, log info
    if (perspectiveGroups.size > 1) {
      const perspectives = Array.from(perspectiveGroups.keys());
      console.debug(
        `Found ${perspectiveGroups.size} different perspectives: ${perspectives.join(", ")}`,
      );
      console.debug(
        `Creating ${perspectiveGroups.size} merged documents, one for each perspective.`,
      );
    }

    // Merge documents within each perspective group
    const mergedDocuments: OrdDocument[] = [];

    for (const [, documents] of perspectiveGroups) {
      // Get the highest ORD version from all documents (compare as numbers)
      const ordVersion = documents.reduce((maxVersion, doc) => {
        const currentVersion = doc.openResourceDiscovery || "1.0";
        const currentNum = parseFloat(currentVersion);
        const maxNum = parseFloat(maxVersion);
        return currentNum > maxNum ? currentVersion : maxVersion;
      }, documents[0]?.openResourceDiscovery || "1.0");

      const merged = documents.reduce(
        (acc, current) => {
          return mergeDocumentWithOptions(acc, current, options, errors);
        },
        {
          openResourceDiscovery: ordVersion,
          // Preserve perspective if any document in the group has it
          ...(documents[0].perspective
            ? { perspective: documents[0].perspective }
            : {}),
        },
      );

      mergedDocuments.push(merged);
    }

    return { documents: mergedDocuments, errors };
  } else {
    // Merge all documents without perspective handling
    // Get the highest ORD version from all documents (compare as numbers)
    const ordVersion = allDocuments.reduce((maxVersion, doc) => {
      const currentVersion = doc.openResourceDiscovery || "1.0";
      const currentNum = parseFloat(currentVersion);
      const maxNum = parseFloat(maxVersion);
      return currentNum > maxNum ? currentVersion : maxVersion;
    }, allDocuments[0]?.openResourceDiscovery);

    const merged = allDocuments.reduce(
      (acc, current) => {
        return mergeDocumentWithOptions(acc, current, options, errors);
      },
      {
        openResourceDiscovery: ordVersion,
      },
    );

    return { documents: [merged], errors };
  }
}

export function mergeDocuments(allDocuments: OrdDocument[]): OrdDocument[] {
  const result = mergeDocumentsWithOptions(allDocuments, {
    handlePerspectives: true,
    priorityMode: false,
    errorStrategy: "log",
  });

  return result.documents;
}
