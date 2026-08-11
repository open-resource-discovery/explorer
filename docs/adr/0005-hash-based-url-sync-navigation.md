# Hash-based URL sync for navigation state

Navigation state (current page, active resource type, search query, and filters) is serialised into the URL hash so that views are deep-linkable, shareable, and survive browser reload. The feature is opt-in via an `enableUrlSync` prop on `ORDExplorer`.

## Context

ADR 0001 established a two-level page-replacement navigation model. The initial implementation held all navigation state — the active `Page` union, the search query, and filter sets — in `useState` inside `ORDExplorer`. This was a deliberate shortcut during prototyping.

The consequences were:

- **No browser history.** Back and forward buttons did nothing. Every reload returned to the dashboard.
- **No deep links.** Users could not bookmark or share a link to a specific resource list, package view, or filtered search result.
- **Navigation logic was scattered.** Destinations were communicated through named callback props (`onSelectResourceType`, `onSelectPackages`, `onSelectConsumptionBundles`, `onBack`) threaded down to every page component. Adding a page required wiring new props through every ancestor.

## Decision

### Why not React Router or TanStack Router?

`ord-explorer` is a **published npm component library**. React is declared as a `peerDependency` with no router dependency. Adding a router as a `dependency` would:

1. Force every consumer to use the exact same router version.
2. Conflict with host applications that already have their own router (the common deployment scenario — ORD Explorer is expected to be embedded in larger portals).
3. Inflate the bundle with a full routing runtime for a component that navigates between four pages.

### Chosen approach: opt-in hash routing, zero additional dependencies

The `window.location.hash` API and the native `popstate` / `hashchange` events are used to sync navigation state to the URL. No new `dependencies` are added.

A `useHashSync` hook reads the initial hash on mount, pushes a new hash entry on every navigation, and syncs back-button presses back into React state via a `popstate` listener. The hook is composed with `useNavState`, which owns the typed `Page` union and exposes a single `navigate(page)` function.

This is activated by passing `enableUrlSync` (default `false`) to `ORDExplorer`. When the prop is omitted, behaviour is identical to today and existing embedders are unaffected.

### URL shape

```
#/dashboard
#/resourceList/<resourceType>
#/packages
#/consumptionBundles
```

Search params are appended to the hash for transient view state:

```
#/resourceList/apiResources?q=payment&visibility=public&releaseStatus=active
```

| State                           | URL location                                          |
| ------------------------------- | ----------------------------------------------------- |
| `page.id` + `page.resourceType` | Hash path segment                                     |
| `query` (search bar text)       | `?q=` hash search param                               |
| `filters.visibility`            | `?visibility=` hash search param (comma-separated)    |
| `filters.releaseStatus`         | `?releaseStatus=` hash search param (comma-separated) |
| DOM refs, transient UI state    | Stays in component                                    |

### Callback prop simplification

The scattered `onSelectResourceType` / `onSelectPackages` / `onSelectConsumptionBundles` / `onBack` props on page components are replaced by a single `navigate: (page: Page) => void` prop passed from `useNavState`. This is a pure internal refactor; the public `ORDExplorerProps` interface is unchanged aside from the new `enableUrlSync` opt-in.

## Consequences

- Browser back/forward now work across all page transitions.
- Any view, including a filtered or searched resource list, is bookmarkable and shareable.
- Adding a new page does not require plumbing new callback props — only a new `Page` union variant and a `navigate({ id: '...' })` call.
- Consumers who embed `ORDExplorer` in a host app with its own router should leave `enableUrlSync` at its default (`false`) and drive navigation themselves if needed.
- The `window` object is accessed only when `enableUrlSync` is `true`, so server-side rendering environments are not broken by the default configuration.
