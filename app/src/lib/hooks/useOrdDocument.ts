import { useCallback, useEffect, useState } from "react";
import type { OrdDocument } from "@open-resource-discovery/specification";
import { getConnection } from "@lib/connection/store";
import { getFetchUrl, fetchOrdDocumentForPerspective } from "@lib/fetcher";
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

  const retry = useCallback((): void => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
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

        const wellKnownUrl = connection.ordConfigUrl;
        const isCrossOrigin =
          new URL(wellKnownUrl).origin !== window.location.origin;
        const useProxyForAuth = isMtls || (available && isCrossOrigin);

        const fetchFn = useProxyForAuth
          ? (url: string): Promise<unknown> =>
              fetchViaProxy<unknown>(
                proxyBaseUrl,
                connectionId,
                url,
                forwardHeaders,
              )
          : async (url: string): Promise<unknown> => {
              const init: RequestInit = forwardHeaders
                ? { headers: forwardHeaders }
                : {};
              const res = await fetch(url, init);
              if (!res.ok)
                throw new Error(`HTTP ${res.status} fetching ${url}`);
              return res.json();
            };

        const { document: rawDoc, baseUrl } =
          await fetchOrdDocumentForPerspective(
            wellKnownUrl,
            perspectiveId,
            fetchFn,
          );

        const result = resolveDefinitionUrls(rawDoc, baseUrl);

        if (!cancelled) {
          setDocument(result);
        }
      } catch (err: unknown) {
        if (cancelled) return;

        if (err instanceof AuthFailedError) {
          const conn = getConnection(connectionId);
          const kind = await classifyAuthError(
            conn?.auth ?? "none",
            recheckSession,
            sessionId,
          );
          setError(err instanceof Error ? err.message : String(err));
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
    proxyBaseUrl,
    sessionId,
    recheckSession,
    retryCount,
  ]);

  return { document, loading, error, authError, retry };
}
