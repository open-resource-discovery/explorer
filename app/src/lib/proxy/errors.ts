export type AuthErrorKind =
  | { type: "mtls_stale_session" }
  | { type: "mtls_auth_failed" }
  | { type: "bearer_auth_failed" };

export async function classifyAuthError(
  authType: string,
  recheckSession: () => Promise<{
    available: boolean;
    sessionId: string | null;
  }>,
  currentSessionId: string | null,
): Promise<AuthErrorKind> {
  if (authType !== "mtls") return { type: "bearer_auth_failed" };
  const fresh = await recheckSession();
  const sessionChanged =
    fresh.available &&
    fresh.sessionId !== null &&
    currentSessionId !== null &&
    fresh.sessionId !== currentSessionId;
  return sessionChanged
    ? { type: "mtls_stale_session" }
    : { type: "mtls_auth_failed" };
}

export class AuthFailedError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, url: string) {
    super(
      status === 401
        ? `Authentication failed for ${url} — credentials were rejected or have expired.`
        : `Access denied for ${url} — insufficient permissions.`,
    );
    this.name = "AuthFailedError";
    this.status = status;
  }
}

export class ProxyFetchError extends Error {
  constructor(status: number, url: string, detail: string) {
    super(
      `Proxy could not reach ${url} (HTTP ${status})${detail ? `: ${detail}` : ""}`,
    );
    this.name = "ProxyFetchError";
  }
}
