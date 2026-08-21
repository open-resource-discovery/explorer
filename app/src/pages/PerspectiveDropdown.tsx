import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Layers } from "lucide-react";
import { getConnection } from "@lib/connection/store";
import { usePerspectives } from "@lib/hooks/usePerspectives";
import { useClickOutside } from "@lib/hooks/useClickOutside";
import { Button } from "@open-resource-discovery/ui-components";

interface Props {
  connectionId: string;
  currentPerspectiveId: string;
  onReset: () => void;
  hasResourceDetail: boolean;
}

export function PerspectiveDropdown({
  connectionId,
  currentPerspectiveId,
  onReset,
  hasResourceDetail,
}: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const connection = getConnection(connectionId);
  const [perspectivesState] = usePerspectives(
    connection ?? {
      id: connectionId,
      name: "",
      ordConfigUrl: "",
      type: "system-endpoint",
      auth: "none",
    },
  );

  useClickOutside(ref, () => setOpen(false));

  const perspectives =
    perspectivesState.status === "ready" ? perspectivesState.perspectives : [];
  const current = perspectives.find((p) => p.id === currentPerspectiveId);
  const displayName = current?.label ?? current?.id ?? currentPerspectiveId;

  if (perspectivesState.status !== "ready" || perspectives.length <= 1) {
    if (hasResourceDetail) {
      return (
        <Button
          variant="ghost"
          onClick={onReset}
          className="h-auto flex items-center gap-1 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          {displayName}
        </Button>
      );
    }
    return (
      <span className="flex items-center gap-1 border-b-2 border-primary px-3 py-3 text-sm font-medium text-primary">
        <Layers className="h-3.5 w-3.5 shrink-0" />
        {displayName}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex items-center border-b-2 transition-colors ${
          hasResourceDetail
            ? "border-transparent text-muted-foreground hover:text-foreground"
            : "border-primary text-primary"
        }`}
      >
        <Button
          variant="ghost"
          onClick={() => {
            setOpen(false);
            if (hasResourceDetail) onReset();
          }}
          className="h-auto flex items-center gap-1 py-3 pl-3 text-sm font-medium"
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          {displayName}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOpen((o) => !o)}
          className="h-auto px-1 py-3 pr-3"
          aria-label="Switch perspective"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-border/60 bg-background shadow-lg">
          {perspectives.map((p, i) => (
            <Button
              variant="ghost"
              key={p.id}
              className={`h-auto flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${
                i === 0 ? "rounded-t-lg" : ""
              } ${i === perspectives.length - 1 ? "rounded-b-lg" : ""}`}
              onClick={() => {
                setOpen(false);
                if (p.id === currentPerspectiveId) {
                  if (hasResourceDetail) onReset();
                  return;
                }
                void navigate({
                  to: "/connections/$id/documents/$docId",
                  params: { id: connectionId, docId: p.id },
                  hash: "",
                });
              }}
            >
              <Layers
                className={`h-3.5 w-3.5 shrink-0 ${p.id === currentPerspectiveId ? "text-primary" : "text-muted-foreground"}`}
              />
              <span className="truncate text-foreground">
                {p.label ?? p.id}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
