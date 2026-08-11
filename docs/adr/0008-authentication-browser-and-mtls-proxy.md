# Authentication via direct browser fetch and optional local mTLS proxy

## Context

The app fetches ORD documents from endpoints that may require authentication. Three authentication modes are needed: no auth, bearer token, and mutual TLS (mTLS). The app is a browser SPA deployed to GitHub Pages (static file hosting only — no server).

mTLS requires the client to present a certificate and private key during the TLS handshake. Browser JavaScript has no API to do this programmatically: `fetch()`, `XMLHttpRequest`, and `WebCrypto` provide no parameter for attaching a client certificate. The TLS handshake occurs below the JavaScript layer.

## Decision

Authentication is split by capability:

**No auth and bearer token** — the browser fetches ORD documents directly. Bearer tokens are stored in localStorage and attached as `Authorization: Bearer` headers. This is the same risk profile as any token-authenticated API client; no proxy is involved.

**mTLS** — a lightweight local Node.js proxy (`auth-proxy/`) intercepts fetch requests and executes them using `undici` with the client certificate attached. The browser registers mTLS credentials with the proxy once (`POST /connections/:id`), then requests fetches via `POST /fetch`. Credentials are held in memory only — no disk persistence.

The proxy is optional and progressive: the app functions fully for no-auth and bearer connections without it. On load, the app pings `GET /health`; if the proxy is unreachable, mTLS connection options are greyed out with an instruction to start the proxy (`npm run proxy`). mTLS credential loss on proxy restart is detected lazily — on the first failed fetch, the app prompts the user to re-enter credentials.

## Consequences

- GitHub Pages deployment is preserved with no changes to the static hosting model.
- mTLS users must run `npm run proxy` alongside the app. This is consistent with how developer tools like Bruno, mitmproxy, and Charles Proxy work.
- Private keys never touch browser storage. They transit `localhost` once on registration and are held in the proxy's process memory.
- The proxy runs on a fixed port in the 40000s (configurable via `--port`). CORS is restricted to a hardcoded allowlist of known deployment origins (GH Pages URLs + localhost variants) with an `--allow-origin` escape hatch.
- The proxy is never deployed to any hosted environment — it is local-only.
- A startup warning is emitted: the proxy requires Chrome 94+ or Firefox 90+ (browsers that allow HTTPS pages to call `http://localhost` without mixed-content blocking, per the W3C Secure Contexts spec treating localhost as a trustworthy origin).

## TLS validation in the proxy (rejectUnauthorized)

When the proxy makes outbound connections via undici it must decide whether to validate the server's TLS certificate.

**Local deployments (default):** The proxy binds to `127.0.0.1`. The user controls their own machine and its certificate trust store. All connections use `rejectUnauthorized: true` — undici validates the server certificate against the system/Node trust store. Users connecting to servers with private-CA certificates must supply the CA bundle via the mTLS connection's "CA Certificate" field; undici then validates against that CA.

**CloudFoundry / hosted deployments (`TRUST_ALL_CERTS=true`):** The CF-deployed proxy must reach SAP-internal ORD endpoints whose TLS certificates are issued by SAP's corporate PKI — a CA present in corporate browsers (Chrome, Edge) but absent from Node.js's bundled OpenSSL trust store. Rather than bundling the corporate CA chain (which changes over time) or requiring operators to inject `NODE_EXTRA_CA_CERTS`, the proxy accepts an opt-in `TRUST_ALL_CERTS=true` environment variable that disables certificate validation for all outbound connections. This variable is set in `manifest.yml` for the CF deployment.

**Why not `NODE_EXTRA_CA_CERTS`?** The CF deployment uses the standard nodejs buildpack and the SAP corporate CA bundle is not reliably available as a file at a known path inside the buildpack container. `TRUST_ALL_CERTS=true` is a documented, explicit opt-in — not a silent default.

**Security note:** `TRUST_ALL_CERTS=true` disables server certificate validation globally for all proxy connections. This is acceptable in the CF scenario because: (a) the proxy is an internal SAP tool not exposed to untrusted networks, (b) the CORS allowlist restricts which browser origins may call it, and (c) the threat model for a shared corporate proxy is different from a local-machine proxy where the user is the only party. Operators running the proxy in any environment where MITM is a realistic threat must NOT set `TRUST_ALL_CERTS=true`.
