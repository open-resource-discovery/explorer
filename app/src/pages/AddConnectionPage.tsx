import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { AlertTriangle, Info } from "lucide-react";
import {
  createConnection,
  saveConnection,
  getConnection,
  parseDestinationUrl,
} from "@lib/connection";
import { AUTH_TYPES, type AuthType } from "@lib/connection";
import { classifyPemFile } from "@lib/connection/pemUtils";
import { useProxy, PROXY_BASE_URL } from "@lib/proxy";
import {
  Button,
  buttonVariants,
  Input,
  PasswordInput,
  Field,
  RadioGroup,
} from "@open-resource-discovery/ui-components";
import { Radio } from "@base-ui/react/radio";

// ---------------------------------------------------------------------------
// mTLS PEM file input
// ---------------------------------------------------------------------------

interface PemFile {
  file: File;
  content: string;
  error?: string;
}

async function readPemFile(file: File): Promise<PemFile> {
  try {
    const content = await file.text();
    return { file, content };
  } catch {
    return { file, content: "", error: "Could not read file" };
  }
}

function PemFileInput({
  label,
  hint,
  accept,
  value,
  error,
  onChange,
  inputId,
}: {
  label: string;
  hint: string;
  accept: string;
  value: PemFile | null;
  error?: string;
  onChange: (pem: PemFile | null) => void;
  inputId: string;
}) {
  const hasError = Boolean(error);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <input
        id={inputId}
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
          {/* Name */}
          <Field.Root className="flex flex-col gap-1.5">
            <Field.Label
              htmlFor="field-name"
              className="text-sm font-medium text-foreground"
            >
              Name
              <span className="ml-0.5 text-red-500">*</span>
            </Field.Label>
            <Input
              id="field-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My ORD Provider"
              required
            />
          </Field.Root>

          {/* ORD Configuration URL */}
          <Field.Root className="flex flex-col gap-1.5">
            <Field.Label
              htmlFor="field-url"
              className="text-sm font-medium text-foreground"
            >
              ORD Configuration URL
              <span className="ml-0.5 text-red-500">*</span>
            </Field.Label>
            <Input
              id="field-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              placeholder="https://example.com"
              required
            />
            <Field.Description className="text-xs text-muted-foreground">
              Enter the URL to the ORD configuration endpoint. If no path is
              given, the well-known path (/.well-known/open-resource-discovery)
              is appended automatically. Custom paths are also supported, e.g.
              https://example.com/custom/ord-config
            </Field.Description>
          </Field.Root>

          {/* Auth type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Authentication
              <span className="ml-0.5 text-red-500">*</span>
            </span>
            <RadioGroup
              value={authType}
              onValueChange={(v: unknown): void => {
                const found = AUTH_TYPES.find((t) => t === v);
                if (found !== undefined) setAuthType(found);
              }}
              className="grid grid-cols-3 gap-2"
            >
              {[
                { value: "none" as const, label: "None" },
                { value: "bearer" as const, label: "Bearer Token" },
                {
                  value: "mtls" as const,
                  label: "mTLS",
                  disabled: !proxyAvailable,
                },
              ].map(({ value, label, disabled }) => (
                <Radio.Root
                  key={value}
                  value={value}
                  disabled={disabled}
                  className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-border bg-background px-4 py-3 text-left text-muted-foreground transition-colors hover:bg-accent data-[checked]:border-primary data-[checked]:bg-primary/5 data-[checked]:text-foreground disabled:cursor-default disabled:opacity-40"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Radio.Indicator className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-background data-[checked]:border-primary data-[checked]:bg-primary" />
                    {label}
                  </span>
                </Radio.Root>
              ))}
            </RadioGroup>
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
          </div>

          {/* Conditional: Bearer Token */}
          {authType === "bearer" && (
            <Field.Root className="flex flex-col gap-1.5">
              <Field.Label
                htmlFor="field-bearer-token"
                className="text-sm font-medium text-foreground"
              >
                Bearer Token
                <span className="ml-0.5 text-red-500">*</span>
              </Field.Label>
              <PasswordInput
                id="field-bearer-token"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                placeholder="Enter token..."
              />
            </Field.Root>
          )}

          {/* Conditional: mTLS */}
          {authType === "mtls" && (
            <div className="space-y-4 rounded-xl border border-border bg-background p-4">
              <PemFileInput
                label="Client Certificate"
                hint=".crt or .pem"
                accept=".pem,.crt,.cert"
                value={certFile}
                inputId="pem-cert-input"
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
                inputId="pem-key-input"
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
                inputId="pem-ca-input"
                onChange={setCaFile}
              />

              <Field.Root className="flex flex-col gap-1.5">
                <Field.Label
                  htmlFor="field-passphrase"
                  className="text-sm font-medium text-foreground"
                >
                  Key Passphrase
                </Field.Label>
                <PasswordInput
                  id="field-passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Optional passphrase..."
                />
                <Field.Description className="text-xs text-muted-foreground">
                  Leave blank if the private key is not encrypted.
                </Field.Description>
              </Field.Root>
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
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </Link>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestAndSave}
                disabled={isSubmitting}
              >
                Test connection
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
