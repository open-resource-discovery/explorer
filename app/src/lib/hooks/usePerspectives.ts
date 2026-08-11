import { useCallback, useEffect, useState } from "react";
import type { Connection, Perspective } from "@lib/connection/types";
import type { OrdConfiguration } from "@open-resource-discovery/specification";
import {
  fetchOrdConfiguration,
  extractPerspectives,
  getFetchUrl,
  getBaseUrl,
} from "@lib/fetcher";
import {
  fetchViaProxy,
  useProxy,
  AuthFailedError,
  classifyAuthError,
} from "@lib/proxy";
import type { AuthErrorKind } from "@lib/proxy";

export type PerspectivesState =
  | { status: "loading" }
  | { status: "ready"; perspectives: Perspective[]; fetchedAt: Date }
  | { status: "error"; error: string; authError?: AuthErrorKind };

export function usePerspectives(
  connection: Connection,
): [PerspectivesState, () => void] {
  const { available, sessionId, recheckSession } = useProxy();
  const [state, setState] = useState<PerspectivesState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      const wellKnownUrl = connection.ordConfigUrl;
      try {
        const isMtls = connection.auth === "mtls";
        const isBearer = connection.auth === "bearer";
        const isCrossOrigin =
          new URL(wellKnownUrl).origin !== window.location.origin;

        const forwardHeaders: Record<string, string> | undefined =
          isBearer && connection.bearerToken
            ? { Authorization: `Bearer ${connection.bearerToken}` }
            : undefined;
        const authHeaders = forwardHeaders
          ? new Headers(forwardHeaders)
          : undefined;

        const useProxyForFetch = isMtls || (available && isCrossOrigin);

        const config = useProxyForFetch
          ? await fetchViaProxy<OrdConfiguration>(
              connection.id,
              wellKnownUrl,
              forwardHeaders,
            )
          : await fetchOrdConfiguration(wellKnownUrl, authHeaders);
        const baseUrl = getBaseUrl(wellKnownUrl, config.baseUrl);
        const perspectiveIds = extractPerspectives(config);
        const allEntries = config.openResourceDiscoveryV1?.documents ?? [];
        const DEFAULT_PERSPECTIVE = "system-instance";
        const perspectives: Perspective[] = perspectiveIds.map((id) => {
          const entries = allEntries.filter(
            (e) =>
              ((e as { perspective?: string }).perspective ??
                DEFAULT_PERSPECTIVE) === id,
          );
          const documents = entries
            .filter((e) => e.url?.trim())
            .map((e) => ({ url: getFetchUrl(baseUrl, e.url!) }));
          return { id, documents };
        });
        if (!cancelled) {
          setState({ status: "ready", perspectives, fetchedAt: new Date() });
        }
      } catch (err) {
        if (cancelled) return;

        if (err instanceof AuthFailedError) {
          const authError = await classifyAuthError(
            connection.auth,
            recheckSession,
            sessionId,
          );
          setState({ status: "error", error: err.message, authError });
          return;
        }

        setState({
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    connection.id,
    connection.type,
    connection.ordConfigUrl,
    connection.auth,
    connection.bearerToken,
    available,
    sessionId,
    recheckSession,
    retryCount,
  ]);

  return [state, retry];
}
