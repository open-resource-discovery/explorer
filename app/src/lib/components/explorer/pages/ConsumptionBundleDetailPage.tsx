import { ChevronLeft, ExternalLink, Link, Box } from "lucide-react";
import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { Badge } from "@open-resource-discovery/ui-components";
import { CopyButton } from "../CopyButton";
import { ResourceGroupList, getResourcesInBundle } from "../ResourceGroupList";
import type { Selection } from "../useNavState";

export interface ConsumptionBundleDetailPageProps {
  ordId: string;
  onSelect: (s: Selection) => void;
}

export function ConsumptionBundleDetailPage({
  ordId,
  onSelect,
}: ConsumptionBundleDetailPageProps) {
  const document = useOrdDocument();
  const bundle = (document.consumptionBundles ?? []).find(
    (b) => b.ordId === ordId,
  );

  if (!bundle) {
    return (
      <div className="px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Consumption bundle not found: {ordId}
        </p>
      </div>
    );
  }

  const resourcesInBundle = getResourcesInBundle(document, ordId);

  return (
    <div className="bg-background" data-testid="consumption-bundle-detail">
      <div className="px-6 pt-5 pb-0">
        {/* Back button */}
        <button
          onClick={() => onSelect({ id: "consumptionBundles" })}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Consumption Bundles
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="shrink-0 rounded-lg border border-border/60 p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
            <Box className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-card-fg">{bundle.title}</h1>
              {bundle.version && (
                <Badge variant="outline" size="sm">
                  v{bundle.version}
                </Badge>
              )}
              {bundle.visibility && bundle.visibility !== "public" && (
                <Badge variant="secondary" size="sm">
                  {bundle.visibility}
                </Badge>
              )}
            </div>
            {bundle.lastUpdate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Updated {bundle.lastUpdate.slice(0, 10)}
              </p>
            )}
            <div className="flex items-center gap-1 mt-2">
              <code className="text-xs font-mono bg-muted/40 border border-border rounded px-2 py-1 text-muted-foreground">
                {bundle.ordId}
              </code>
              <CopyButton text={bundle.ordId} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Description */}
        {(bundle.shortDescription || bundle.description) && (
          <div className="space-y-1.5">
            {bundle.shortDescription && (
              <p className="text-sm text-muted-foreground">
                {bundle.shortDescription}
              </p>
            )}
            {bundle.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {bundle.description}
              </p>
            )}
          </div>
        )}

        {/* Auth / credential exchange strategies */}
        {(bundle.credentialExchangeStrategies ?? []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-card-fg mb-1.5">Auth</p>
            <div className="flex flex-col gap-1">
              {(bundle.credentialExchangeStrategies ?? []).map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" size="sm">
                    {s.type === "custom" ? (s.customType ?? "custom") : s.type}
                  </Badge>
                  {s.callbackUrl && (
                    <a
                      href={s.callbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Credential exchange callback (opens in new tab)"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Link className="h-3 w-3" aria-hidden="true" />
                      callback
                    </a>
                  )}
                  {s.customDescription && (
                    <span className="text-xs text-muted-foreground">
                      {s.customDescription}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {(bundle.links ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(bundle.links ?? []).map((l, i) => (
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

        <ResourceGroupList
          heading="Resources in this bundle"
          groups={resourcesInBundle}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
