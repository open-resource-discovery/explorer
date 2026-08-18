import { useCallback, useEffect, useState } from "react";
import type {
  OrdDocument,
  OrdConfiguration,
} from "@open-resource-discovery/specification";
import { getConnection } from "@lib/connection/store";
import {
  mergeDocuments,
  fetchOrdConfiguration,
  getFetchUrl,
  getBaseUrl,
} from "@lib/fetcher";
import {
  useProxy,
  fetchViaProxy,
  AuthFailedError,
  classifyAuthError,
} from "@lib/proxy";
import type { AuthErrorKind } from "@lib/proxy";

export const PROXY_PORT = 44123;

function resolveDefinitionUrls(doc: OrdDocument, baseUrl: string): OrdDocument {
  const resourceLists = [
    doc.apiResources,
    doc.eventResources,
    doc.entityTypes,
    doc.dataProducts,
    doc.capabilities,
    doc.agents,
    doc.integrationDependencies,
  ];
  const resolveDef = <T extends { url?: string }>(def: T): T =>
    def.url && !def.url.startsWith("http")
      ? { ...def, url: getFetchUrl(baseUrl, def.url) }
      : def;

  for (const list of resourceLists) {
    if (!list) continue;
    for (const resource of list) {
      const withDefs = resource as {
        resourceDefinitions?: { url?: string }[];
        definitions?: { url?: string }[];
      };
      if (withDefs.resourceDefinitions) {
        withDefs.resourceDefinitions =
          withDefs.resourceDefinitions.map(resolveDef);
      }
      if (withDefs.definitions) {
        withDefs.definitions = withDefs.definitions.map(resolveDef);
      }
    }
  }
  return doc;
}

export interface UseOrdDocumentResult {
  document: OrdDocument | null;
  loading: boolean;
  error: string | null;
  authError: AuthErrorKind | null;
  retry: () => void;
}

async function fetchDirect(
  url: string,
  headers?: Headers,
): Promise<OrdDocument> {
  const init: RequestInit = headers ? { headers } : {};
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return (await response.json()) as OrdDocument;
}

export function useOrdDocument(
  connectionId: string,
  perspectiveId: string,
): UseOrdDocumentResult {
  const { available, sessionId, recheckSession, proxyBaseUrl } = useProxy();
  const [document, setDocument] = useState<OrdDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<AuthErrorKind | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAuthError(null);
      setDocument(null);

      const connection = getConnection(connectionId);

      if (!connection) {
        if (!cancelled) {
          setError("Connection not found");
          setLoading(false);
        }
        return;
      }

      try {
        const isMtls = connection.auth === "mtls";
        const isBearer = connection.auth === "bearer";
        const forwardHeaders: Record<string, string> | undefined =
          isBearer && connection.bearerToken
            ? { Authorization: `Bearer ${connection.bearerToken}` }
            : undefined;
        const authHeaders = forwardHeaders
          ? new Headers(forwardHeaders)
          : undefined;

        const wellKnownUrl = connection.ordConfigUrl;
        const isCrossOrigin =
          new URL(wellKnownUrl).origin !== window.location.origin;
        const useProxyForAuth = isMtls || (available && isCrossOrigin);

        const config = useProxyForAuth
          ? await fetchViaProxy<OrdConfiguration>(
              proxyBaseUrl,
              connectionId,
              wellKnownUrl,
              forwardHeaders,
            )
          : await fetchOrdConfiguration(wellKnownUrl, authHeaders);
        const allEntries = config.openResourceDiscoveryV1?.documents ?? [];
        const DEFAULT_PERSPECTIVE = "system-instance";

        const entries = allEntries.filter(
          (e) =>
            ((e as { perspective?: string }).perspective ??
              DEFAULT_PERSPECTIVE) === perspectiveId,
        );

        const baseUrl = getBaseUrl(wellKnownUrl, config.baseUrl);

        const docUrls = entries
          .filter((e) => e.url?.trim())
          .map((e) => getFetchUrl(baseUrl, e.url!));

        if (docUrls.length === 0) {
          throw new Error(
            `No document URLs for perspective "${perspectiveId}"`,
          );
        }

        const fetched: OrdDocument[] = await Promise.all(
          docUrls.map(async (url) => {
            const doc = useProxyForAuth
              ? await fetchViaProxy<OrdDocument>(
                  proxyBaseUrl,
                  connectionId,
                  url,
                  forwardHeaders,
                )
              : await fetchDirect(url, authHeaders);
            return resolveDefinitionUrls(doc, baseUrl);
          }),
        );

        const merged = mergeDocuments(fetched);

        const result =
          merged.find((d) => d.perspective === perspectiveId) ?? merged[0];

        if (!cancelled) {
          setDocument(result ?? null);
        }
      } catch (err) {
        if (cancelled) return;

        if (err instanceof AuthFailedError) {
          const conn = getConnection(connectionId);
          const kind = await classifyAuthError(
            conn?.auth ?? "none",
            recheckSession,
            sessionId,
          );
          setError(err.message);
          setAuthError(kind);
          return;
        }

        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    connectionId,
    perspectiveId,
    available,
    sessionId,
    recheckSession,
    retryCount,
  ]);

  return { document, loading, error, authError, retry };
}
