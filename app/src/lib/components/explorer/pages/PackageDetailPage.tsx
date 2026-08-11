import {
  ChevronLeft,
  ExternalLink,
  FileIcon,
  LifeBuoy,
  Tag,
  Package,
} from "lucide-react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { Badge } from "@open-resource-discovery/ui-components";
import { CopyButton } from "../CopyButton";
import { ResourceGroupList, getResourcesInPackage } from "../ResourceGroupList";
import type { Selection } from "../useNavState";

export interface PackageDetailPageProps {
  ordId: string;
  onSelect: (s: Selection) => void;
}

export function PackageDetailPage({ ordId, onSelect }: PackageDetailPageProps) {
  const document = useOrdDocument();
  const pkg = (document.packages ?? []).find((p) => p.ordId === ordId);

  if (!pkg) {
    return (
      <div className="px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Package not found: {ordId}
        </p>
      </div>
    );
  }

  const resourcesInPackage = getResourcesInPackage(document, ordId);

  return (
    <div className="bg-background" data-testid="package-detail">
      <div className="px-6 pt-5 pb-0">
        {/* Back button */}
        <button
          onClick={() => onSelect({ id: "packages" })}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Packages
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="shrink-0 rounded-lg border border-border/60 p-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-card-fg">{pkg.title}</h1>
              {pkg.version && (
                <Badge variant="outline" size="sm">
                  v{pkg.version}
                </Badge>
              )}
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
            </div>
            {pkg.vendor && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {pkg.vendor}
              </p>
            )}
            <div className="flex items-center gap-1 mt-2">
              <code className="text-xs font-mono bg-muted/40 border border-border rounded px-2 py-1 text-muted-foreground">
                {pkg.ordId}
              </code>
              <CopyButton text={pkg.ordId} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Description */}
        {(pkg.shortDescription || pkg.description) && (
          <div className="space-y-1.5">
            {pkg.shortDescription && (
              <p className="text-sm text-muted-foreground">
                {pkg.shortDescription}
              </p>
            )}
            {pkg.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {pkg.description}
              </p>
            )}
          </div>
        )}

        {/* Tags */}
        {(pkg.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
            {(pkg.tags ?? []).map((tag) => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Links */}
        {((pkg.packageLinks ?? []).length > 0 ||
          (pkg.links ?? []).length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {(pkg.packageLinks ?? []).map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${l.type.replace(/-/g, " ")} (opens in new tab)`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {l.type.replace(/-/g, " ")}
              </a>
            ))}
            {(pkg.links ?? []).map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${l.title} (opens in new tab)`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {l.title}
              </a>
            ))}
          </div>
        )}

        {/* Files */}
        {(pkg.files ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(pkg.files ?? []).map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${f.title} (opens in new tab)`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                <FileIcon className="h-3 w-3" aria-hidden="true" />
                {f.title}
              </a>
            ))}
          </div>
        )}

        {/* Support info */}
        {pkg.supportInfo && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <LifeBuoy className="h-3 w-3 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="whitespace-pre-wrap">{pkg.supportInfo}</p>
          </div>
        )}

        <ResourceGroupList
          heading="Resources in this package"
          groups={resourcesInPackage}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
