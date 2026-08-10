import { useOrdDocument } from "@lib/context/OrdDocumentContext";
import { Badge } from "@open-resource-discovery/ui-components";
import { ExternalLink, Link, ChevronRight } from "lucide-react";
import type { Selection } from "../useNavState";

export interface ConsumptionBundlesPageProps {
  onSelect: (s: Selection) => void;
}

export function ConsumptionBundlesPage({
  onSelect,
}: ConsumptionBundlesPageProps) {
  const document = useOrdDocument();
  const bundles = document.consumptionBundles ?? [];

  return (
    <div className="bg-background" data-testid="consumption-bundles-list">
      <div className="p-4 space-y-3">
        {bundles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No consumption bundles found.
          </p>
        )}
        {bundles.map((bundle) => (
          <button
            key={bundle.ordId}
            onClick={() =>
              onSelect({ id: "consumptionBundleDetail", ordId: bundle.ordId })
            }
            className="w-full text-left rounded-[var(--ord-radius)] border border-border bg-card-bg p-4 flex flex-col gap-1.5 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-card-fg">
                {bundle.title}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {bundle.visibility && bundle.visibility !== "public" && (
                  <Badge variant="secondary" size="sm">
                    {bundle.visibility}
                  </Badge>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            {bundle.shortDescription && (
              <p className="text-xs text-muted-foreground">
                {bundle.shortDescription}
              </p>
            )}
            {bundle.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {bundle.description}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {bundle.version && (
                <span className="font-mono">v{bundle.version}</span>
              )}
              {bundle.lastUpdate && (
                <span>Updated {bundle.lastUpdate.slice(0, 10)}</span>
              )}
            </div>
            {(bundle.credentialExchangeStrategies ?? []).length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Auth:</span>
                {(bundle.credentialExchangeStrategies ?? []).map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" size="sm">
                      {s.type === "custom"
                        ? (s.customType ?? "custom")
                        : s.type}
                    </Badge>
                    {s.callbackUrl && (
                      <a
                        href={s.callbackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
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
            )}
            {(bundle.links ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(bundle.links ?? []).map((l, i) => (
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
            <p className="text-xs font-mono text-muted-foreground truncate">
              {bundle.ordId}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
