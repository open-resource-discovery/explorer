import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  PlugZap,
  Globe,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { getConnections, deleteConnection } from "../lib/connection/store";
import type { Connection } from "../lib/connection/types";

function ConnectionCard({
  conn,
  onDeleted,
}: {
  conn: Connection;
  onDeleted: () => void;
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const typeLabel = "System endpoint";
  const authLabel =
    conn.auth === "none"
      ? "No auth"
      : conn.auth === "bearer"
        ? "Bearer token"
        : "mTLS";
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
            <PlugZap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{conn.name}</div>
            <div className="text-xs text-muted-foreground">
              {conn.ordConfigUrl}
            </div>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-background shadow-md">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  void navigate({
                    to: "/connections/$id/edit",
                    params: { id: conn.id },
                  });
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-t-lg"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  try {
                    deleteConnection(conn.id);
                    onDeleted();
                  } catch {
                    // localStorage write failed; state unchanged
                  }
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent rounded-b-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          {typeLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          {authLabel}
        </span>
      </div>

      <div className="mt-auto flex gap-2">
        <Link
          to="/connections/$id"
          params={{ id: conn.id }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open explorer →
        </Link>
      </div>
    </div>
  );
}

export function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>(getConnections);
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1080px] px-8 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Connections
            </h1>
            <p className="text-sm text-muted-foreground">
              Connect to an ORD provider to browse its catalog. Point at a
              system&apos;s discovery endpoint or a<br />
              single ORD document, add credentials if needed, and explore the
              resources it exposes.
            </p>
          </div>
          <button
            onClick={() => void navigate({ to: "/connections/new" })}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add connection
          </button>
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {connections.length}{" "}
            {connections.length === 1 ? "connection" : "connections"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              conn={conn}
              onDeleted={() => setConnections(getConnections())}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
