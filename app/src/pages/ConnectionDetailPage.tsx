import { Link, useNavigate } from "@tanstack/react-router";
import {
  PlugZap,
  Globe,
  RefreshCw,
  Pencil,
  AlertTriangle,
  CheckCircle,
  LayoutGrid,
  Layers,
  XCircle,
  Loader2,
} from "lucide-react";
import { connectionDetailRoute } from "../router";
import { getConnection } from "../lib/connection/store";
import type { Connection } from "../lib/connection/types";
import { usePerspectives } from "../lib/hooks/usePerspectives";
import { AuthErrorCard } from "../lib/components/auth/AuthRecovery";

function ConnectionDetail({ connection }: { connection: Connection }) {
  const [perspectivesState, retryPerspectives] = usePerspectives(connection);
  const navigate = useNavigate();

  const perspectives =
    perspectivesState.status === "ready" ? perspectivesState.perspectives : [];

  const authLabel =
    connection.auth === "none"
      ? "No auth"
      : connection.auth === "bearer"
        ? "Bearer token"
        : "mTLS";
  const typeLabel = "System endpoint";

  const statusBadge =
    perspectivesState.status === "ready" ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
        <CheckCircle className="h-3.5 w-3.5" />
        Connected
      </span>
    ) : perspectivesState.status === "error" ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive-foreground bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
        <XCircle className="h-3.5 w-3.5" />
        Error
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading
      </span>
    );

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1080px] space-y-6 px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-primary/10">
              <PlugZap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {connection.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {statusBadge}
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  {typeLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  {authLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={retryPerspectives}
              disabled={perspectivesState.status === "loading"}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent disabled:opacity-50"
            >
              {perspectivesState.status === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {perspectivesState.status === "loading" ? "Loading…" : "Refresh"}
            </button>
            <button
              onClick={() =>
                void navigate({
                  to: "/connections/$id/edit",
                  params: { id: connection.id },
                })
              }
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </div>

        {perspectivesState.status === "error" &&
          (perspectivesState.authError ? (
            <AuthErrorCard
              authError={perspectivesState.authError}
              connectionId={connection.id}
              onRetry={retryPerspectives}
            />
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <p className="font-medium text-red-800">
                  Failed to load perspectives
                </p>
                <p className="mt-0.5 text-sm text-red-700">
                  {perspectivesState.error}
                </p>
              </div>
            </div>
          ))}

        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <div className="flex items-center border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              Endpoint
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-border">
            <div className="px-5 py-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                ORD Configuration URL
              </p>
              <a
                href={connection.ordConfigUrl}
                className="break-all font-mono text-sm text-primary hover:underline"
              >
                {connection.ordConfigUrl}
              </a>
            </div>
            <div className="px-5 py-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Authentication
              </p>
              <span className="text-sm text-foreground">{authLabel}</span>
            </div>
            <div className="px-5 py-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Perspectives
              </p>
              <span className="text-sm text-foreground">
                {perspectivesState.status === "loading"
                  ? "Loading…"
                  : perspectives.length > 0
                    ? perspectives.length
                    : "None found"}
              </span>
            </div>
            {perspectivesState.status === "ready" && (
              <div className="px-5 py-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Last fetched
                </p>
                <span className="text-sm text-foreground">
                  {perspectivesState.fetchedAt.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            Perspectives
          </div>
          {perspectivesState.status === "loading" ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              Loading perspectives…
            </div>
          ) : perspectivesState.status === "error" ? (
            perspectivesState.authError ? null : (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                Could not load perspectives: {perspectivesState.error}
              </div>
            )
          ) : perspectives.length === 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              No perspectives found.
            </div>
          ) : (
            <div className="space-y-3">
              {perspectives.map((perspective) => (
                <div
                  key={perspective.id}
                  className="overflow-hidden rounded-xl border border-border bg-background"
                >
                  <div className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10">
                        <Layers className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {perspective.label ?? perspective.id}
                        </div>
                        <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                          {perspective.id}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {perspective.documents.length}{" "}
                          {perspective.documents.length === 1
                            ? "document"
                            : "documents"}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/connections/$id/documents/$docId"
                      params={{ id: connection.id, docId: perspective.id }}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Explore
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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
