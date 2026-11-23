# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) rules.

## [unreleased]

### Changed

- Update the ORD specification dependency and bundled sample documents to ORD 1.17.
- Keep Node.js 24.15.0 and npm 11.11.1 as the Explorer package minimum. Pin Node.js 26.13.1 LTS for development, the auth proxy, and container builds.
- Refresh compatible runtime and development dependencies, including the ORD renderer and UI components; align the Playwright package and container version.
- Correct Renovate security-alert configuration and cover Node version files and Dockerfiles. Keep TypeScript within the supported typescript-eslint peer range.

### Fixed

- Preserve the AI SDK's compatible provider-utils version instead of forcing all major versions onto the older security override.
- Build and start the bundled auth proxy successfully, with dedicated CI type, runtime and security checks.
- Match the JSON media type exactly when validating proxy requests, including requests with MIME parameters.
- Keep automatically imported vendor CSS in the component cascade layer so filter colors survive renderer and UI-component updates.
- Serve the SPA from its actual Docker build output directory and verify the app and proxy through nginx in CI.

### Security

- Remove hosted mTLS proxy configuration; default the local proxy to loopback, enforce server certificate validation and reject untrusted request origins and network-supplied certificate paths.
- Publish the Docker app and its proxy API only on the host loopback interface by default.
- Pause fork-preview deployment while the shared worker still executes artifact metadata as shell code. Same-repository previews remain configured.
- Restrict workflow permissions and pin release actions to reviewed commits.
- Update vulnerable dependency paths, including fast-copy and the lint toolchain.

## [[0.2.1](https://github.com/open-resource-discovery/explorer/releases/tag/v0.2.1)] - 2026-10-01

### Fixed

- Published package now ships the embeddable library build (`dist/lib`); the 0.2.0 tarball was missing it, so `@open-resource-discovery/explorer/components` could not be imported by consumers.

## [0.2.0] - 2026-09-28

### Added

- Embeddable library build (`npm run build:lib`) exposing `ExplorerPage`, `ConnectionDetailPage`, and `ServerStatusPanel` as reusable React components with TypeScript types
- Per-perspective ORD document fetching
- Package published to npm as [`@open-resource-discovery/explorer`](https://www.npmjs.com/package/@open-resource-discovery/explorer) — the built app (`dist/`) is now available for self-hosting
- Docker image published to GitHub Container Registry at `ghcr.io/open-resource-discovery/explorer`

### Changed

- Reworked perspective and connection selection UI, streamlining the add-connection flow
- Documented CSS embedding interop for host applications (`docs/css-embedding-interop.md`)
- Ongoing dependency and toolchain updates across runtime and dev dependencies, including resolved Dependabot security advisories

### Fixed

- Visibility and Release Status filter pills keep their colors after the `ui-components` upgrade

## [0.1.0] - 2026-08-03

<!-- Pre-public / internal baseline: this release was curated in the SAP-internal repository before the project was open-sourced. -->

### Added

- Detail pages for packages and consumption bundles
- Changelog tab on resource detail pages
- Primary definition preview in resource overview
- `customType` display in custom resource definitions
- Pretty-print and syntax-highlight XML and unknown definition formats
- Raw dialog for viewing definition source (replaces Open button)
- Fuzzy search across resources
- Visibility badge on non-public resources
- Release status badges differentiated by urgency
- Package `shortDescription` shown as subtitle in accordion header
- Resource name shown as active breadcrumb tab in header nav
- Explorer header tab navigates back to the dashboard
- Crawler-style URL handling for connection base URLs
- Explicit certificate / key / CA fields for connections (replaces multi-file PEM upload)

### Fixed

- Definition URLs now resolved against base URL instead of document URL
- Circular chunk dependency in Rolldown build that caused a blank page on GitHub Pages
- Client certificate field now accepts a full certificate chain PEM
- Stale breadcrumb bar and subtitle removed from add/edit connection page

### Changed

- Project renamed from `ord-explorer` to `explorer`
- Removed direct-document connection type
