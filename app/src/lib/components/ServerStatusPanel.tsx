import {
  Server,
  Clock,
  HardDrive,
  Cpu,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitCommit,
  Loader2,
  Settings,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import {
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { StatusResponse, UpdateStatus } from "@lib/status";
import { ThemeRoot } from "@lib/components/ThemeRoot";
import { useTheme } from "@lib/hooks/useTheme";

export type { StatusResponse };

export interface ServerStatusPanelProps {
  status: StatusResponse;
  afterContent?: ReactNode;
  footerContent?: ReactNode;
  headerActions?: ReactNode;
}

const UPDATE_STATUS_CONFIG: Record<
  UpdateStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  idle: {
    label: "Idle",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  scheduled: {
    label: "Scheduled",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  in_progress: {
    label: "Updating",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  failed: {
    label: "Failed",
    className:
      "border-destructive-foreground bg-destructive text-destructive-foreground",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  cache_warming: {
    label: "Cache warming",
    className:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).getTime() > 0
    ? new Date(dateStr).toLocaleString()
    : "—";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, units.length - 1);
  const unit = units[safeIndex] ?? "GB";
  return `${(bytes / Math.pow(k, safeIndex)).toFixed(1)} ${unit}`;
}

function getGitHubBaseUrl(githubUrl: string | undefined): string {
  if (githubUrl === undefined || githubUrl === "https://api.github.com") {
    return "https://github.com";
  }
  if (githubUrl.includes("/api/v3")) {
    return githubUrl.replace("/api/v3", "");
  }
  if (githubUrl.includes("api.")) {
    return githubUrl.replace("api.", "");
  }
  return githubUrl.replace(/\/api$/, "");
}

function UsageBar({ used, total }: { used: number; total: number }): ReactNode {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color =
    pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatBytes(used)}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-muted-foreground">
        of {formatBytes(total)}
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: ReactNode;
  copyValue?: string;
}): ReactNode {
  const [copied, setCopied] = useState(false);

  const handleCopy = (): void => {
    if (copyValue === undefined) return;
    navigator.clipboard
      .writeText(copyValue)
      .then((): void => {
        setCopied(true);
        setTimeout((): void => setCopied(false), 1500);
      })
      .catch((): void => {});
  };

  return (
    <div
      className={
        copyValue !== undefined
          ? `group relative flex flex-col gap-0.5 -mx-5 -my-4 px-5 py-4 rounded transition-colors cursor-pointer ${
              copied ? "bg-emerald-500/10" : "hover:bg-emerald-500/[0.05]"
            }`
          : "flex flex-col gap-0.5"
      }
      onClick={copyValue !== undefined ? handleCopy : undefined}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
      {copyValue !== undefined && (
        <button
          onClick={(e: ReactMouseEvent<HTMLButtonElement>): void => {
            e.stopPropagation();
            handleCopy();
          }}
          className="absolute top-4 right-5 z-10 cursor-pointer text-xs font-medium"
          aria-label="Copy to clipboard"
        >
          <span
            className={`whitespace-nowrap text-muted-foreground transition-opacity duration-150 ${
              copied ? "opacity-0" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            copy
          </span>
          <span
            className={`absolute right-0 top-0 flex items-center gap-1 whitespace-nowrap text-emerald-500 transition-opacity duration-150 ${
              copied ? "opacity-100" : "opacity-0"
            }`}
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="3,8 6,11 13,4" />
            </svg>
            copied
          </span>
        </button>
      )}
    </div>
  );
}

function ServerStatusContent({
  status,
  afterContent,
  footerContent,
  headerActions,
}: ServerStatusPanelProps): ReactNode {
  const { content, settings, systemMetrics } = status;
  const { resolvedTheme, setTheme } = useTheme();

  const updateStatusConfig = content
    ? UPDATE_STATUS_CONFIG[content.updateStatus]
    : undefined;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-[1080px] space-y-6 px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-primary/10">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Provider Server
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  v{status.version}
                </span>
                {status.versionInfo.isOutdated && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Update available: v{status.versionInfo.latest}
                  </span>
                )}
                {updateStatusConfig !== undefined &&
                  settings?.sourceType !== "local" && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${updateStatusConfig.className}`}
                    >
                      {updateStatusConfig.icon}
                      {updateStatusConfig.label}
                    </span>
                  )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={(): void =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
              className="rounded p-1.5 cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            {headerActions}
          </div>
        </div>

        {/* Unified info card */}
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <div className="grid grid-cols-2 divide-x divide-y divide-border">
            {content !== undefined && content.lastFetchTime !== null && (
              <div className="px-5 py-4">
                <DataRow
                  label="Updated"
                  value={formatDate(content.lastFetchTime)}
                />
              </div>
            )}
            {content !== undefined && content.commitHash !== null && (
              <div className="px-5 py-4">
                <DataRow
                  label="Commit"
                  value={
                    <span className="flex items-center gap-1">
                      <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
                      {settings?.githubRepository !== undefined &&
                      settings.githubRepository !== "" &&
                      content.commitHash !== "current" ? (
                        <a
                          href={`${getGitHubBaseUrl(settings.githubUrl)}/${settings.githubRepository}/tree/${content.commitHash}/data`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-sm hover:underline"
                          onClick={(
                            e: ReactMouseEvent<HTMLAnchorElement>,
                          ): void => e.stopPropagation()}
                        >
                          {content.commitHash.slice(0, 7)}
                        </a>
                      ) : (
                        <code className="font-mono text-sm">
                          {content.commitHash.slice(0, 7)}
                        </code>
                      )}
                    </span>
                  }
                  copyValue={content.commitHash}
                />
              </div>
            )}
            {content !== undefined && content.lastWebhookTime !== undefined && (
              <div className="px-5 py-4">
                <DataRow
                  label="Last webhook"
                  value={formatDate(content.lastWebhookTime)}
                />
              </div>
            )}
            {content !== undefined &&
              content.scheduledUpdateTime !== undefined && (
                <div className="px-5 py-4">
                  <DataRow
                    label="Next update"
                    value={formatDate(content.scheduledUpdateTime)}
                  />
                </div>
              )}
            {systemMetrics !== undefined && (
              <>
                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Cpu className="h-3.5 w-3.5" />
                    Memory
                  </div>
                  <UsageBar
                    used={systemMetrics.memory.used}
                    total={systemMetrics.memory.total}
                  />
                </div>
                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <HardDrive className="h-3.5 w-3.5" />
                    Disk
                  </div>
                  <UsageBar
                    used={systemMetrics.disk.used}
                    total={systemMetrics.disk.total}
                  />
                </div>
              </>
            )}
            {content !== undefined && content.failedUpdates > 0 && (
              <div className="px-5 py-4">
                <DataRow
                  label="Failed updates"
                  value={
                    <span className="text-destructive">
                      {content.failedUpdates}
                    </span>
                  }
                />
              </div>
            )}
          </div>

          {content !== undefined && content.lastError !== undefined && (
            <div className="flex items-start gap-2 border-t border-border bg-destructive/5 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Last error ({content.lastError.httpStatusCode}{" "}
                  {content.lastError.httpStatusText})
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {content.lastError.item.message}
                </p>
              </div>
            </div>
          )}

          {settings !== undefined && (
            <details className="group border-t border-border">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 [&::-webkit-details-marker]:hidden">
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Details
                </span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 -rotate-90 text-muted-foreground transition-transform group-open:rotate-0" />
              </summary>
              <div className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border">
                {content !== undefined &&
                  content.currentVersion !== null &&
                  settings.sourceType === "local" && (
                    <div className="px-5 py-4">
                      <DataRow
                        label="Content version"
                        value={
                          <code className="font-mono text-sm">
                            {content.currentVersion}
                          </code>
                        }
                      />
                    </div>
                  )}
                <div className="px-5 py-4">
                  <DataRow label="Source type" value={settings.sourceType} />
                </div>
                <div className="px-5 py-4">
                  <DataRow
                    label="Base URL"
                    value={settings.baseUrl || "—"}
                    copyValue={settings.baseUrl || undefined}
                  />
                </div>
                <div className="px-5 py-4">
                  <DataRow
                    label="Directory"
                    value={
                      <code className="break-all font-mono text-sm">
                        {settings.directory}
                      </code>
                    }
                    copyValue={settings.directory}
                  />
                </div>
                <div className="px-5 py-4">
                  <DataRow
                    label="Auth methods"
                    value={settings.authMethods || "—"}
                  />
                </div>
                {settings.githubRepository !== undefined &&
                  settings.githubRepository !== "" && (
                    <div className="px-5 py-4">
                      <DataRow
                        label="GitHub repository"
                        value={settings.githubRepository}
                        copyValue={settings.githubRepository}
                      />
                    </div>
                  )}
                {settings.githubBranch !== undefined &&
                  settings.githubBranch !== "" && (
                    <div className="px-5 py-4">
                      <DataRow
                        label="Branch"
                        value={settings.githubBranch}
                        copyValue={settings.githubBranch}
                      />
                    </div>
                  )}
                {settings.updateDelay !== undefined && (
                  <div className="px-5 py-4">
                    <DataRow
                      label="Update delay"
                      value={`${settings.updateDelay}s`}
                    />
                  </div>
                )}
                <div className="px-5 py-4">
                  <DataRow
                    label="Server started"
                    value={new Date(
                      settings.serverStartupTime,
                    ).toLocaleString()}
                  />
                </div>
              </div>
            </details>
          )}
        </div>

        {afterContent}

        {footerContent}
      </div>
    </div>
  );
}

export function ServerStatusPanel(props: ServerStatusPanelProps): ReactNode {
  return (
    <ThemeRoot className="h-screen">
      <ServerStatusContent {...props} />
    </ThemeRoot>
  );
}
