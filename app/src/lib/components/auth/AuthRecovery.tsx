import { useState } from "react";
import { AlertTriangle, KeyRound, RefreshCw, ShieldAlert } from "lucide-react";
import { SimpleDialog } from "@open-resource-discovery/ui-components";
import { classifyPemFile } from "@lib/connection/pemUtils";
import { PROXY_BASE_URL } from "@lib/proxy";
import { saveConnection, getConnection } from "@lib/connection/store";
import type { AuthErrorKind } from "@lib/hooks";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

interface PemFile {
  file: File;
  content: string;
}

async function readPemFile(file: File): Promise<PemFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ file, content: reader.result as string });
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

function FileInputRow({
  label,
  hint,
  accept,
  value,
  error,
  onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  value: PemFile | null;
  error?: string;
  onChange: (f: PemFile | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <input
        type="file"
        accept={accept}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) {
            onChange(null);
            return;
          }
          try {
            onChange(await readPemFile(file));
          } catch {
            onChange(null);
          }
        }}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
      />
      {value && !error && (
        <span className="text-xs text-muted-foreground">{value.file.name}</span>
      )}
      {error && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// mTLS re-authentication dialog
// ---------------------------------------------------------------------------

export function MtlsReauthDialog({
  open,
  connectionId,
  staleSession,
  onSuccess,
  onDismiss,
}: {
  open: boolean;
  connectionId: string;
  staleSession: boolean;
  onSuccess: () => void;
  onDismiss: () => void;
}) {
  const [certFile, setCertFile] = useState<PemFile | null>(null);
  const [keyFile, setKeyFile] = useState<PemFile | null>(null);
  const [caFile, setCaFile] = useState<PemFile | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resetAndDismiss() {
    setCertFile(null);
    setKeyFile(null);
    setCaFile(null);
    setPassphrase("");
    setSubmitting(false);
    setSubmitError(null);
    onDismiss();
  }

  const certError =
    certFile &&
    !["certificate", "ca-bundle"].includes(classifyPemFile(certFile.content))
      ? "This file does not look like a certificate"
      : undefined;
  const keyError =
    keyFile && classifyPemFile(keyFile.content) !== "private-key"
      ? "This file does not look like a private key"
      : undefined;

  const canSubmit = Boolean(certFile && keyFile && !certError && !keyError);

  async function handleSubmit() {
    if (!certFile || !keyFile) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${PROXY_BASE_URL}/connections/${connectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cert: certFile.content,
          key: keyFile.content,
          ...(passphrase ? { passphrase } : {}),
          ...(caFile?.content ? { caCert: caFile.content } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Registration failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const title = staleSession
    ? "Re-enter mTLS credentials"
    : "mTLS authentication failed";

  const description = staleSession
    ? "The auth proxy was restarted and lost its credentials. Re-upload your certificate and key to continue."
    : "The server rejected your client certificate. Re-upload your credentials to try again.";

  return (
    <SimpleDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAndDismiss();
      }}
      title={title}
    >
      <div className="flex flex-col gap-5 pt-1">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-800 dark:bg-amber-950">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {description}
          </p>
        </div>

        <div className="space-y-4">
          <FileInputRow
            label="Client Certificate"
            hint=".crt or .pem"
            accept=".pem,.crt,.cert"
            value={certFile}
            error={certError}
            onChange={setCertFile}
          />
          <FileInputRow
            label="Private Key"
            hint=".key or .pem"
            accept=".pem,.key"
            value={keyFile}
            error={keyError}
            onChange={setKeyFile}
          />
          <FileInputRow
            label="CA Certificate"
            hint="Optional — only needed for private/self-signed CAs"
            accept=".pem,.crt,.cert"
            value={caFile}
            onChange={setCaFile}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Key Passphrase
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                optional
              </span>
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Leave blank if the key is not encrypted"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={resetAndDismiss}
            disabled={submitting}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            {submitting ? "Registering…" : "Register & retry"}
          </button>
        </div>
      </div>
    </SimpleDialog>
  );
}

// ---------------------------------------------------------------------------
// Bearer token update dialog
// ---------------------------------------------------------------------------

export function BearerTokenUpdateDialog({
  open,
  connectionId,
  onSuccess,
  onDismiss,
}: {
  open: boolean;
  connectionId: string;
  onSuccess: (newToken: string) => void;
  onDismiss: () => void;
}) {
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resetAndDismiss() {
    setToken("");
    setSubmitting(false);
    setSubmitError(null);
    onDismiss();
  }

  async function handleSubmit() {
    if (!token.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const connection = getConnection(connectionId);
      if (connection) {
        saveConnection({ ...connection, bearerToken: token.trim() });
      }
      onSuccess(token.trim());
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save token",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SimpleDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAndDismiss();
      }}
      title="Update bearer token"
    >
      <div className="flex flex-col gap-5 pt-1">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-800 dark:bg-amber-950">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your bearer token was rejected by the server. Enter a new token to
            continue.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            New bearer token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmit();
            }}
            placeholder="Paste your token here…"
            autoFocus
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={resetAndDismiss}
            disabled={submitting}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!token.trim() || submitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            {submitting ? "Saving…" : "Save & retry"}
          </button>
        </div>
      </div>
    </SimpleDialog>
  );
}

// ---------------------------------------------------------------------------
// Actionable auth error card — replaces the raw error string in page views
// ---------------------------------------------------------------------------

export function AuthErrorCard({
  authError,
  connectionId,
  onRetry,
}: {
  authError: AuthErrorKind;
  connectionId: string;
  onRetry: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (authError.type === "bearer_auth_failed") {
    return (
      <>
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Bearer token rejected
            </p>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
              The server did not accept your token. It may have expired or been
              revoked.
            </p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Update token & retry
            </button>
          </div>
        </div>
        <BearerTokenUpdateDialog
          open={dialogOpen}
          connectionId={connectionId}
          onSuccess={() => {
            setDialogOpen(false);
            onRetry();
          }}
          onDismiss={() => setDialogOpen(false)}
        />
      </>
    );
  }

  const staleSession = authError.type === "mtls_stale_session";

  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            {staleSession
              ? "Proxy restarted — credentials lost"
              : "mTLS authentication failed"}
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
            {staleSession
              ? "The auth proxy was restarted and your credentials were cleared from memory."
              : "The server rejected your client certificate."}
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Re-enter credentials & retry
          </button>
        </div>
      </div>
      <MtlsReauthDialog
        open={dialogOpen}
        connectionId={connectionId}
        staleSession={staleSession}
        onSuccess={() => {
          setDialogOpen(false);
          onRetry();
        }}
        onDismiss={() => setDialogOpen(false)}
      />
    </>
  );
}
