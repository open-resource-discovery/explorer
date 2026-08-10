import { ChevronLeft, Layers2 } from "lucide-react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { CopyButton } from "./shared";
import { ResourceGroupList, getResourcesInGroup } from "../ResourceGroupList";
import type { Selection } from "../useNavState";

export interface GroupDetailPageProps {
  groupId: string;
  onSelect: (s: Selection) => void;
}

export function GroupDetailPage({ groupId, onSelect }: GroupDetailPageProps) {
  const document = useOrdDocument();
  const group = (document.groups ?? []).find((g) => g.groupId === groupId);

  if (!group) {
    return (
      <div className="px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Group not found: {groupId}
        </p>
      </div>
    );
  }

  const parentGroup =
    (group.partOfGroups ?? []).length > 0
      ? (document.groups ?? []).find(
          (g) => g.groupId === group.partOfGroups![0],
        )
      : undefined;
  const parentGroupId = (group.partOfGroups ?? [])[0];

  const groupType = (document.groupTypes ?? []).find(
    (gt) => gt.groupTypeId === group.groupTypeId,
  );

  const resourcesInGroup = getResourcesInGroup(document, groupId);

  return (
    <div className="bg-background" data-testid="group-detail">
      <div className="px-6 pt-5 pb-0">
        <button
          onClick={() => onSelect({ id: "groups" })}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Groups
        </button>

        <div className="flex items-start gap-3 mb-6">
          <div className="shrink-0 rounded-lg border border-border/60 p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
            <Layers2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-card-fg">{group.title}</h1>
            {groupType && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {groupType.title}
              </p>
            )}
            <div className="flex items-center gap-1 mt-2">
              <code className="text-xs font-mono bg-muted/40 border border-border rounded px-2 py-1 text-muted-foreground">
                {group.groupId}
              </code>
              <CopyButton text={group.groupId} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {group.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {group.description}
          </p>
        )}

        {parentGroupId && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Parent group
            </p>
            <button
              className="w-full text-left rounded-[var(--ord-radius)] border border-border bg-card-bg px-3 py-2 hover:bg-muted/30 transition-colors"
              onClick={() =>
                onSelect({ id: "groupDetail", groupId: parentGroupId })
              }
            >
              <p className="text-sm font-medium text-card-fg">
                {parentGroup?.title ?? parentGroupId}
              </p>
              <p className="text-xs font-mono text-muted-foreground truncate">
                {parentGroupId}
              </p>
            </button>
          </div>
        )}

        <ResourceGroupList
          heading="Resources in this group"
          groups={resourcesInGroup}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
