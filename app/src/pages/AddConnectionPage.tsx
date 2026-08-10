import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { AlertTriangle, Info } from "lucide-react";
import {
  createConnection,
  saveConnection,
  getConnection,
  parseDestinationUrl,
} from "@lib/connection";
import type { AuthType } from "@lib/connection";
import { classifyPemFile } from "@lib/connection/pemUtils";
import { useProxy, PROXY_BASE_URL } from "@lib/proxy";

// ---------------------------------------------------------------------------
// Small reusable primitives
// ---------------------------------------------------------------------------

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
    />
  );
}

// ---------------------------------------------------------------------------
// Radio-card group for connection type / auth type
// ---------------------------------------------------------------------------

function RadioCard<T extends string>({
  value,
  current,
  onChange,
  label,
  description,
  disabled,
}: {
  value: T;
  current: T;
  onChange: (v: T) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      className={[
        "flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 text-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent",
        disabled ? "opacity-40" : "",
      ].join(" ")}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <span
          className={[
            "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2",
            selected
              ? "border-primary bg-primary"
              : "border-border bg-background",
          ].join(" ")}
        />
        {label}
      </span>
      {description && (
        <span className="pl-5 text-xs text-muted-foreground">
          {description}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// mTLS PEM file input
// ---------------------------------------------------------------------------

interface PemFile {
  file: File;
  content: string;
  error?: string;
}

async function readPemFile(file: File): Promise<PemFile> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      resolve({ file, content });
    };
    reader.onerror = () =>
      resolve({ file, content: "", error: "Could not read file" });
    reader.readAsText(file);
  });
}

