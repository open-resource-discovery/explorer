# Page-replacement navigation over multi-panel layout

The ORD Explorer uses full-page replacement for navigation (Dashboard → Resource List → Resource Detail) rather than a multi-panel / macOS Finder-style layout.

A multi-panel layout was considered. It was rejected because the primary human use case is browsing an _unknown_ document structure to build a mental model — not navigating to a known destination. The Finder pattern optimises for the latter. Additionally, real ORD documents contain hundreds to thousands of resources per type (the reference document has 962 API resources across 11 packages), so the deepest panel would always require search anyway, negating the spatial advantage of panels. Hover-to-collapse panels compound this by hiding context from exactly the user who needs it most.

## Consequences

The Package level is not a separate navigation page. It is rendered as collapsible accordion groups within the Resource List page, keeping the effective depth at two pages (Dashboard → Resource List).

Cross-type and cross-package search is deferred to a later phase but must be designed to fit within this page-replacement shell — not as a reason to revisit the panel layout.
