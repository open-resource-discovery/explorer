# ORD Explorer — Use Cases

User-facing use cases for the ORD Explorer UI. Each use case represents a distinct user goal, maps to a single Playwright test, and is referenced by its ID (e.g. `UC-01`).

The user always starts from the **Connections** screen.

---

## 1. Connections

### UC-01: Add a system endpoint connection (no auth)

**Precondition:** User is on the Connections screen.

1. User clicks "Add connection".
2. User selects kind "System endpoint".
3. User enters a name and a base URL.
4. User confirms the resolved discovery config endpoint shown in the live preview matches `<base-url>/.well-known/open-resource-discovery`.
5. User saves the connection.

**Outcome:** The modal closes and the connection card appears on the Connections screen. If the auto-connect succeeds, the card shows a connected indicator; if it fails, it shows an error indicator.

---

### UC-02: Add a direct document connection (no auth)

**Precondition:** User is on the Connections screen.

1. User clicks "Add connection".
2. User selects kind "Direct document".
3. User enters a name and a direct ORD document URL.
4. User confirms no discovery config endpoint is shown (not applicable for this kind).
5. User saves the connection.

**Outcome:** The modal closes and the connection card appears on the Connections screen. If the auto-connect succeeds, the card shows a connected indicator; if it fails, it shows an error indicator.

---

### UC-03: Add a connection with static bearer token auth

**Precondition:** User is on the Connections screen and has a pre-obtained bearer token.

1. User clicks "Add connection".
2. User enters a name, selects kind and URL.
3. User selects authentication method "Static bearer token".
4. User pastes their token into the token field.
5. User saves the connection.

**Outcome:** The modal closes and the connection card appears on the Connections screen. If the auto-connect succeeds, the card shows a connected indicator; if it fails, it shows an error indicator.

---

### UC-04: Add a connection with mTLS auth

**Precondition:** User is on the Connections screen and has a client certificate and private key.

1. User clicks "Add connection".
2. User enters a name, selects kind and URL.
3. User selects authentication method "mTLS".
4. User provides the client certificate and private key.
5. User saves the connection.

**Outcome:** The modal closes and the connection card appears on the Connections screen. If the auto-connect succeeds, the card shows a connected indicator; if it fails, it shows an error indicator.

---

### UC-05: Add a connection with key and certificate chain auth

**Precondition:** User is on the Connections screen and has a key and certificate chain (e.g. from Bruno).

1. User clicks "Add connection".
2. User enters a name, selects kind and URL.
3. User selects authentication method "Key + cert chain".
4. User provides the key and the full certificate chain.
5. User saves the connection.

**Outcome:** The modal closes and the connection card appears on the Connections screen. If the auto-connect succeeds, the card shows a connected indicator; if it fails, it shows an error indicator.

---

### UC-06: Test a connection

**Precondition:** A connection card exists in any state.

1. User opens the kebab menu on a connection card.
2. User selects "Test & sync".
3. User observes live feedback while the test is in progress.

**Outcome:** The connection card updates to either "connected" (with last-synced timestamp) or "error" (with an inline error message).

---

### UC-07: Edit a connection

**Precondition:** At least one connection exists.

1. User opens the kebab menu on a connection card.
2. User selects "Edit".
3. User changes one or more fields (e.g. name or URL).
4. User saves the changes.

**Outcome:** The connection card reflects the updated values.

---

### UC-08: Duplicate a connection

**Precondition:** At least one connection exists.

1. User opens the kebab menu on a connection card.
2. User selects "Duplicate".
3. User reviews the pre-filled modal (copy of the original).
4. User updates the name to distinguish it and saves.

**Outcome:** A new connection card appears with the duplicated values and status "not connected".

---

### UC-09: Delete a connection

**Precondition:** At least one connection exists.

1. User opens the kebab menu on a connection card.
2. User selects "Delete".
3. User confirms the deletion in the confirmation prompt.

**Outcome:** The connection card is removed from the grid.

---

### UC-10: Connect to a system and view its connection detail

**Precondition:** A connection exists with status "not connected".

1. User clicks "Connect" on the connection card (or opens the card).
2. The connection transitions to "connected".
3. User is taken to the connection detail page.

**Outcome:** Connection detail shows endpoint info, validation summary, and a list of perspectives with their documents and resource counts.

---

### UC-11: View the raw ORD config of a connection

**Precondition:** A connected system endpoint connection is open on its detail page.

1. User clicks "View ORD config" in the Endpoint section.

**Outcome:** The raw discovery configuration JSON is displayed.

---

## 2. Perspectives & Document Merging

### UC-12: Explore a perspective

**Precondition:** User is on a connection detail page with at least one perspective listed.

1. User reviews the available perspectives (e.g. System Version, System Instance).
2. User clicks "Explore" on a perspective.

**Outcome:** The catalog view opens, showing a "Merged from N documents" badge and resources from all documents in that perspective merged into one catalog.

---

### UC-13: Switch perspective without going back to connections

**Precondition:** User is in the catalog or resource detail view.

1. User opens the connection switcher in the top bar.
2. User selects a different perspective (or connection).

