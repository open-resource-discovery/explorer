import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { ChevronRight } from "lucide-react";
import type { Selection } from "../useNavState";

export interface GroupsPageProps {
  onSelect: (s: Selection) => void;
}

export function GroupsPage({ onSelect }: GroupsPageProps) {
  const document = useOrdDocument();
  const groups = document.groups ?? [];

  return (
    <div className="bg-background" data-testid="groups-list">
      <div className="p-4 space-y-3">
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">No groups found.</p>
        )}
        {groups.map((group) => (
          <button
            key={group.groupId}
            onClick={() =>
              onSelect({ id: "groupDetail", groupId: group.groupId })
            }
            className="w-full text-left rounded-[var(--ord-radius)] border border-border bg-card-bg p-4 flex flex-col gap-1.5 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-card-fg">
                {group.title}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
            </div>
            {group.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {group.description}
              </p>
            )}
            <p className="text-xs font-mono text-muted-foreground truncate">
              {group.groupId}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
