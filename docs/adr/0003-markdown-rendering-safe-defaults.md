# Markdown rendering with safe defaults for resource descriptions

ORD resource `description` fields are rendered as markdown using `react-markdown`. Plain text and a custom minimal renderer were considered.

Plain text was rejected because ORD descriptions are authored by developers who use markdown structure (paragraphs, code spans, lists) — rendering them as plain text degrades readability. A custom minimal renderer (paragraph splitting only) was considered as a zero-dependency option but rejected because the incremental supply chain risk of `react-markdown` is outweighed by the rendering quality gap.

## Security constraints

The following defaults are enforced and must not be relaxed without an explicit security review:

- `rehype-raw` is **not** added. This is a plugin that would need to be explicitly added to this codebase — an ORD document cannot inject it. Without it, raw HTML in markdown is stripped entirely.
- A `urlTransform` prop whitelists `http://` and `https://` schemes only. All other schemes (`javascript:`, `file://`, `data:`, `localhost`, etc.) are stripped to the empty string. This closes the only document-injectable XSS vector under `react-markdown` defaults.

`file://` and `localhost` references are legitimate targets for the `urlTransform` block: ORD documents are served and consumed over a network; filesystem and localhost links are unreachable to any real consumer and have no valid use case in descriptions.

## For ORD document authors

Descriptions render as standard markdown. Links must use `http://` or `https://` — all other URL schemes are stripped silently.
