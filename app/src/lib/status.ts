export const UPDATE_STATUS = {
  idle: "idle",
  scheduled: "scheduled",
  in_progress: "in_progress",
  failed: "failed",
  cache_warming: "cache_warming",
} as const satisfies Record<string, string>;

export type UpdateStatus = keyof typeof UPDATE_STATUS;

export interface StatusErrorItem {
  message: string;
  code?: string;
  target?: string;
  details?: Array<{ code?: string; message: string; target?: string }>;
}

export interface StatusError {
  httpStatusCode: number;
  httpStatusText: string;
  item: StatusErrorItem;
}

export interface StatusVersionInfo {
  current: string;
  latest: string;
  isOutdated: boolean;
}

export interface StatusContent {
  lastFetchTime: string | null;
  currentVersion: string | null;
  updateStatus: UpdateStatus;
  scheduledUpdateTime?: string;
  failedUpdates: number;
  commitHash: string | null;
  failedCommitHash?: string;
  lastWebhookTime?: string;
  lastError?: StatusError;
}

export interface StatusSettings {
  sourceType: string;
  baseUrl: string;
  directory: string;
  authMethods: string;
  githubUrl?: string;
  githubBranch?: string;
  githubRepository?: string;
  updateDelay?: number;
  serverStartupTime: string;
}

export interface StatusSystemMetrics {
  memory: { used: number; total: number };
  disk: { used: number; total: number };
}

export interface StatusResponse {
  version: string;
  versionInfo: StatusVersionInfo;
  content?: StatusContent;
  settings?: StatusSettings;
  systemMetrics?: StatusSystemMetrics;
}
