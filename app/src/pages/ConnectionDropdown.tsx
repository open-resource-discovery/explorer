import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Server } from "lucide-react";
import { getConnections } from "@lib/connection/store";
import type { Connection } from "@lib/connection/types";
import { useClickOutside } from "@lib/hooks/useClickOutside";
import { Button } from "@open-resource-discovery/ui-components";

interface Props {
  currentConnectionId: string;
  currentPerspectiveId: string;
  onReset: () => void;
  hasResourceDetail: boolean;
}

export function ConnectionDropdown({
  currentConnectionId,
  currentPerspectiveId,
  onReset,
  hasResourceDetail,
}: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const connections = getConnections();
  const current = connections.find((c) => c.id === currentConnectionId);

  useClickOutside(ref, () => setOpen(false));

  function switchTo(conn: Connection) {
    setOpen(false);
    if (conn.id === currentConnectionId) {
      if (hasResourceDetail) onReset();
      return;
    }
    // Navigate with the same perspective ID — ExplorerPage handles missing perspective gracefully
    void navigate({
      to: "/connections/$id/documents/$docId",
      params: { id: conn.id, docId: currentPerspectiveId },
    });
  }

  if (connections.length <= 1) {
    return (
      <span className="flex items-center border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground">
        {current?.name ?? currentConnectionId}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex items-center border-b-2 transition-colors ${
          open
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <Button
          variant="ghost"
          onClick={() => {
            setOpen(false);
            if (hasResourceDetail) onReset();
          }}
          className="h-auto py-3 pl-3 text-sm font-medium"
        >
          {current?.name ?? currentConnectionId}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOpen((o) => !o)}
          className="h-auto px-1 py-3 pr-3"
          aria-label="Switch connection"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-56 rounded-lg border border-border/60 bg-background shadow-lg">
          {connections.map((conn, i) => (
            <div
              key={conn.id}
              className={`flex items-center justify-between gap-2 px-3 py-2 hover:bg-accent ${
                i === 0 ? "rounded-t-lg" : ""
              }`}
            >
              <Button
                variant="ghost"
                className="h-auto flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                onClick={() => switchTo(conn)}
              >
                <Server
                  className={`h-3.5 w-3.5 shrink-0 ${conn.id === currentConnectionId ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="truncate text-foreground">{conn.name}</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  void navigate({
                    to: "/connections/$id",
                    params: { id: conn.id },
                  });
                }}
                className="h-auto shrink-0 text-xs text-primary hover:underline"
              >
                Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
