import { useState } from "react";
import {
  ExternalLink,
  Link2,
  Hash,
  GitBranch,
  Info,
  BookOpen as BookOpenIcon,
  Eye,
  Layers,
} from "lucide-react";
import { SimpleDialog } from "@open-resource-discovery/ui-components";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import type { AnyResource } from "../resourceTypes";
import { asBase } from "../resourceTypes";
import { SectionHeader, DetailRow, MD_CLASSES } from "../shared";
import {
  getResourceDefinitions,
  pickPrimaryDefinition,
} from "../definitionUtils";
import { MetadataPreview } from "../DefinitionLoader";
import { RelationshipCard } from "../../RelationshipCard";
import { RESOURCE_TYPE_CONFIG } from "../../resourceTypeConfig";
import type { ResourceTypeGroup } from "../../explorerTypes";
import type { Selection } from "../../useNavState";
import { ordIdToResourceTypeGroup } from "../../ordIdUtils";
import type { OrdDocument } from "@open-resource-discovery/specification";

export interface RelationshipItem {
  id: string;
  title: string;
  /** Tailwind bg class */
  bg: string;
  /** Tailwind fg class */
  fg: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export interface RelationshipGroup {
  label: string;
  items: RelationshipItem[];
}

interface OverviewBaseProps {
  resource: AnyResource;
  resourceType: ResourceTypeGroup;
  detailFields: { label: string; value: React.ReactNode }[];
  relationshipGroups: RelationshipGroup[];
  apiLinks?: { type: string; url: string; title?: string }[];
  children?: React.ReactNode;
}

export function OverviewBase({
  resource,
  resourceType,
  detailFields,
  relationshipGroups,
  apiLinks = [],
  children,
}: OverviewBaseProps) {
  const base = asBase(resource);
  const primaryDef = pickPrimaryDefinition(
    getResourceDefinitions(resource, resourceType),
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const genericLinks = base.links ?? [];
  const hasRelationships = relationshipGroups.some((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {base.description && (
        <div>
          <SectionHeader
            icon={<BookOpenIcon className="h-3.5 w-3.5" />}
            label="Description"
          />
          <div
            className={`rounded-[var(--ord-radius)] border border-border bg-card-bg p-4 prose prose-sm max-w-none text-card-fg dark:prose-invert ${MD_CLASSES}`}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
              {base.description}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {primaryDef && (
        <div>
          <button
            onClick={() => setPreviewOpen(true)}
            data-testid="preview-definition-button"
            className="inline-flex items-center gap-2 rounded-[var(--ord-radius)] border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Preview Definition</span>
          </button>
          <SimpleDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            title={`Preview — ${primaryDef.type}`}
            className="w-[95vw] max-w-[95vw] h-[90vh] flex flex-col"
          >
            <MetadataPreview def={primaryDef} />
          </SimpleDialog>
        </div>
      )}

      {/* Per-type extra content (e.g. Agent AI Hint) */}
      {children}

      {detailFields.length > 0 && (
        <div>
          <SectionHeader
            icon={<Info className="h-3.5 w-3.5" />}
            label="Details"
          />
          <div className="grid grid-cols-2 gap-2">
            {detailFields.map((f) => (
              <DetailRow key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      )}

      {apiLinks.length > 0 && (
        <div>
          <SectionHeader
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Documentation Links"
          />
          <div className="space-y-1.5">
            {apiLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-[var(--ord-radius)] border border-border bg-card-bg px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-card-fg">
                  {l.title ?? l.type.replace(/-/g, " ")}
                </span>
                <span className="text-xs text-muted-foreground truncate ml-1">
                  {l.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {genericLinks.length > 0 && (
        <div>
          <SectionHeader
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Links"
          />
          <div className="space-y-1.5">
            {genericLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-[var(--ord-radius)] border border-border bg-card-bg px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-card-fg">
                  {l.title}
                </span>
                <span className="text-xs text-muted-foreground truncate ml-1">
                  {l.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {(base.tags ?? []).length > 0 && (
        <div>
          <SectionHeader
            icon={<Hash className="h-3.5 w-3.5" />}
            label="Tags & Labels"
          />
          <div className="flex flex-wrap gap-1.5">
            {(base.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasRelationships && (
        <div>
          <SectionHeader
            icon={<GitBranch className="h-3.5 w-3.5" />}
            label="Relationships"
          />
          <div className="space-y-4">
            {relationshipGroups
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-card-fg mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <RelationshipCard
                        key={item.id}
                        title={item.title}
                        subtitle={item.id}
                        customBg={item.bg}
                        customFg={item.fg}
                        iconNode={item.icon}
                        onClick={item.onClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared relationship-building helpers
// ---------------------------------------------------------------------------

function cfgFor(type: ResourceTypeGroup) {
  return RESOURCE_TYPE_CONFIG.find((c) => c.type === type);
}

export function packageRelGroup(
  document: OrdDocument,
  packageOrdId: string | undefined,
  onSelect: (s: Selection) => void,
): RelationshipGroup {
  if (!packageOrdId) return { label: "Part of package", items: [] };
  const pkg = (document.packages ?? []).find((p) => p.ordId === packageOrdId);
  return {
    label: "Part of package",
    items: [
      {
        id: packageOrdId,
        title: pkg?.title ?? packageOrdId,
        bg: "bg-slate-100 dark:bg-slate-900",
        fg: "text-slate-600 dark:text-slate-400",
        icon: <BookOpenIcon className="h-4 w-4" />,
        onClick: pkg
          ? () => onSelect({ id: "packageDetail", ordId: packageOrdId })
          : undefined,
      },
    ],
  };
}

export function bundleRelGroups(
  document: OrdDocument,
  refs: { ordId: string }[],
  onSelect: (s: Selection) => void,
): RelationshipGroup {
  return {
    label: "In consumption bundles",
    items: refs.map((ref) => {
      const b = (document.consumptionBundles ?? []).find(
        (x) => x.ordId === ref.ordId,
      );
      return {
        id: ref.ordId,
        title: b?.title ?? ref.ordId,
        bg: "bg-indigo-100 dark:bg-indigo-900",
        fg: "text-indigo-600 dark:text-indigo-400",
        icon: <Layers className="h-4 w-4" />,
        onClick: b
          ? () => onSelect({ id: "consumptionBundleDetail", ordId: ref.ordId })
          : undefined,
      };
    }),
  };
}

export function productRelGroups(
  document: OrdDocument,
  productOrdIds: string[],
  onSelect: (s: Selection) => void,
): RelationshipGroup {
  return {
    label: "Part of products",
    items: productOrdIds.map((pid) => {
      const p = (document.products ?? []).find((x) => x.ordId === pid);
      return {
        id: pid,
        title: p?.title ?? pid,
        bg: "bg-violet-100 dark:bg-violet-900",
        fg: "text-violet-600 dark:text-violet-400",
        icon: <BookOpenIcon className="h-4 w-4" />,
        onClick: p
          ? () => onSelect({ id: "productDetail", ordId: pid })
          : undefined,
      };
    }),
  };
}

export function groupRelGroups(
  document: OrdDocument,
  groupIds: string[],
  onSelect: (s: Selection) => void,
): RelationshipGroup {
  return {
    label: "Part of groups",
    items: groupIds.map((gid) => {
      const g = (document.groups ?? []).find((x) => x.groupId === gid);
      return {
        id: gid,
        title: g?.title ?? gid,
        bg: "bg-emerald-100 dark:bg-emerald-900",
        fg: "text-emerald-600 dark:text-emerald-400",
        icon: <BookOpenIcon className="h-4 w-4" />,
        onClick: g
          ? () => onSelect({ id: "groupDetail", groupId: gid })
          : undefined,
      };
    }),
  };
}

export function resourceRelGroup(
  document: OrdDocument,
  label: string,
  ordIds: string[],
  onSelect: (s: Selection) => void,
): RelationshipGroup {
  return {
    label,
    items: ordIds.map((oid) => {
      const rtype = ordIdToResourceTypeGroup(oid) ?? undefined;
      const cfg = rtype ? cfgFor(rtype) : undefined;
      const items = rtype ? (document[rtype] ?? []) : [];
      const found = (items as { ordId: string; title: string }[]).find(
        (x) => x.ordId === oid,
      );
      return {
        id: oid,
        title: found?.title ?? oid,
        bg: cfg?.bg ?? "bg-muted",
        fg: cfg?.fg ?? "text-muted-foreground",
        icon: cfg?.icon ?? <BookOpenIcon className="h-4 w-4" />,
        onClick:
          found && rtype
            ? () =>
                onSelect({
                  id: "resourceDetail",
                  resourceType: rtype,
                  ordId: oid,
                })
            : undefined,
      };
    }),
  };
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
