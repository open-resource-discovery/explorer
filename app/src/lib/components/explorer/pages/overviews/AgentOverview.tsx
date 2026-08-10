import { Bot } from "lucide-react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import type { Agent } from "@open-resource-discovery/specification";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import type { Selection } from "../../useNavState";
import { asBase } from "../resourceTypes";
import { MD_CLASSES } from "../shared";
import {
  OverviewBase,
  packageRelGroup,
  productRelGroups,
  groupRelGroups,
  resourceRelGroup,
  formatDate,
} from "./OverviewBase";

export function AgentOverview({
  resource,
  onSelect,
}: {
  resource: Agent;
  onSelect: (s: Selection) => void;
}) {
  const document = useOrdDocument();
  const base = asBase(resource);

  const detailFields = [
    ...(base.lastUpdate
      ? [{ label: "Last Update", value: formatDate(base.lastUpdate) }]
      : []),
    ...(base.deprecationDate
      ? [{ label: "Deprecation Date", value: formatDate(base.deprecationDate) }]
      : []),
    ...(base.sunsetDate
      ? [{ label: "Sunset Date", value: formatDate(base.sunsetDate) }]
      : []),
  ];

  const relatedEntityIds = resource.relatedEntityTypes ?? [];
  const exposedApiIds = (resource.exposedApiResources ?? []).map(
    (r) => r.ordId,
  );
  const integrationIds = resource.integrationDependencies ?? [];

  const relationshipGroups = [
    packageRelGroup(document, base.partOfPackage, onSelect),
    productRelGroups(document, resource.partOfProducts ?? [], onSelect),
    groupRelGroups(document, resource.partOfGroups ?? [], onSelect),
    resourceRelGroup(
      document,
      "Related entity types",
      relatedEntityIds,
      onSelect,
    ),
    resourceRelGroup(
      document,
      "Exposed API resources",
      exposedApiIds,
      onSelect,
    ),
    resourceRelGroup(
      document,
      "Integration dependencies",
      integrationIds,
      onSelect,
    ),
    resourceRelGroup(
      document,
      "Successors",
      resource.successors ?? [],
      onSelect,
    ),
  ];

  return (
    <OverviewBase
      resource={resource}
      resourceType="agents"
      detailFields={detailFields}
      relationshipGroups={relationshipGroups}
    >
      {resource.aiHint && (
        <div className="rounded-[var(--ord-radius)] border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Bot className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              AI Hint
            </span>
          </div>
          <div
            className={`prose prose-sm max-w-none text-card-fg dark:prose-invert ${MD_CLASSES}`}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
              {resource.aiHint}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </OverviewBase>
  );
}
