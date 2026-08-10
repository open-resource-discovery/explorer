import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { OrdDocument } from "@open-resource-discovery/specification";
import {
  DefinitionContentContext,
  type DefinitionContentMap,
} from "./DefinitionContentContext";
import { fetchTextViaProxy } from "@lib/proxy";

const BATCH_SIZE = 6;

function collectDefinitionUrls(document: OrdDocument): string[] {
  const urls = new Set<string>();
  const resourceLists = [
    document.apiResources,
    document.eventResources,
    document.entityTypes,
    document.dataProducts,
    document.capabilities,
    document.agents,
    document.integrationDependencies,
  ];
  for (const list of resourceLists) {
    if (!list) continue;
    for (const resource of list) {
      const defs =
        (resource as { resourceDefinitions?: { url?: string }[] })
          .resourceDefinitions ??
        (resource as { definitions?: { url?: string }[] }).definitions ??
        [];
      for (const def of defs) {
        if (def.url) urls.add(def.url);
      }
    }
  }
  return Array.from(urls);
}

async function fetchInBatches(
  urls: string[],
  signal: AbortSignal,
  connectionId: string,
  proxyAvailable: boolean,
  onResult: (
    url: string,
    state: { status: "done"; content: string } | { status: "error" },
  ) => void,
): Promise<void> {
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    if (signal.aborted) return;
    const batch = urls.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const isCrossOrigin = new URL(url).origin !== window.location.origin;
          const useProxy = proxyAvailable && isCrossOrigin;
          const text = useProxy
            ? await fetchTextViaProxy(connectionId, url)
            : await fetch(url, { signal }).then((res) => {
                if (
                  !res.ok ||
                  (res.headers.get("content-type") ?? "").includes("text/html")
                )
                  throw new Error("not ok");
                return res.text();
              });
          onResult(url, { status: "done", content: text as string });
        } catch {
          onResult(url, { status: "error" });
        }
      }),
    );
  }
}

interface DefinitionContentProviderProps {
  document: OrdDocument;
  prefetch: boolean;
  connectionId: string;
  proxyAvailable: boolean;
  children: ReactNode;
}

export function DefinitionContentProvider({
  document,
  prefetch,
  connectionId,
  proxyAvailable,
  children,
}: DefinitionContentProviderProps) {
  const [map, setMap] = useState<DefinitionContentMap>(() => {
    if (!prefetch) return new Map();
    const urls = collectDefinitionUrls(document);
    return new Map(urls.map((url) => [url, { status: "loading" as const }]));
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!prefetch) return;
    const urls = collectDefinitionUrls(document);
    if (urls.length === 0) return;

    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    fetchInBatches(urls, signal, connectionId, proxyAvailable, (url, state) => {
      if (signal.aborted) return;
      setMap((prev) => {
        const next = new Map(prev);
        next.set(url, state);
        return next;
      });
    });

    return () => {
      abortRef.current?.abort();
    };
  }, [document, prefetch, connectionId, proxyAvailable]);

  return (
    <DefinitionContentContext.Provider value={map}>
      {children}
    </DefinitionContentContext.Provider>
  );
}
