import type { ReactNode } from "react";

interface RelationshipCardProps {
  title: string;
  subtitle: string;
  customBg: string;
  customFg: string;
  iconNode: ReactNode;
  onClick?: () => void;
}

export function RelationshipCard({
  title,
  subtitle,
  customBg,
  customFg,
  iconNode,
  onClick,
}: RelationshipCardProps) {
  const inner = (
    <>
      <div
        className={`shrink-0 rounded-md border border-border/60 p-1.5 ${customBg} ${customFg}`}
      >
        {iconNode}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-card-fg truncate">{title}</p>
        <p className="text-xs font-mono text-muted-foreground truncate">
          {subtitle}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-[var(--ord-radius)] border border-border bg-card-bg p-3 text-left hover:bg-muted/50 transition-colors"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[var(--ord-radius)] border border-border bg-card-bg p-3">
      {inner}
    </div>
  );
}
