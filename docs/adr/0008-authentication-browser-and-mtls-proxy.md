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
- The proxy runs on a fixed port in the 40000s (configurable via `--port`). CORS is restricted to a hardcoded allowlist of local origins only — the Vite dev/preview ports (`localhost:5173`–`5175`, `4173`) and the docker app's nginx origin (`localhost:8080`) — with an `--allow-origin` / `ALLOW_ORIGIN` escape hatch for bespoke local setups. No hosted/public origin is in the allowlist.
- The proxy is never deployed to any hosted environment — it is local-only. It binds to `127.0.0.1` by default; the docker image overrides this to `0.0.0.0` (safe because the container publishes no host port — the app reaches it over the internal compose network only).
- A startup warning is emitted: the proxy requires Chrome 94+ or Firefox 90+ (browsers that allow HTTPS pages to call `http://localhost` without mixed-content blocking, per the W3C Secure Contexts spec treating localhost as a trustworthy origin).

## TLS validation in the proxy (rejectUnauthorized)

When the proxy makes outbound connections via undici it must decide whether to validate the server's TLS certificate.

The proxy binds to `127.0.0.1` by default. The user controls their own machine and its certificate trust store. **All connections use `rejectUnauthorized: true`** — undici always validates the server certificate against the system/Node trust store; there is no opt-out. Users connecting to servers with private-CA certificates must supply the CA bundle via the mTLS connection's "CA Certificate" field; undici then validates against that CA.

## The allowlist is real access control, not just CORS

Because the proxy holds live client certificates and drives arbitrary outbound fetches, its origin allowlist is enforced as access control, not merely as CORS advisory headers:

- A state-changing request (`POST`/`DELETE`) whose `Origin` header is _present but not allowlisted_ is rejected with `403`, closing the CORS "simple request" CSRF hole (a `text/plain` POST triggers no preflight, so header-only CORS would let a cross-origin page drive side effects it can't read).
- Body-carrying `POST`s must send `Content-Type: application/json` or are rejected with `415`, forcing any cross-origin JSON through the already-gated preflight.
- A request with _no_ `Origin` is still allowed — same-origin browser fetches (docker's nginx, loopback) and local tooling (curl) carry none, and the loopback bind already scopes who can reach the port.

## History

An earlier iteration deployed this proxy as a CloudFoundry side-car (`ord-explorer-auth-proxy.cfapps...`) so the hosted gh-pages/pr-preview builds could use mTLS. That side-car ran with `TRUST_ALL_CERTS=true` (disabling all outbound TLS validation) and accepted client certs/private keys transmitted from the public app to a shared host. It was **deliberately decommissioned** — a hosted proxy inevitably transmits and holds users' mTLS credentials on infrastructure outside their control, a credential-leak exposure that the local-only model does not have. The hosted deployment, its `manifest.yml`, and the `TRUST_ALL_CERTS` code path have all been removed. If a hosted mTLS proxy is ever wanted again, it is a fresh design effort that must solve credential custody first — not a re-enable of this one.
