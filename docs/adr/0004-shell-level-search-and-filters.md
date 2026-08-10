# Shell-level search with visibility and release status filters

Search state (query string + visibility filter + release status filter) lives in the `ORDExplorer` shell and is passed down to both the Dashboard and Resource List pages. It was not placed in the Zustand store, and it was not kept local to each page.

A colleague's vibe-coded reference implementation presented the alternative: a persistent left sidebar with visibility and release status toggle chips scoped to a flat all-resources grid, independent of navigation. That layout was rejected — the sidebar duplicated the resource list alongside itself, the flat grid lost package grouping context, and the filter state was decoupled from navigation in a way that made the carry-through behaviour undefined.

Two other placements were considered for the search state:

**Store (Zustand)** — rejected because search state is transient UI state, not document state. Persisting it in the store would mean filters survive page navigations, which is surprising behaviour, and it would couple the store to presentation concerns.

**Page-local** — the original design. Each page owned its own search input. Rejected because the user's intent was explicitly "search starts from the topmost level and filters every card/abstraction level for later drilldown" — that requires the query to already be active when a resource type card is clicked, so the Resource List opens pre-filtered. Local state cannot achieve this without threading the value through the navigation event, which is equivalent to shell ownership with extra steps.

## Consequences

The `SearchBar` component is rendered once in the `ORDExplorer` shell, above both pages. It owns no state — it receives `query` and `filters` and fires `onChange` callbacks. The shell is the single source of truth.

Dashboard card counts reflect the active query and filters. Clicking a card navigates to the Resource List with those filters already applied — no "filter reset on navigate" surprise.

Visibility and release status defaults are all-selected (no filter active). The "Reset filters" affordance appears only when something has been deselected, avoiding visual noise in the default state.

The filter chips use a guard against deselecting the last active option in each group — an all-deselected state would hide every resource with no obvious recovery path.
