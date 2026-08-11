import { Copy } from "lucide-react";
import type { AnyResource } from "./resourceTypes";
import { JsonHighlight } from "../../JsonHighlight";

export function RawJsonTab({ resource }: { resource: AnyResource }) {
  const json = JSON.stringify(resource, null, 2);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="font-mono font-bold">{"{}"}</span>
          Raw Definition
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(json)}
          className="inline-flex items-center gap-1.5 rounded-[var(--ord-radius)] border border-border bg-card-bg px-3 py-1.5 text-xs font-medium text-card-fg hover:bg-muted/50 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy JSON
        </button>
      </div>
      <pre className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono text-card-fg overflow-auto max-h-[60vh] scrollbar-thin whitespace-pre">
        <JsonHighlight json={json} />
      </pre>
    </div>
  );
}
