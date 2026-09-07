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

/**
 * Rewrites relative definition URLs on an ORD document's resources to absolute
 * URLs against `baseUrl`.
 *
 * NOTE: this mutates `doc` in place and returns the same reference — the returned
 * value and the passed-in `doc` are the same object. Callers must pass a document
 * they exclusively own (e.g. a freshly fetched document), never a shared/cached
 * instance, or other consumers would observe the rewritten URLs.
 */
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
      // SAFETY: ORD resource types optionally carry `resourceDefinitions` and
      // `definitions` arrays whose entries may have a `url`. We only read and
      // rewrite those two optional fields, so narrowing to exactly this readable
      // surface is sound regardless of the concrete resource type.
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
  document: OrdDocument | undefined;
  loading: boolean;
  error: string | undefined;
  authError: AuthErrorKind | undefined;
  retry: () => void;
}

export function useOrdDocument(
  connectionId: string,
  perspectiveId: string,
): UseOrdDocumentResult {
  const { available, sessionId, recheckSession, proxyBaseUrl } = useProxy();
  const [document, setDocument] = useState<OrdDocument | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [authError, setAuthError] = useState<AuthErrorKind | undefined>(
    undefined,
  );
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback((): void => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(undefined);
      setAuthError(undefined);
      setDocument(undefined);

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
