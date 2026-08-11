// Adapted from @open-resource-discovery/crawler
import type {
  OrdConfiguration,
  OrdDocument,
  OrdV1DocumentDescription,
} from "@open-resource-discovery/specification";
import { customFetch, HttpError, responseValidationError } from "./fetch.ts";
import { getFetchUrl, isOrdConfiguration, isOrdDocument } from "./ordUtils.ts";
import { mergeDocuments } from "./ordMerge.ts";

const DEFAULT_SYSTEM_PERSPECTIVE = "system-instance";
const MAX_PARALLEL_REQUESTS = 10;

/**
 * Fetches and validates the ORD discovery configuration from the well-known endpoint.
 */
export async function fetchOrdConfiguration(
  url: string,
  headers?: Headers,
): Promise<OrdConfiguration> {
  const init: RequestInit = headers ? { headers } : {};
  const ordConfig = await customFetch(url, isOrdConfiguration, init);

  const docEntries = ordConfig.openResourceDiscoveryV1?.documents || [];
  const countDocs = docEntries.filter((d: OrdV1DocumentDescription) =>
    d.url?.trim(),
  ).length;

  if (!countDocs) {
    throw new Error(`No ORD Document URLs found in configuration at ${url}`);
  }

  return ordConfig;
}

type FetchDocumentTask = {
  url: string;
  requestInit: RequestInit;
  configPerspective: string;
};

/**
 * Fetches all ORD documents for a given perspective in parallel and merges them into one OrdDocument.
 *
 * @param baseUrl - The resolved base URL (from getBaseUrl)
 * @param config - The ORD configuration fetched from the well-known endpoint
 * @param perspectiveId - The perspective to filter documents by (e.g. "system-instance")
 * @param headers - Optional headers for auth (e.g. Authorization: Bearer <token>)
 */
export async function fetchOrdDocuments(
  baseUrl: string,
  config: OrdConfiguration,
  perspectiveId: string,
  headers?: Headers,
): Promise<OrdDocument> {
  const allEntries: OrdV1DocumentDescription[] =
    config.openResourceDiscoveryV1?.documents || [];

  // Filter to the requested perspective
  const entries = allEntries.filter((entry: OrdV1DocumentDescription) => {
    const entryPerspective = entry.perspective || DEFAULT_SYSTEM_PERSPECTIVE;
    return entryPerspective === perspectiveId;
  });

  // Build tasks, skipping entries without URLs
  const tasks: FetchDocumentTask[] = [];
  const requestInit: RequestInit = headers ? { headers } : {};

  for (const entry of entries) {
    if (!entry.url?.trim()) continue;
    tasks.push({
      url: getFetchUrl(baseUrl, entry.url),
      requestInit,
      configPerspective: entry.perspective || DEFAULT_SYSTEM_PERSPECTIVE,
    });
  }

  if (tasks.length === 0) {
    throw new Error(
      `No ORD documents found for perspective "${perspectiveId}"`,
    );
  }

  // Fetch in parallel chunks
  const fetchedDocuments: OrdDocument[] = [];
  const errors: { url: string; message: string }[] = [];

  for (let i = 0; i < tasks.length; i += MAX_PARALLEL_REQUESTS) {
    const chunk = tasks.slice(i, i + MAX_PARALLEL_REQUESTS);

    const chunkResults = await Promise.all(
      chunk.map(async (task) => {
        try {
          const doc = await customFetch<OrdDocument>(
            task.url,
            isOrdDocument,
            task.requestInit,
          );
          if (!doc.perspective) {
            doc.perspective = DEFAULT_SYSTEM_PERSPECTIVE;
          }
          return { success: true as const, doc };
        } catch (err) {
          const message =
            err instanceof HttpError
              ? `HTTP ${err.status} ${err.statusText} fetching ${task.url}`
              : err === responseValidationError
                ? `Unrecognized ORD document format at ${task.url}`
                : `Failed to fetch ${task.url}: ${(err as Error).message}`;
          return { success: false as const, url: task.url, message };
        }
      }),
    );

    for (const result of chunkResults) {
      if (result.success) {
        fetchedDocuments.push(result.doc);
      } else {
        errors.push({ url: result.url, message: result.message });
      }
    }
  }

  if (fetchedDocuments.length === 0) {
    const detail = errors.map((e) => e.message).join("; ");
    throw new Error(
      `Failed to fetch any ORD documents for perspective "${perspectiveId}": ${detail}`,
    );
  }

  // Merge all fetched documents into one
  const merged = mergeDocuments(fetchedDocuments);

  // Return the document matching the requested perspective (mergeDocuments groups by perspective)
  const result = merged.find(
    (doc) => (doc.perspective || DEFAULT_SYSTEM_PERSPECTIVE) === perspectiveId,
  );

  if (!result) {
    // Fall back to the first merged document if perspective lookup fails
    return merged[0];
  }

  return result;
}
