import {
  Server,
  RefreshCw,
  Clock,
  HardDrive,
  Cpu,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitCommit,
  Loader2,
  Settings,
  Info,
} from "lucide-react";
import type { ReactNode } from "react";
import type { StatusResponse, UpdateStatus } from "@lib/status";
import { ThemeRoot } from "@lib/components/ThemeRoot";

export type { StatusResponse };

export interface ServerStatusPanelProps {
  status: StatusResponse;
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

function SectionHeader({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}): ReactNode {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
      {title}
    </div>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}): ReactNode {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function ServerStatusContent({ status }: ServerStatusPanelProps): ReactNode {
  const { content, settings, systemMetrics } = status;

  const updateStatusConfig = content
    ? UPDATE_STATUS_CONFIG[content.updateStatus]
    : undefined;

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1080px] space-y-6 px-8 py-8">
        {/* Header */}
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
              {updateStatusConfig !== undefined && (
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

        {/* Content status */}
        {content !== undefined && (
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="border-b border-border px-5 py-3">
              <SectionHeader
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                title="Content"
              />
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-border">
              {content.currentVersion !== null && (
                <div className="px-5 py-4">
                  <DataRow
                    label="Current version"
                    value={
                      <code className="font-mono text-sm">
                        {content.currentVersion}
                      </code>
                    }
                  />
                </div>
              )}
              {content.commitHash !== null && (
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
                  />
                </div>
              )}
              {content.lastFetchTime !== null && (
                <div className="px-5 py-4">
                  <DataRow
                    label="Last fetch"
                    value={new Date(content.lastFetchTime).toLocaleString()}
                  />
                </div>
              )}
              {content.lastWebhookTime !== undefined && (
                <div className="px-5 py-4">
                  <DataRow
                    label="Last webhook"
                    value={new Date(content.lastWebhookTime).toLocaleString()}
                  />
                </div>
              )}
              {content.scheduledUpdateTime !== undefined && (
                <div className="px-5 py-4">
                  <DataRow
                    label="Next update"
                    value={new Date(
                      content.scheduledUpdateTime,
                    ).toLocaleString()}
                  />
                </div>
              )}
              {content.failedUpdates > 0 && (
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
            {content.lastError !== undefined && (
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
          </div>
        )}

        {/* Settings */}
        {settings !== undefined && (
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="border-b border-border px-5 py-3">
              <SectionHeader
                icon={<Settings className="h-3.5 w-3.5" />}
                title="Settings"
              />
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-border">
              <div className="px-5 py-4">
                <DataRow label="Source type" value={settings.sourceType} />
              </div>
              <div className="px-5 py-4">
                <DataRow label="Base URL" value={settings.baseUrl || "—"} />
              </div>
              <div className="px-5 py-4">
                <DataRow
                  label="Directory"
                  value={
                    <code className="break-all font-mono text-sm">
                      {settings.directory}
                    </code>
                  }
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
                    />
                  </div>
                )}
              {settings.githubBranch !== undefined &&
                settings.githubBranch !== "" && (
                  <div className="px-5 py-4">
                    <DataRow label="Branch" value={settings.githubBranch} />
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
                  value={new Date(settings.serverStartupTime).toLocaleString()}
                />
              </div>
            </div>
          </div>
        )}

        {/* System metrics */}
        {systemMetrics !== undefined && (
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="border-b border-border px-5 py-3">
              <SectionHeader
                icon={<Info className="h-3.5 w-3.5" />}
                title="System"
              />
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ServerStatusPanel(props: ServerStatusPanelProps): ReactNode {
  return (
    <ThemeRoot>
      <ServerStatusContent {...props} />
    </ThemeRoot>
  );
}
