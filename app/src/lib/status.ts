export interface StatusError {
  httpStatusCode: number;
  httpStatusText: string;
  item: {
    message: string;
    code?: string;
    target?: string;
    details?: Array<{ code?: string; message: string; target?: string }>;
  };
}

export interface StatusResponse {
  version: string;
  versionInfo: {
    current: string;
    latest: string;
    isOutdated: boolean;
  };
  content?: {
    lastFetchTime: string | null;
    currentVersion: string | null;
    updateStatus:
      "idle" | "scheduled" | "in_progress" | "failed" | "cache_warming";
    scheduledUpdateTime?: string | null;
    failedUpdates: number;
    commitHash: string | null;
    failedCommitHash?: string | null;
    lastWebhookTime?: string | null;
    lastError?: StatusError;
  };
  settings?: {
    sourceType: string;
    baseUrl: string;
    directory: string;
    authMethods: string;
    githubUrl?: string;
    githubBranch?: string;
    githubRepository?: string;
    updateDelay?: number;
    serverStartupTime: string;
  };
  systemMetrics?: {
    memory: {
      used: number;
      total: number;
    };
    disk: {
      used: number;
      total: number;
    };
  };
}
