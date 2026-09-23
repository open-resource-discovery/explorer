/**
 * CI guard: fail a PUBLIC build (gh-pages / pr-preview) if it would ship an
 * external mTLS proxy origin. Public deployments must reach the proxy only via
 * the relative `/proxy-api` path; the decommissioned CloudFoundry side-car
 * (ord-explorer-auth-proxy.cfapps.sap.hana.ondemand.com) must never reappear in
 * a hosted bundle. See docs/adr/0008 and the "Disable hosted mTLS" effort.
 *
 * Two independent checks:
 *   1. env: VITE_PROXY_BASE_URL, if set for the build, must be relative
 *      (starts with "/"). Re-adding `VITE_PROXY_BASE_URL: https://…` to a
 *      public workflow's build step trips this. Run in the SAME step as the
 *      build so it observes the same environment.
 *   2. bundle: the built output dir must contain none of the decommissioned
 *      hosted-proxy markers. Mechanism-independent — catches the host being
 *      hardcoded anywhere, regardless of how it got there.
 *
 * Usage: node --experimental-strip-types scripts/check-public-bundle.ts [distDir]
 *   distDir defaults to dist/app.
 */
import { readdirSync, readFileSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/**
 * Substrings that must never appear in a hosted bundle. These identify the
 * decommissioned CloudFoundry mTLS side-car specifically, so matching is
 * exact and free of false positives against unrelated URLs in the SPA.
 */
const FORBIDDEN_MARKERS: readonly string[] = [
  "ord-explorer-auth-proxy",
  "cfapps.sap.hana.ondemand.com",
];

interface Violation {
  readonly file: string;
  readonly marker: string;
}

function walkFiles(dir: string): readonly string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function scanBundle(distDir: string): readonly Violation[] {
  const violations: Violation[] = [];
  for (const file of walkFiles(distDir)) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      // Non-text/unreadable asset (e.g. binary font/image) — a hosted proxy
      // origin can only regress via text sources, so skipping is safe.
      continue;
    }
    for (const marker of FORBIDDEN_MARKERS) {
      if (content.includes(marker)) {
        violations.push({ file: relative(root, file), marker });
      }
    }
  }
  return violations;
}

function checkProxyBaseUrlEnv(): string | undefined {
  const value = process.env["VITE_PROXY_BASE_URL"];
  if (value === undefined || value === "") {
    return undefined;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return undefined;
}

function main(): void {
  const distDir = resolve(root, process.argv[2] ?? "dist/app");
  const errors: string[] = [];

  const absoluteProxyUrl = checkProxyBaseUrlEnv();
  if (absoluteProxyUrl !== undefined) {
    errors.push(
      `VITE_PROXY_BASE_URL is set to an absolute URL (${absoluteProxyUrl}). ` +
        `Public builds must use the relative "/proxy-api" path only, so mTLS ` +
        `client certs are never transmitted to a hosted proxy.`,
    );
  }

  const violations = scanBundle(distDir);
  for (const { file, marker } of violations) {
    errors.push(
      `Decommissioned hosted proxy marker "${marker}" found in ${file}.`,
    );
  }

  if (errors.length > 0) {
    console.error("✗ Public-bundle guard failed:\n");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error(
      `\nA hosted deployment must not ship an external mTLS proxy origin. ` +
        `See docs/adr/0008-authentication-browser-and-mtls-proxy.md.`,
    );
    process.exit(1);
  }

  console.log(
    `✓ Public-bundle guard passed: ${distDir} ships no hosted proxy origin.`,
  );
}

main();
