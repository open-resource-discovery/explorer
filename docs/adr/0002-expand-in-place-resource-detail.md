# Expand-in-place for Resource Detail

Clicking a resource row expands it inline within the Resource List to show full detail. A separate detail page (full-page replacement) and a side-panel were both considered.

A side panel was rejected because the resource list already narrows to a single resource type — there is no benefit to keeping the list visible alongside detail when the user has already selected a specific item. A full detail page was rejected as premature: it requires new routing state and breaks the "scan and peek" browsing flow that is the primary use pattern in phase one.

Expand-in-place is scoped to single-expand per package group — opening one resource collapses the previous within the same group. This prevents vertical disorientation in packages with hundreds of resources.

## Consequences

The expanded area shows, in order: full `description` (untruncated), `resourceDefinitions` links, then a compact metadata row (target audience, tags). Future detail requirements (e.g. embedded spec rendering) should revisit the full-page detail approach at that point.
