// Adapted from @open-resource-discovery/crawler
import type { Agent } from "undici";
import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

/**
 * mTLS configuration options from CLI or environment variables
 */
export interface MtlsOptions {
  cert?: string;
  key?: string;
  passphrase?: string;
  ca?: string;
}

/**
 * Resolved mTLS configuration for undici Agent
 */
export interface MtlsConfig {
  cert?: string;
  key?: string | { pem: string; passphrase: string };
  ca?: string;
}

/**
 * Custom error class for mTLS configuration errors
 */
export class MtlsError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "MtlsError";
  }
}

/**
 * Check if a value looks like a file path
 */
function isFilePath(value: string): boolean {
  if (
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("~/") ||
    value.startsWith("../")
  ) {
    return true;
  }
  // On Windows, check for drive letters
  if (/^[a-zA-Z]:[\\/]/.test(value)) {
    return true;
  }
  return false;
}

/**
 * Read file content from a file path
 */
function readFileContent(filePath: string): string {
  let resolvedPath: string;
  if (filePath.startsWith("~")) {
    const home = process.env.HOME;
    if (!home) {
      throw new MtlsError(
        "Cannot expand '~': HOME environment variable is not set",
      );
    }
    resolvedPath = join(home, filePath.slice(1));
  } else {
    resolvedPath = resolve(filePath);
  }

  if (!existsSync(resolvedPath)) {
    throw new MtlsError(`Certificate/key file not found: ${resolvedPath}`);
  }

  return readFileSync(resolvedPath, "utf-8");
}

/**
 * Extract PEM blocks from content (handles metadata headers before PEM)
 */
function extractPemBlocks(content: string): string | null {
  const pemBlocks = content.match(/-----BEGIN[\s\S]*?-----END[^\n]*\n?/g);
  if (pemBlocks && pemBlocks.length > 0) {
    return pemBlocks.join("\n");
  }
  return null;
}

/**
 * Load certificate/key content from file path, base64, or PEM format
 * Handles PEM files with metadata headers (e.g., subject=, issuer=)
 */
export function loadCertificateContent(value: string): string {
  const trimmed = value.trim();

  // Check if it's a file path - read file first
  if (isFilePath(trimmed)) {
    const fileContent = readFileContent(trimmed);
    return loadCertificateContent(fileContent); // Recursively process file content
  }

  // Check if content contains PEM blocks (may have metadata before it)
  if (trimmed.includes("-----BEGIN")) {
    const pemContent = extractPemBlocks(trimmed);
    if (pemContent) {
      return pemContent;
    }
  }

  // Try to decode from base64
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
    if (decoded.includes("-----BEGIN")) {
      const pemContent = extractPemBlocks(decoded);
      if (pemContent) {
        return pemContent;
      }
    }
    throw new Error("Decoded content does not contain valid PEM data");
  } catch {
    throw new MtlsError(
      "Invalid certificate/key content: expected file path, PEM content, or base64-encoded PEM.",
    );
  }
}

/**
 * Validate mTLS options - cert and key must be provided together
 */
export function validateMtlsOptions(options: MtlsOptions): string[] {
  const errors: string[] = [];

  const hasCert = Boolean(options.cert);
  const hasKey = Boolean(options.key);

  if (hasCert && !hasKey) {
    errors.push(
      "mTLS certificate provided without private key. Both --mtls-cert and --mtls-key are required.",
    );
  }

  if (hasKey && !hasCert) {
    errors.push(
      "mTLS private key provided without certificate. Both --mtls-cert and --mtls-key are required.",
    );
  }

  if (options.passphrase && !hasKey) {
    errors.push("mTLS passphrase provided without private key.");
  }

  return errors;
}

/**
 * Build mTLS configuration for undici Agent from options
 */
export function buildMtlsConfig(options: MtlsOptions): MtlsConfig | undefined {
  // If no mTLS options provided, return undefined
  if (!options.cert && !options.key && !options.ca) {
    return undefined;
  }

  const config: MtlsConfig = {};

  if (options.cert) {
    config.cert = loadCertificateContent(options.cert);
  }

  if (options.key) {
    const keyContent = loadCertificateContent(options.key);
    if (options.passphrase) {
      config.key = { pem: keyContent, passphrase: options.passphrase };
    } else {
      config.key = keyContent;
    }
  }

  if (options.ca) {
    config.ca = loadCertificateContent(options.ca);
  }

  return config;
}

/**
 * Create undici Agent connect options with mTLS configuration
 */
export function createConnectOptions(
  rejectUnauthorized: boolean,
  mtlsConfig?: MtlsConfig,
): Agent.Options["connect"] {
  const connectOptions: Agent.Options["connect"] = {
    rejectUnauthorized,
  };

  if (mtlsConfig) {
    if (mtlsConfig.cert) {
      (connectOptions as Record<string, unknown>).cert = mtlsConfig.cert;
    }
    if (mtlsConfig.key) {
      (connectOptions as Record<string, unknown>).key = mtlsConfig.key;
    }
    if (mtlsConfig.ca) {
      (connectOptions as Record<string, unknown>).ca = mtlsConfig.ca;
    }
  }

  return connectOptions;
}

/**
 * Load mTLS configuration from environment variables
 */
export function loadMtlsFromEnv(): MtlsOptions {
  return {
    cert: process.env.MTLS_CERT,
    key: process.env.MTLS_KEY,
    passphrase: process.env.MTLS_PASSPHRASE,
    ca: process.env.MTLS_CA,
  };
}
