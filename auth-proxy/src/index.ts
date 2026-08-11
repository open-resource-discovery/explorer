import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  Agent,
  ProxyAgent,
  EnvHttpProxyAgent,
  fetch as undiciFetch,
} from "undici";
import { randomUUID } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { buildMtlsConfig, createConnectOptions } from "./mtls.js";

// ---------------------------------------------------------------------------
// In-memory credential store
// ---------------------------------------------------------------------------

interface MtlsCredentials {
  cert: string;
  key: string;
  passphrase?: string;
  caCert?: string;
}

const credentials = new Map<string, MtlsCredentials>();
const SESSION_ID = randomUUID();

// ---------------------------------------------------------------------------
// Corporate HTTP proxy support (HTTPS_PROXY / HTTP_PROXY env vars)
// ---------------------------------------------------------------------------

function getCorporateProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ??
    process.env.https_proxy ??
    process.env.HTTP_PROXY ??
    process.env.http_proxy
  );
}

// ---------------------------------------------------------------------------
// TLS validation opt-out for hosted (CF) deployments
//
// Local deployments bind to 127.0.0.1 — the user controls their machine and
// its trust store, so rejectUnauthorized is true by default.
//
// CF deployments must reach SAP-internal endpoints whose certs are issued by
// SAP's corporate PKI — present in corporate browsers but not in Node's
// bundled OpenSSL. Set TRUST_ALL_CERTS=true in the CF environment (see
// manifest.yml) to opt out of TLS validation for those deployments.
//
// Never set TRUST_ALL_CERTS=true in local or production environments where
// MITM attacks are a realistic threat. See ADR-0008 for full rationale.
// ---------------------------------------------------------------------------

const REJECT_UNAUTHORIZED = process.env.TRUST_ALL_CERTS !== "true";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArgValue(name: string): string | undefined {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function getAllArgValues(name: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && args[i + 1] !== undefined) {
      values.push(args[i + 1] as string);
      i++;
    }
  }
  return values;
}

const ALLOWED_ORIGINS = new Set([
  "https://open-resource-discovery.github.io",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:4173",
  ...getAllArgValues("--allow-origin"),
  ...(process.env.ALLOW_ORIGIN?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) ?? []),
]);

// ---------------------------------------------------------------------------
// Hono app
// ---------------------------------------------------------------------------

const app = new Hono();

// CORS middleware
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Vary", "Origin");
    c.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type");
  }

  // Handle preflight
  if (c.req.method === "OPTIONS") {
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      return c.body(null, 204);
    }
    return c.text("Forbidden", 403);
  }

  await next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/health", (c) => {
  return c.json({ status: "ok", session: SESSION_ID });
});

app.post("/connections/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    cert: string;
    key: string;
    passphrase?: string;
    caCert?: string;
  }>();

  credentials.set(id, {
    cert: body.cert,
    key: body.key,
    passphrase: body.passphrase,
    caCert: body.caCert,
  });

  return c.json({ ok: true });
});

app.delete("/connections/:id", (c) => {
  const id = c.req.param("id");
  credentials.delete(id);
  return c.json({ ok: true });
});

app.post("/fetch", async (c) => {
  const body = await c.req.json<{
    connectionId: string;
    url: string;
    headers?: Record<string, string>;
  }>();
  const { connectionId, url, headers: forwardHeaders } = body;

  const requestInit: Parameters<typeof undiciFetch>[1] = {};
  if (forwardHeaders && Object.keys(forwardHeaders).length > 0) {
    requestInit.headers = forwardHeaders;
  }

  const creds = credentials.get(connectionId);

  let response: Awaited<ReturnType<typeof undiciFetch>>;
  const corporateProxy = getCorporateProxyUrl();
  try {
    if (creds) {
      const mtlsConfig = buildMtlsConfig({
        cert: creds.cert,
        key: creds.key,
        passphrase: creds.passphrase,
        ca: creds.caCert,
      });
      const connectOptions = createConnectOptions(
        REJECT_UNAUTHORIZED,
        mtlsConfig,
      );
      let dispatcher;
      if (corporateProxy) {
        dispatcher = new ProxyAgent({
          uri: corporateProxy,
          requestTls: connectOptions as Record<string, unknown>,
        });
      } else {
        dispatcher = new Agent({ connect: connectOptions });
      }
      response = await undiciFetch(url, { ...requestInit, dispatcher });
    } else {
      let dispatcher;
      if (corporateProxy) {
        dispatcher = new EnvHttpProxyAgent();
      } else {
        dispatcher = new Agent({
          connect: { rejectUnauthorized: REJECT_UNAUTHORIZED },
        });
      }
      response = await undiciFetch(url, { ...requestInit, dispatcher });
    }
  } catch (err) {
    const cause =
      err instanceof Error && err.cause ? String(err.cause) : undefined;
    return c.json({ error: "fetch_failed", message: String(err), cause }, 502);
  }

  if (response.status === 401 || response.status === 403) {
    return c.json({ error: "auth_failed" }, response.status as 401 | 403);
  }

  const contentType =
    response.headers.get("Content-Type") ?? "application/json";
  const responseBody = await response.text();
  return c.newResponse(responseBody, response.status as ContentfulStatusCode, {
    "Content-Type": contentType,
  });
});

// ---------------------------------------------------------------------------
// Node HTTP server adapter
// ---------------------------------------------------------------------------

function nodeRequestToFetchRequest(
  req: IncomingMessage,
  baseUrl: string,
): Promise<Request> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            for (const v of value) headers.append(key, v);
          } else {
            headers.set(key, value);
          }
        }
      }
      resolve(
        new Request(`${baseUrl}${req.url ?? "/"}`, {
          method: req.method ?? "GET",
          headers,
          body: body && body.length > 0 ? body : undefined,
        }),
      );
    });
    req.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

export function start(port: number): Promise<() => Promise<void>> {
  return new Promise((resolve, reject) => {
    const baseUrl = `http://localhost:${port}`;
    const server = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        const request = await nodeRequestToFetchRequest(req, baseUrl);
        const response = await app.fetch(request);
        res.writeHead(
          response.status,
          Object.fromEntries(response.headers.entries()),
        );
        const responseBody = await response.arrayBuffer();
        res.end(Buffer.from(responseBody));
      },
    );

    server.listen(port, () => {
      resolve(
        () =>
          new Promise((res, rej) =>
            server.close((err) => (err ? rej(err) : res())),
          ),
      );
    });

    server.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// CLI entry point — only runs when executed directly, not when imported
// ---------------------------------------------------------------------------

if (
  process.argv[1] &&
  new URL(import.meta.url).pathname ===
    new URL(`file://${process.argv[1]}`).pathname
) {
  const port = Number(getArgValue("--port") ?? process.env.PORT ?? "44123");
  void start(port).then(() => {
    console.log(
      `ORD Explorer auth-proxy listening on http://localhost:${port}`,
    );
    console.log(
      "Requires Chrome 94+ or Firefox 90+ (localhost must be a trustworthy origin)",
    );
    console.log(`Allowed origins: ${[...ALLOWED_ORIGINS].join(", ")}`);
  });
}
