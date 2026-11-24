# ORD Explorer

[![CI](https://github.com/open-resource-discovery/explorer/actions/workflows/main.yml/badge.svg)](https://github.com/open-resource-discovery/explorer/actions/workflows/main.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D24.15.0-brightgreen.svg)](https://nodejs.org)
[![Live Demo](https://img.shields.io/badge/demo-live-informational)](https://open-resource-discovery.github.io/explorer/)

A standalone web app for exploring [ORD (Open Resource Discovery)](https://open-resource-discovery.org/) documents — connect to any ORD-compliant system endpoint or document URL, browse its resources, and inspect definitions.

## Live Demo

👉 [open-resource-discovery.github.io/explorer](https://open-resource-discovery.github.io/explorer/)

## What it is

The app manages one or more **connections** (system endpoints or direct document URLs). For each connection it fetches, merges, and renders a three-level browsing UI:

- **Catalog** — per-type stat cards (APIs, Events, Entity Types, Data Products) with counts and search
- **Resource list** — resources grouped by ORD package, with fuzzy search and visibility/release-status filters
- **Resource detail** — full description, schema, documentation, changelog, and raw JSON tabs

Authentication options: none, static bearer token, or mTLS (via local proxy — see below).

## Setup

The Explorer package supports Node.js **24.15.0** or newer and npm **11.11.1** or newer.
Development and the auth proxy use Node.js **26.13.1 LTS**, pinned in `.nvmrc`. With nvm installed,
run `nvm install` and `nvm use` before installing dependencies.

```sh
npm install
```

## Commands

| Command            | Description                         |
| ------------------ | ----------------------------------- |
| `npm run dev`      | Start the dev server                |
| `npm run build`    | Type-check and build to `dist/`     |
| `npm run lint`     | Run ESLint                          |
| `npm run format`   | Run Prettier + ESLint with auto-fix |
| `npm test`         | Run unit tests                      |
| `npm run test:e2e` | Run Playwright end-to-end tests     |

## Embedding the packed components

Build an installable tarball with `npm pack`. Its public entry points are
`@open-resource-discovery/explorer/components` for React components and types, and
`@open-resource-discovery/explorer/components/styles` for the stylesheet.

Browser consumers that embed these components need a CommonJS `require` shim for
`buffer`, `events`, `stream`, and `util`. Install it before loading the component
entry point. A Vite consumer can use a bootstrap module that installs the shim and
then dynamically imports the app. See the [provider-server shim](https://github.com/open-resource-discovery/provider-server/blob/5576e01c960a94b83b95c11feea3724404381d15/ui/src/buffer-shim.ts)
for an example.

## mTLS proxy

mTLS connections require the local auth proxy (browser `fetch` cannot attach client certificates). Run it alongside the dev server:

```sh
npm run proxy          # from the repo root — starts the compiled proxy
```

Or build and start the proxy package directly:

```sh
cd auth-proxy
npm ci
npm run build
npm start
```

The container setup is available with `docker compose up --build`. Open
`http://localhost:8080`; the app and its proxy API are published only on the
host's loopback interface.

### Local mTLS test server

To test end-to-end mTLS without a real endpoint, use the included dev server:

```sh
cd auth-proxy
npm run dev:gen-certs  # generate self-signed certs (once)
npm run dev:server     # start an mTLS-enforced ORD server on https://localhost:44124
```

Then add a connection in the app:

- **Base URL:** `https://localhost:44124`
- **Auth:** mTLS
- **Client cert / key / CA:** `auth-proxy/dev/certs/client.crt`, `client.key`, `ca.crt`

## Architecture decisions

Significant design decisions are recorded as ADRs in [`docs/adr/`](docs/adr/). New decisions should be added there.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/open-resource-discovery/explorer).
