import type {
  OrdConfiguration,
  OrdDocument,
  OrdV1DocumentDescription,
} from "@open-resource-discovery/specification";
import {
  getBaseUrl,
  getFetchUrl,
  isOrdConfiguration,
  isOrdDocument,
  DEFAULT_PERSPECTIVE,
} from "./ordUtils.ts";
import { mergeDocuments } from "./ordMerge.ts";

export interface FetchOrdDocumentResult {
  document: OrdDocument;
  baseUrl: string;
}

type FetchFn = (
  url: string,
  headers?: Record<string, string>,
) => Promise<unknown>;

async function defaultFetch(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

export async function fetchOrdDocumentForPerspective(
  ordConfigUrl: string,
  perspectiveId: string,
  fetchFn: FetchFn = defaultFetch,
  signal?: AbortSignal,
): Promise<FetchOrdDocumentResult> {
  const rawConfig = await fetchFn(ordConfigUrl);
  if (!isOrdConfiguration(rawConfig)) {
    throw new Error(`Unrecognized ORD configuration at ${ordConfigUrl}`);
  }
  const config: OrdConfiguration = rawConfig;

  const baseUrl = getBaseUrl(ordConfigUrl, config.baseUrl);
  const allEntries: readonly OrdV1DocumentDescription[] =
    config.openResourceDiscoveryV1?.documents ?? [];

  const entries = allEntries.filter(
    (e: OrdV1DocumentDescription): boolean =>
      (e.perspective ?? DEFAULT_PERSPECTIVE) === perspectiveId,
  );

  const docUrls = entries
    .filter((e: OrdV1DocumentDescription): boolean => Boolean(e.url?.trim()))
    // SAFETY: url is guaranteed non-empty by the filter above.
    .map((e: OrdV1DocumentDescription): string => getFetchUrl(baseUrl, e.url!));

  if (docUrls.length === 0) {
    throw new Error(`No document URLs for perspective "${perspectiveId}"`);
  }

  const fetched = await Promise.all(
    docUrls.map(async (url: string): Promise<OrdDocument> => {
      signal?.throwIfAborted();
      const raw = await fetchFn(url);
      if (!isOrdDocument(raw)) {
        throw new Error(`Unrecognized ORD document format at ${url}`);
      }
      return raw;
    }),
  );

  const merged = mergeDocuments(fetched);
  const document =
    merged.find((d: OrdDocument): boolean => d.perspective === perspectiveId) ??
    merged[0];

  if (document === undefined) {
    throw new Error(
      `No merged document found for perspective "${perspectiveId}"`,
    );
  }

  return { document, baseUrl };
}
