import { useState } from "react";
import { SimpleDialog } from "@open-resource-discovery/ui-components";
import { Eye, FileCode, Link2, Lock } from "lucide-react";
import type { ResourceTypeGroup } from "../ORDExplorer";
import type { AnyResource } from "./resourceTypes";
import { SectionHeader } from "./shared";
import { CopyButton } from "./shared";
import {
  getResourceDefinitions,
  type ResourceDefinition,
} from "./definitionUtils";
import { LazyDefinitionLoader, RawDefinitionLoader } from "./DefinitionLoader";
import { useTheme } from "@lib/hooks/useTheme";

export function SchemaTab({
  resource,
  resourceType,
}: {
  resource: AnyResource;
  resourceType: ResourceTypeGroup;
}) {
  const defs = getResourceDefinitions(resource, resourceType);
  const [previewDef, setPreviewDef] = useState<ResourceDefinition | null>(null);
  const [rawDef, setRawDef] = useState<ResourceDefinition | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  if (defs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No resource definitions available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<span className="text-xs font-mono font-bold">{"{}"}</span>}
        label="Resource Definitions"
        count={defs.length}
      />
      {defs.map((def, i) => (
        <div
          key={i}
          className="rounded-[var(--ord-radius)] border border-border bg-card-bg overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center rounded border border-border bg-muted/50 px-2 py-0.5 text-xs font-mono font-medium text-card-fg">
                {def.type === "custom"
                  ? `custom:${def.customType ?? "custom"}`
                  : def.type}
              </span>
              {def.type === "custom" && def.mediaType && (
                <span className="text-xs text-muted-foreground">
                  {def.mediaType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {def.url && (
                <button
                  onClick={() => setPreviewDef(def)}
                  className="inline-flex items-center gap-1.5 rounded-[var(--ord-radius)] border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
              )}
              {def.url && (
                <button
                  onClick={() => {
                    setRawContent(null);
                    setRawDef(def);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[var(--ord-radius)] border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <FileCode className="h-3.5 w-3.5" />
                  Raw
                </button>
              )}
            </div>
          </div>
          {def.url && (
            <div className="flex items-center gap-1 px-3 pb-3">
              <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-muted-foreground truncate">
                {def.url}
              </span>
              <CopyButton text={def.url} />
            </div>
          )}
          {(def.accessStrategies ?? []).length > 0 && (
            <div className="border-t border-border px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Access Strategies
              </p>
              <div className="space-y-1">
                {(def.accessStrategies ?? []).map((s, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-2 rounded border border-border bg-muted/20 px-2.5 py-1.5"
                  >
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-card-fg">
                      {s.type === "custom"
                        ? (s.customType ?? "custom")
                        : s.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      <SimpleDialog
        open={previewDef !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewDef(null);
        }}
        title={`Preview — ${previewDef?.type ?? ""}`}
        className="w-[95vw] max-w-[95vw] h-[90vh] flex flex-col"
      >
        {previewDef?.url && (
          <LazyDefinitionLoader
            url={previewDef.url}
            defType={previewDef.type}
            mediaType={previewDef.mediaType}
            theme={resolvedTheme}
          />
        )}
      </SimpleDialog>
      <SimpleDialog
        open={rawDef !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRawDef(null);
            setRawContent(null);
          }
        }}
        title={
          <span className="flex items-center gap-2">
            Raw — {rawDef?.type ?? ""}
            {rawContent !== null && <CopyButton text={rawContent} />}
          </span>
        }
        className="w-[95vw] max-w-[95vw] h-[90vh] flex flex-col"
      >
        {rawDef?.url && (
          <RawDefinitionLoader
            url={rawDef.url}
            defType={rawDef.type}
            mediaType={rawDef.mediaType}
            onLoad={setRawContent}
          />
        )}
      </SimpleDialog>
    </div>
  );
}
