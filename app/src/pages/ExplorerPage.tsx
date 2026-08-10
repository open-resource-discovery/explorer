import { useParams } from "@tanstack/react-router";
import { ORDExplorer } from "../lib/components/explorer/ORDExplorer";
import { getConnection } from "@lib/connection";
import { useOrdDocument } from "@lib/hooks";
import { AuthErrorCard } from "@lib/components/auth/AuthRecovery";

export function ExplorerPage() {
  const { id: connectionId, docId: perspectiveId } = useParams({
    strict: false,
  });
  const { document, loading, error, authError, retry } = useOrdDocument(
    connectionId ?? "",
    perspectiveId ?? "",
  );
  const prefetchDefinitions =
    getConnection(connectionId ?? "")?.prefetchDefinitions ?? false;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-md">
          <AuthErrorCard
            authError={authError}
            connectionId={connectionId ?? ""}
            onRetry={retry}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <ORDExplorer
      document={document}
      className="h-full"
      connectionId={connectionId ?? ""}
      prefetchDefinitions={prefetchDefinitions}
      enableUrlSync
    />
  );
}
