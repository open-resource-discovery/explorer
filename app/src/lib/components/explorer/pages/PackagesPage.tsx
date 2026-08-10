import { useState } from "react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { Badge } from "@open-resource-discovery/ui-components";
import {
  ExternalLink,
  FileIcon,
  LifeBuoy,
  Tag,
  ChevronRight,
} from "lucide-react";
import type { Selection } from "../useNavState";

function ExpandableText({
  text,
  maxLines = 2,
}: {
  text: string;
  maxLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <p
        className={`text-xs text-muted-foreground whitespace-pre-wrap ${expanded ? "" : `line-clamp-${maxLines}`}`}
      >
        {text}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="text-xs text-primary hover:underline mt-0.5"
        aria-expanded={expanded}
      >
        {expanded ? "Less" : "More"}
      </button>
    </div>
  );
}

export interface PackagesPageProps {
  onSelect: (s: Selection) => void;
}

export function PackagesPage({ onSelect }: PackagesPageProps) {
  const document = useOrdDocument();
  const packages = document.packages ?? [];

  return (
    <div className="bg-background" data-testid="packages-list">
      <div className="p-4 space-y-3">
        {packages.length === 0 && (
          <p className="text-sm text-muted-foreground">No packages found.</p>
        )}
        {packages.map((pkg) => (
          <button
            key={pkg.ordId}
            onClick={() => onSelect({ id: "packageDetail", ordId: pkg.ordId })}
            className="w-full text-left rounded-[var(--ord-radius)] border border-border bg-card-bg p-4 flex flex-col gap-1.5 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-card-fg">
                {pkg.title}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {pkg.licenseType && (
                  <Badge variant="outline" size="sm">
                    {pkg.licenseType}
                  </Badge>
                )}
                {pkg.policyLevel && pkg.policyLevel !== "none" && (
                  <Badge variant="secondary" size="sm">
                    {pkg.policyLevel === "custom"
                      ? (pkg.customPolicyLevel ?? "custom")
                      : pkg.policyLevel}
                  </Badge>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            {pkg.shortDescription && (
              <p className="text-xs text-muted-foreground">
                {pkg.shortDescription}
              </p>
            )}
            {pkg.description && (
              <ExpandableText text={pkg.description} maxLines={2} />
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {pkg.vendor && (
                <span className="font-medium text-card-fg">{pkg.vendor}</span>
              )}
              {pkg.version && <span className="font-mono">v{pkg.version}</span>}
            </div>
            {(pkg.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                <Tag className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                {(pkg.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {(pkg.packageLinks ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(pkg.packageLinks ?? []).map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${l.type.replace(/-/g, " ")} (opens in new tab)`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    {l.type.replace(/-/g, " ")}
                  </a>
                ))}
              </div>
            )}
            {(pkg.links ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(pkg.links ?? []).map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${l.title} (opens in new tab)`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    {l.title}
                  </a>
                ))}
              </div>
            )}
            {(pkg.files ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(pkg.files ?? []).map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${f.title} (opens in new tab)`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <FileIcon className="h-3 w-3" aria-hidden="true" />
                    {f.title}
                  </a>
                ))}
              </div>
            )}
            {pkg.supportInfo && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <LifeBuoy
                  className="h-3 w-3 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="whitespace-pre-wrap">{pkg.supportInfo}</p>
              </div>
            )}
            <p className="text-xs font-mono text-muted-foreground truncate">
              {pkg.ordId}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