**Outcome:** The catalog reloads with the selected perspective's merged resources.

---

## 3. Catalog

### UC-14: View the catalog overview

**Precondition:** User has entered a perspective via "Explore".

1. User sees the system hero (product title, description, perspective badge, policy level, version, base URL).
2. User sees per-type stat cards with resource counts.

**Outcome:** Catalog is visible with correct system metadata and resource type counts.

---

### UC-15: Filter catalog to a single resource type via stat card

**Precondition:** User is on the catalog view with multiple resource types present.

1. User clicks a stat card (e.g. "API Resources").

**Outcome:** The resource grid shows only resources of that type; the type filter chip is active; the count reads "N of M".

---

## 4. Resource Navigator

### UC-16: Search resources by keyword

**Precondition:** User is in the catalog view with the resource navigator visible.

1. User types a keyword into the filter input (e.g. a partial title or ordId).

**Outcome:** The resource list narrows to matching resources in real time; the count badge updates.

---

### UC-17: Filter resources by visibility

**Precondition:** User is in the catalog view.

1. User opens the faceted filters.
2. User selects a visibility value (e.g. "public").

**Outcome:** Only resources matching the selected visibility are shown; the count badge updates.

---

### UC-18: Filter resources by release status

**Precondition:** User is in the catalog view.

1. User opens the faceted filters.
2. User selects a release status (e.g. "deprecated").

**Outcome:** Only resources with that release status are shown; the count badge updates.

---

### UC-19: Clear all active filters

**Precondition:** At least one faceted filter is active.

1. User clicks "Clear all".

**Outcome:** All filters are removed and the full resource list is restored.

---

### UC-20: Change resource grouping mode

**Precondition:** User is in the catalog view.

1. User opens the Tweaks panel.
2. User switches grouping from "by type" to "by package" (or flat).

**Outcome:** The resource navigator re-groups resources accordingly.

---

### UC-21: Load more resources in a group

**Precondition:** A resource group has more than 5 items (the default cap).

1. User sees "Load N more" at the bottom of the group.
2. User clicks "Load N more".

**Outcome:** Up to 10 additional items appear in the group; "Show less" becomes available.

---

## 5. Resource Detail

### UC-22: Open a resource and view the Overview tab

**Precondition:** User is in the catalog view.

1. User clicks on a resource card.
2. The resource detail panel opens on the Overview tab.
3. User reads the description, details grid (protocol, type, level, entry points, etc.), tags, and relationships section.

**Outcome:** Resource detail is visible with correct metadata.

---

### UC-23: Copy a resource's ordId

**Precondition:** A resource detail panel is open.

1. User clicks the "Copy ordId" button in the resource header.

**Outcome:** The ordId is copied to the clipboard.

---

### UC-24: Copy a deep link to a resource

**Precondition:** A resource detail panel is open.

1. User clicks the "Copy deep link" button in the resource header.

**Outcome:** A URL with the full hash route (`#c/<connection>/p/<perspective>/r/<ordId>`) is copied to the clipboard.

---

### UC-25: View the Schema tab of a resource

**Precondition:** A resource detail panel is open.

1. User clicks the "Schema" tab.

**Outcome:** Resource definitions (type, media type, access strategies) and integration aspects are shown.

---

### UC-26: View the Documentation tab of a resource

**Precondition:** A resource detail panel is open.

1. User clicks the "Documentation" tab.

**Outcome:** Long description and documentation/package/API/data-product links are shown.

---

### UC-27: View the Changelog tab of a resource

**Precondition:** A resource detail panel is open.

1. User clicks the "Changelog" tab.

**Outcome:** Version timeline including any deprecation, sunset, and removal markers is shown.

---

### UC-28: View the raw JSON of a resource

**Precondition:** A resource detail panel is open.

1. User clicks the "Raw JSON" tab.

**Outcome:** The full resource definition is shown as syntax-highlighted JSON with a copy button.

---

## 6. Global Search

### UC-29: Open global search and find a resource

**Precondition:** User is anywhere in the explorer (catalog or resource detail).

1. User presses ⌘K (or Ctrl+K).
2. The command palette opens.
3. User types a search term.
4. Results appear grouped by resource type with match highlighting.
5. User selects a result with the keyboard (↑/↓/↵).

**Outcome:** The resource detail panel opens for the selected resource; the command palette closes.

---

### UC-30: Dismiss global search without selecting a result

**Precondition:** The command palette is open.

1. User presses Escape.

**Outcome:** The command palette closes; the previous view is unchanged.

---

## 7. Validation

### UC-31: View validation results for a connection

**Precondition:** User is on a connection detail page that shows a validation summary.

1. User clicks "Show details" on the validation summary row.

**Outcome:** Full validation results are shown: error count, warning count, resources checked, and a per-issue list with severity and description.

---

### UC-32: Jump to a resource from a validation issue

**Precondition:** Validation results are open and contain at least one issue with a resource link.

1. User clicks the resource link on a validation issue.

**Outcome:** The resource detail panel opens for the referenced resource.

---
