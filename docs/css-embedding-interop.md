# CSS embedding interoperability issues

This document tracks structural problems found when embedding the explorer as a library
inside a host application (e.g. provider-server). The issues involve three packages:
`@open-resource-discovery/ui-components`, `@open-resource-discovery/metadata-renderer`,
and the explorer itself.

---

## 1. `SimpleDialog` always portals to `document.body`

**Package:** `@open-resource-discovery/ui-components`

### Problem

`SimpleDialog` uses Ark UI's `Dialog.Portal` with no `container` prop. Portal content
always renders as a direct child of `document.body`, outside the `.ord-root` subtree.
Explorer's entire CSS is scoped to `.ord-root` — design tokens, base resets, and all
component styles are unavailable to portal content.

Observable effects when a `SimpleDialog` contains rendered content:

- CSS custom properties (`--background`, `--primary`, etc.) do not resolve
- Tailwind base resets (box-sizing, margin, max-width for media) do not apply
- Dark-mode class detection fails

### Current workaround

Wrap the dialog's children in `ThemeRootContent`, which renders a `div.ord-root` inside
the portal:

```tsx
<SimpleDialog ...>
  <ThemeRootContent className="flex-1 flex flex-col min-h-0">
    {children}
  </ThemeRootContent>
</SimpleDialog>
```

This works but must be applied at every call site. Any `SimpleDialog`, `SimpleSheet`, or
other portal-based component in `ui-components` that is used inside an `.ord-root`
subtree has the same problem and needs the same workaround.

### Proper fix

`ThemeRoot` already provides a `PortalContainerContext` whose value is the `.ord-root`
element. `SimpleDialog` (and every other portal-bearing component) should consume this
context and pass the element as `container` to Ark UI's `Dialog.Portal`:

```tsx
// inside SimpleDialog
const container = usePortalContainer();   // already exported from ui-components
...
<Dialog.Portal container={container ?? document.body}>
```

With this change, all portals automatically render inside `.ord-root` whenever a
`ThemeRoot` ancestor is present, and fall back to `document.body` otherwise. The
per-call `ThemeRootContent` wrappers become unnecessary.

---

## 2. `metadata-renderer` ships mismatched Vue scoped-style hashes

**Package:** `@open-resource-discovery/metadata-renderer`

### Problem

Scalar (the OpenAPI renderer bundled in `metadata-renderer`) is a Vue 3 application.
Vue's scoped-style system appends a build-time hash as a `data-v-XXXX` attribute to both
DOM elements and CSS selectors, so that styles only apply to their own component.

In the distributed package the CSS hash and the runtime component hash do not match.
An audit of `dist/index.css` found **128 unique `data-v-XXXX` hashes**; 114 of them
carry visually-impactful rules with no unscoped equivalent elsewhere in the file.

Severity breakdown:

| Tier           | Examples                                                                                                                   | Impact if missing                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **CRITICAL**   | `.references-layout` grid, `--refs-*` CSS vars, `.operation-layout` grid, `.section` padding, `.section-container` gutters | Entire layout broken or content missing         |
| **MODERATE**   | Collapsible panel toggles (auth, request preview), sidebar component sizes, client catalog grid                            | Interactive features non-functional or unstyled |
| **LOW**        | Animation tweaks, badge tints, dark-mode hover brightness, loader icon                                                     | Cosmetic only                                   |
| **NOT needed** | AI-agent components (`AgentChat`, `AgentScalar`, etc.), Swagger editor start page                                          | Not visible in a read-only API reference        |

### Current workaround

`app/src/lib/styles.css` contains a comprehensive workaround block that replicates all
CRITICAL and most MODERATE rules without the scope hash, scoped under `.ord-root`:

