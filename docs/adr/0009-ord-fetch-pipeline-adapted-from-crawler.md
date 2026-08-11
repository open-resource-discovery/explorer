# ORD document fetch pipeline adapted from crawler

## Context

Fetching an ORD document for a given connection requires:

1. For `system-endpoint` connections (UC-01): fetch the discovery config at `/.well-known/open-resource-discovery`, filter document URLs by perspective, fetch all documents in that perspective in parallel, merge them into a single `OrdDocument`.
2. For `direct-document` connections (UC-02): fetch a single document URL directly.

The sibling project `crawler` already implements this pipeline in full: `fetchOrdConfiguration`, `fetchOrdDocuments`, URL resolution (`getFetchUrl`, `getBaseUrl`), and document merging (`ordMerge`). It is typed against `@open-resource-discovery/specification`, which this project already depends on.

## Decision

The crawler's fetch and merge utilities are copied into `app/src/lib/fetcher/` with the following rules:

- `ordMerge.ts` and `fetch.ts` are copied as-is — they contain no Node.js-specific APIs and work in the browser unchanged.
- The URL resolution logic (`getFetchUrl`, `getBaseUrl`) and the perspective filtering + parallel fetch pipeline are extracted from `ordUtils.ts` and `fetchOrdDocuments.ts`, stripping all CLI scaffolding: `readline`, `process.stdout`, `process.cwd()`, `fs`, path-based file output. Only the pure data-transformation and HTTP logic is kept.
- The resulting utilities use only the global `fetch` API (available in both browser and Node.js 18+) and have no runtime dependency on Node.js built-ins. This makes them usable in both the browser fetch layer and the `auth-proxy/` Node.js process.

Discovery (step 1 above) runs once at connection test/sync time (UC-06). The resolved perspective list with document URLs is stored in the connection's localStorage record. `useOrdDocument` then only needs to fetch + merge the known URLs — it does not re-run discovery on every navigation.

## Consequences

- Crawler logic is duplicated rather than shared via a package. A shared `@open-resource-discovery/ord-fetcher` package is the right long-term extraction but adds version coordination overhead before the feature ships.
- Changes to the crawler's fetch pipeline must be manually ported if needed. A comment in each copied file records the source.
- The proxy uses the same extracted utilities for its own fetch execution, with the `undici` mTLS agent substituted for the global `fetch`.