function PemFileInput({
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
  onChange: (pem: PemFile | null) => void;
}) {
  const hasError = Boolean(error);
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
          const pem = await readPemFile(file);
          onChange(pem);
        }}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
      />
      {value && !hasError && (
        <span className="text-xs text-muted-foreground">{value.file.name}</span>
      )}
      {hasError && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function AddConnectionPage({ editId }: { editId?: string } = {}) {
  const navigate = useNavigate();
  const { available: proxyAvailable } = useProxy();
  const existing = editId ? getConnection(editId) : undefined;

  // Form state
  const [name, setName] = useState(existing?.name ?? "");
  const [url, setUrl] = useState(existing?.ordConfigUrl ?? "");
  const [authType, setAuthType] = useState<AuthType>(existing?.auth ?? "none");

  // Bearer
  const [bearerToken, setBearerToken] = useState(existing?.bearerToken ?? "");

  // mTLS
  const [certFile, setCertFile] = useState<PemFile | null>(null);
  const [keyFile, setKeyFile] = useState<PemFile | null>(null);
  const [caFile, setCaFile] = useState<PemFile | null>(null);
  const [passphrase, setPassphrase] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!url.trim()) return "ORD Configuration URL is required.";
    try {
      parseDestinationUrl(url.trim());
    } catch {
      return "ORD Configuration URL must be a valid URL (e.g. https://example.com or https://example.com/custom/ord-config).";
    }
    if (authType === "bearer" && !bearerToken.trim()) {
      return "Bearer token is required when using Bearer Token auth.";
    }
    if (authType === "mtls") {
      if (!certFile) return "Client certificate is required for mTLS.";
      if (!keyFile) return "Private key is required for mTLS.";
    }
    return null;
  }

  async function buildAndSave() {
    const partial = {
      name: name.trim(),
      ordConfigUrl: parseDestinationUrl(url.trim()),
      type: "system-endpoint" as const,
      auth: authType,
      bearerToken: authType === "bearer" ? bearerToken.trim() : undefined,
    };
    const connection = existing
      ? { ...existing, ...partial }
      : createConnection(partial);
    saveConnection(connection);

    if (authType === "mtls" && certFile?.content && keyFile?.content) {
      await fetch(`${PROXY_BASE_URL}/connections/${connection.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cert: certFile.content,
          key: keyFile.content,
          ...(passphrase ? { passphrase } : {}),
          ...(caFile?.content ? { caCert: caFile.content } : {}),
        }),
      });
    }

    return connection;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);
    try {
      const conn = await buildAndSave();
      await navigate(
        existing
          ? { to: "/connections/$id", params: { id: conn.id } }
          : { to: "/connections" },
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTestAndSave() {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);
    try {
      const conn = await buildAndSave();
      await navigate(
        existing
          ? { to: "/connections/$id", params: { id: conn.id } }
          : { to: "/connections" },
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-2xl px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="mb-1.5 text-2xl font-bold text-foreground">
            {existing ? "Edit connection" : "Add connection"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect to an ORD provider via its system endpoint.
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic fields */}
          <FormField label="Name" required>
            <TextInput
              value={name}
              onChange={setName}
              placeholder="My ORD Provider"
              required
            />
          </FormField>

          <FormField
            label="ORD Configuration URL"
            required
            hint="Enter the URL to the ORD configuration endpoint. If no path is given, the well-known path (/.well-known/open-resource-discovery) is appended automatically. Custom paths are also supported, e.g. https://example.com/custom/ord-config"
          >
            <TextInput
              value={url}
              onChange={setUrl}
              type="url"
              placeholder="https://example.com"
              required
            />
          </FormField>

          {/* Auth type */}
          <FormField label="Authentication" required>
            <div className="grid grid-cols-3 gap-2">
              <RadioCard<AuthType>
                value="none"
                current={authType}
                onChange={setAuthType}
                label="None"
              />
              <RadioCard<AuthType>
                value="bearer"
                current={authType}
                onChange={setAuthType}
                label="Bearer Token"
              />
              <RadioCard<AuthType>
                value="mtls"
                current={authType}
                onChange={(v) => {
                  if (proxyAvailable) setAuthType(v);
                }}
                label="mTLS"
                disabled={!proxyAvailable}
              />
            </div>
            {!proxyAvailable && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                mTLS requires the auth proxy — run{" "}
                <code className="rounded bg-muted px-1 font-mono">
                  npm run proxy
                </code>{" "}
                to enable
              </p>
            )}
          </FormField>

          {/* Conditional: Bearer Token */}
          {authType === "bearer" && (
            <FormField label="Bearer Token" required>
              <TextInput
                value={bearerToken}
                onChange={setBearerToken}
                type="password"
                placeholder="Enter token..."
              />
            </FormField>
          )}

          {/* Conditional: mTLS */}
          {authType === "mtls" && (
            <div className="space-y-4 rounded-xl border border-border bg-background p-4">
              <PemFileInput
                label="Client Certificate"
                hint=".crt or .pem"
                accept=".pem,.crt,.cert"
                value={certFile}
                error={
                  certFile &&
                  !["certificate", "ca-bundle"].includes(
                    classifyPemFile(certFile.content),
                  )
                    ? "This file does not look like a certificate"
                    : undefined
                }
                onChange={setCertFile}
              />
              <PemFileInput
                label="Private Key"
                hint=".key or .pem"
                accept=".pem,.key"
                value={keyFile}
                error={
                  keyFile && classifyPemFile(keyFile.content) !== "private-key"
                    ? "This file does not look like a private key"
                    : undefined
                }
                onChange={setKeyFile}
              />
              <PemFileInput
                label="CA Certificate"
                hint="Optional — only needed for private/self-signed CAs"
                accept=".pem,.crt,.cert"
                value={caFile}
                onChange={setCaFile}
              />

              <FormField
                label="Key Passphrase"
                hint="Leave blank if the private key is not encrypted."
              >
                <TextInput
                  value={passphrase}
                  onChange={setPassphrase}
                  type="password"
                  placeholder="Optional passphrase..."
                />
              </FormField>
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {validationError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Link
              to={existing ? "/connections/$id" : "/connections"}
              params={existing ? { id: existing.id } : undefined}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Cancel
            </Link>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestAndSave}
                disabled={isSubmitting}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
              >
                Test connection
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
