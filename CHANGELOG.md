# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) rules.

## [unreleased]

## [0.1.0] - 2026-08-03

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
