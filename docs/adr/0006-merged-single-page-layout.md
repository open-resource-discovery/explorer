# Merged single-page layout over two-level page replacement

**Supersedes:** [ADR 0001 — Page-replacement navigation over multi-panel layout](0001-page-replacement-navigation.md)

The ORD Explorer previously used full-page replacement to navigate from the Dashboard (summary cards with resource type counts) to a Resource List page for each type. This two-level model is replaced by a single merged page.

## Decision

All content is rendered on one page:

- **Top section:** compact summary cards for every selectable type (API Resources, Event Resources, Entity Types, Data Products, Capabilities, Agents, Integration Dependencies, Packages, Consumption Bundles). Non-navigable stat items (Products, Vendors, Groups) remain display-only for now.
- **Bottom section:** the resource list for whichever card is currently selected, separated from the top section by a visual divider.

The first non-empty card is selected by default on load. Clicking a summary card changes the selection and updates the list in place — no page navigation occurs.

The concept of a "page" as a navigation destination is eliminated. `Page` is renamed to `Selection`; `navigate` is renamed to `setSelection`. The `{ id: "dashboard" }` variant is retained as an internal empty-document sentinel — it is never serialised to the URL and has no rendered list panel; it exists so `firstNonEmptySelection` has a safe fallback when the document contains no resources at all. `PackagesPage` and `ConsumptionBundlesPage` are retained as list panels rendered inline rather than as navigation destinations; their breadcrumb back-buttons are removed.

## URL sync

When `enableUrlSync` is enabled, the selected card is serialised into the URL hash so views remain deep-linkable. The hash format is unchanged from ADR 0001: resource list selections use the `/resourceList/<type>` prefix (e.g. `#/resourceList/apiResources`); packages and consumption bundles use `#/packages` and `#/consumptionBundles`.

## Why

The two-level model required a click to reach any resource list, even when the document structure was already known. Showing both levels together eliminates that friction and matches a validated architect mockup. The concern from ADR 0001 — that resource lists are too large to show without search — is unchanged and unaffected: search and filters continue to operate on the bottom list exactly as before.

## Consequences

- `useNavState` is simplified: the `Page` type alias and `navigate` callback are renamed to `Selection` and `setSelection`.
- The `DashboardPage` component is dissolved into `ORDExplorer` (or a new `ExplorerPage` layout component). `ResourceListPage`, `PackagesPage`, and `ConsumptionBundlesPage` become panels within that layout rather than full pages.
- ADR 0001's multi-panel rejection still stands — this change collapses vertical levels, not horizontal panels.
- Products, Vendors, and Groups becoming selectable is explicitly deferred.
