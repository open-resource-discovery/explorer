import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { OrdDocument } from "@open-resource-discovery/specification";
import { fetchOrdDocumentForPerspective } from "@lib/fetcher";
import { ORDExplorer } from "@lib/components/explorer/ORDExplorer";
import { ThemeProvider } from "@lib/hooks/useTheme.tsx";
import { cn } from "@lib/utils/cn";
import { Loader2, AlertTriangle } from "lucide-react";

export interface ExplorerPageProps {
  ordConfigUrl: string;
  perspectiveId: string;
  className?: string;
  prefetchDefinitions?: boolean;
}

function ExplorerPageContent({
  ordConfigUrl,
  perspectiveId,
  className,
  prefetchDefinitions = false,
}: ExplorerPageProps): ReactNode {
  const [document, setDocument] = useState<OrdDocument | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback((): void => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect((): (() => void) => {
    let cancelled = false;
    const controller = new AbortController();

    async function load(): Promise<void> {
      setLoading(true);
      setError(undefined);
      setDocument(undefined);

      try {
        const { document: doc } = await fetchOrdDocumentForPerspective(
          ordConfigUrl,
          perspectiveId,
          undefined,
          controller.signal,
        );
        if (!cancelled) setDocument(doc);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return (): void => {
      cancelled = true;
      controller.abort();
    };
  }, [ordConfigUrl, perspectiveId, retryCount]);

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
      className={cn("h-full", className)}
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