- `--refs-*` custom properties on `.scalar-api-reference` (feed all layout calculations)
- `.references-layout` grid + responsive single-column override at `< 1000px`
- `.references-rendered`, `.references-editor`, `.references-footer` grid-area assignments
- `.section` flex-column structure + max-width + padding
- `.section-container` 60 px gutters
- `.section-accordion-wrapper` + inner accordion layout
- `.section-columns` / `.section-column` flex layout
- `.operation-layout` two-column grid + responsive `@container` collapse
- Collapsible panel expand/collapse (`authContent`, `requestContent`)
- `.catalog` grid and `.screenreader-only` utility

Remaining gaps (LOW priority, not applied): animation tweaks, badge colour tints,
dark-mode hover brightness, AI-agent component layouts.

### Proper fix

Fix the `metadata-renderer` build pipeline so that the CSS and component code are built
from the same Scalar sources in the same build pass, producing consistent `data-v` hashes.
Alternatively, switch the Scalar integration to unscoped CSS classes (acceptable since
Scalar's classes are namespaced under `.scalar-*` / `scalar-app`), removing the
dependency on hash-based scoping entirely.

---

## 3. `metadata-renderer` suppresses `.section-flare` only in print media

**Package:** `@open-resource-discovery/metadata-renderer`

### Problem

Scalar renders a `div.section-flare` with `position: fixed; top: 0; right: 0` as a
decorative gradient. `metadata-renderer`'s CSS hides it inside `@media print` only:

```css
@media print {
  .section-flare {
    display: none !important;
  }
}
```

On screen the element is visible and positioned at the viewport's top-right corner. When
the preview modal is 95 vw wide the section-flare overlaps the modal content.

### Current workaround

```css
.ord-root .section-flare {
  display: none;
}
```

This hides the element within `.ord-root` on screen, not just during printing. It is
safe for all current uses where Scalar is only ever rendered inside the preview modal.
If Scalar is rendered in a full-page context within `.ord-root` in the future, this rule
would suppress a decoration that Scalar intends to show.

### Proper fix

`metadata-renderer` should suppress `.section-flare` on screen unconditionally (it is
purely decorative and causes layout problems in any constrained container), or expose a
configuration option to disable it. The current `@media print`-only suppression appears
to be an oversight.

A more surgical downstream workaround scopes the hide to dialog contexts only:

```css
[role="dialog"] .section-flare {
  display: none;
}
```

Ark UI's `Dialog.Popup` carries `role="dialog"`, so this targets the modal without
affecting hypothetical future full-page Scalar use.

---

## 4. Explorer's scoped Tailwind preflight is incomplete

**Package:** `@open-resource-discovery/explorer` (`app/src/lib/styles.css`)

### Problem

`styles.css` replicates Tailwind's preflight scoped to `.ord-root` so that the library
does not leak global styles into host pages. The replication is missing at least one
standard preflight rule: `height: auto` alongside `max-width: 100%` for replaced
elements.

Tailwind's standard preflight:

```css
img,
video {
  max-width: 100%;
  height: auto;
}
```

Current scoped version:

```css
.ord-root :where(img, video, svg) {
  max-width: 100%;
}
```

Without `height: auto`, an element whose width is constrained by `max-width` but which
carries an explicit `height` attribute (e.g. `height="800"`) renders at the original
height rather than scaling proportionally.

### Proper fix

Add `height: auto` to the rule:

```css
.ord-root :where(img, video, svg) {
  max-width: 100%;
  height: auto;
}
```

Then audit the full scoped preflight against Tailwind's canonical preflight
(`node_modules/tailwindcss/preflight.css`) to find any other missing rules.

---

## Summary: ownership and priority

| #   | Root cause                                      | Owner               | Priority                                                                |
| --- | ----------------------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| 1   | `SimpleDialog` ignores `PortalContainerContext` | `ui-components`     | High — affects every portal component                                   |
| 2   | Vue scoped-style hash mismatch in Scalar build  | `metadata-renderer` | High — silently breaks intended CSS; likely affects multiple components |
| 3   | `.section-flare` only suppressed in print media | `metadata-renderer` | Medium — visual defect in embedded or modal contexts                    |
| 4   | Scoped preflight missing `height: auto`         | `explorer`          | Low — narrow impact, easy fix                                           |
