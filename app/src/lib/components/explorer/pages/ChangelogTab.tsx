import type { ChangelogEntry } from "@open-resource-discovery/specification";
import { ExternalLink } from "lucide-react";
import { Badge } from "@open-resource-discovery/ui-components";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import type { AnyResource, WithChangelog } from "./resourceTypes";
import { RELEASE_STATUS_PILL } from "./pillConfig";
import { formatDate, MD_CLASSES } from "./shared";

export function ChangelogTab({ resource }: { resource: AnyResource }) {
  const entries = [
    ...((resource as WithChangelog).changelogEntries ?? []),
  ].sort((a: ChangelogEntry, b: ChangelogEntry) =>
    b.date.localeCompare(a.date),
  );

  return (
    <div className="space-y-0 divide-y divide-border">
      {entries.map((entry) => {
        const statusCfg = RELEASE_STATUS_PILL[entry.releaseStatus];
        return (
          <div key={entry.version} className="py-4 first:pt-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" size="sm" className="font-mono">
                v{entry.version}
              </Badge>
              {statusCfg && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.pill}`}
                >
                  {statusCfg.icon}
                  {statusCfg.label}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(entry.date)}
              </span>
              {entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View full entry
                </a>
              )}
            </div>
            {entry.description && (
              <div
                className={`mt-2 prose prose-sm max-w-none text-card-fg dark:prose-invert ${MD_CLASSES}`}
              >
                <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                  {entry.description}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
