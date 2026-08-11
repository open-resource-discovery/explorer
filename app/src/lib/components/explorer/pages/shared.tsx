import { useState } from "react";
import type { ReactNode } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      aria-label="Copy to clipboard"
      className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function SectionHeader({
  icon,
  label,
  count,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">
          {count} definition{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-3 border border-border rounded-[var(--ord-radius)] bg-muted/20">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-mono text-card-fg break-all">{value}</span>
    </div>
  );
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

export const MD_CLASSES = [
  "[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mb-2",
  "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h2]:mt-4",
  "[&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-1 [&_h3]:mt-3",
  "[&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2",
  "[&_ul]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2",
  "[&_ol]:text-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2",
  "[&_li]:mb-0.5",
  "[&_strong]:font-semibold [&_em]:italic",
  "[&_code]:font-mono [&_code]:text-xs [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
].join(" ");
