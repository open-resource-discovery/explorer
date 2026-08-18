import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type {
  OrdDocument,
  OrdConfiguration,
} from "@open-resource-discovery/specification";
import {
  fetchOrdConfiguration,
  mergeDocuments,
  getFetchUrl,
  getBaseUrl,
} from "@lib/fetcher";
import { ORDExplorer } from "@lib/components/explorer/ORDExplorer";
import { ThemeProvider } from "@lib/hooks/useTheme.tsx";
import { Loader2, AlertTriangle } from "lucide-react";

export interface ExplorerPageProps {
  ordConfigUrl: string;
  perspectiveId: string;
  className?: string;
  prefetchDefinitions?: boolean;
}

interface UseOrdDocumentResult {
  document: OrdDocument | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const DEFAULT_PERSPECTIVE = "system-instance";

function useOrdDocumentFromUrl(
  ordConfigUrl: string,
  perspectiveId: string,
): UseOrdDocumentResult {
  const [document, setDocument] = useState<OrdDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback((): void => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      setDocument(null);

      try {
        const config: OrdConfiguration =
          await fetchOrdConfiguration(ordConfigUrl);
        const baseUrl = getBaseUrl(ordConfigUrl, config.baseUrl);
        const allEntries = config.openResourceDiscoveryV1?.documents ?? [];

        const entries = allEntries.filter(
          (e) =>
            ((e as { perspective?: string }).perspective ??
              DEFAULT_PERSPECTIVE) === perspectiveId,
        );

        const docUrls = entries
          .filter((e) => e.url?.trim())
          .map((e) => getFetchUrl(baseUrl, e.url!));

        if (docUrls.length === 0) {
          throw new Error(
            `No document URLs for perspective "${perspectiveId}"`,
          );
        }

        const fetched = await Promise.all(
          docUrls.map(async (url): Promise<OrdDocument> => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
            return (await res.json()) as OrdDocument;
          }),
        );

        const merged = mergeDocuments(fetched);
        const result =
          merged.find((d) => d.perspective === perspectiveId) ?? merged[0];

        if (!cancelled) setDocument(result ?? null);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ordConfigUrl, perspectiveId, retryCount]);

  return { document, loading, error, retry };
}

function ExplorerPageContent({
  ordConfigUrl,
  perspectiveId,
  className,
  prefetchDefinitions = false,
}: ExplorerPageProps): ReactNode {
  const { document, loading, error, retry } = useOrdDocumentFromUrl(
    ordConfigUrl,
    perspectiveId,
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={retry}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <ORDExplorer
      document={document}
      className={className}
      prefetchDefinitions={prefetchDefinitions}
    />
  );
}

export function ExplorerPage(props: ExplorerPageProps): ReactNode {
  return (
    <ThemeProvider>
      <ExplorerPageContent {...props} />
    </ThemeProvider>
  );
}
