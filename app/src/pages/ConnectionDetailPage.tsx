import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutGrid, AlertTriangle } from "lucide-react";
import { connectionDetailRoute } from "../router";
import { getConnection } from "../lib/connection/store";
import type { Connection } from "../lib/connection/types";
import { usePerspectives } from "../lib/hooks/usePerspectives";
import { AuthErrorCard } from "../lib/components/auth/AuthRecovery";
import { ConnectionDetailPage as ConnectionDetailPageLib } from "../lib/components/ConnectionDetailPage";
import type { Perspective } from "../lib/connection/types";

function ConnectionDetail({ connection }: { connection: Connection }) {
  const [perspectivesState, retryPerspectives] = usePerspectives(connection);
  const navigate = useNavigate();

  if (
    perspectivesState.status === "error" &&
    perspectivesState.authError !== undefined
  ) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-md">
          <AuthErrorCard
            authError={perspectivesState.authError}
            connectionId={connection.id}
            onRetry={retryPerspectives}
          />
        </div>
      </div>
    );
  }

  function renderPerspectiveAction(perspective: Perspective): ReactNode {
    return (
      <Link
        to="/connections/$id/documents/$docId"
        params={{ id: connection.id, docId: perspective.id }}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <LayoutGrid className="h-4 w-4" />
        Explore
      </Link>
    );
  }

  return (
    <ConnectionDetailPageLib
      ordConfigUrl={connection.ordConfigUrl}
      connectionName={connection.name}
      auth={connection.auth}
      perspectivesState={perspectivesState}
      onRefresh={retryPerspectives}
      onEdit={() =>
        void navigate({
          to: "/connections/$id/edit",
          params: { id: connection.id },
        })
      }
      renderPerspectiveAction={renderPerspectiveAction}
    />
  );
}

export function ConnectionDetailPage() {
  const { id } = connectionDetailRoute.useParams();
  const connection = getConnection(id);

  if (!connection) {
    return (
      <div className="mx-auto max-w-[1080px] p-8">
        <div className="flex items-start gap-2 rounded-xl border border-border bg-background p-6">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium text-foreground">Connection not found</p>
            <Link
              to="/connections"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              ← Back to connections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ConnectionDetail connection={connection} />;
}
