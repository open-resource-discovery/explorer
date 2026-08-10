import { useState, useEffect, useRef } from "react";
import { fetchTextViaProxy, useProxy } from "@lib/proxy";
import { useConnectionId } from "@lib/context/ConnectionIdContext";
import { useDefinitionContent } from "@lib/context/DefinitionContentContext";
import { MetadataRenderer } from "@open-resource-discovery/metadata-renderer";
import { useTheme } from "@lib/hooks/useTheme";
import { JsonHighlight } from "../../JsonHighlight";
import { XmlHighlight } from "../../XmlHighlight";
import type { ResourceDefinition } from "./definitionUtils";
import { RENDERABLE_DEF_TYPES } from "./definitionUtils";

const XML_MEDIA_TYPES = new Set([
  "application/xml",
  "text/xml",
  "application/vnd.sap.edmx",
]);

const XML_DEF_TYPES = new Set(["edmx"]);

function isXml(type: string, mediaType?: string): boolean {
  if (mediaType && XML_MEDIA_TYPES.has(mediaType)) return true;
  if (XML_DEF_TYPES.has(type)) return true;
  if (mediaType && mediaType.includes("xml")) return true;
  return false;
}

function prettyXml(xml: string): string {
  try {
    let indent = 0;
    return xml
      .replace(/>\s*</g, ">\n<")
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("</")) indent = Math.max(0, indent - 1);
        const result = "  ".repeat(indent) + trimmed;
        if (
          !trimmed.startsWith("</") &&
          !trimmed.endsWith("/>") &&
          !trimmed.startsWith("<?") &&
          !trimmed.startsWith("<!--") &&
          trimmed.includes("<") &&
          !trimmed.includes("</")
        )
          indent++;
        return result;
      })
      .filter(Boolean)
      .join("\n");
  } catch {
    return xml;
  }
}

function ordTypeToMetaType(
  type: string,
): import("@open-resource-discovery/metadata-renderer").MetaType | undefined {
  if (type.startsWith("openapi")) return "openapi";
  if (type.startsWith("asyncapi")) return "asyncapi";
  if (type === "sap-csn-interop-effective-v1") return "csn";
  if (type === "a2a-agent-card") return "a2a";
  return undefined;
}

function isJsonString(content: string, mediaType?: string): boolean {
  if (mediaType === "application/json") return true;
  if (mediaType) return false;
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

export function DefinitionRenderer({
  content,
  defType,
  mediaType,
  theme,
}: {
  content: string;
  defType: string;
  mediaType?: string;
  theme: "light" | "dark";
}) {
  if (isXml(defType, mediaType)) {
    return (
      <pre
        data-testid="definition-content"
        className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono overflow-auto flex-1 min-h-0 whitespace-pre"
      >
        <XmlHighlight xml={prettyXml(content)} />
      </pre>
    );
  }

  const metaType = ordTypeToMetaType(defType);
  if (metaType || RENDERABLE_DEF_TYPES.has(defType)) {
    return (
      <div
        data-testid="definition-content"
        className="rounded-[var(--ord-radius)] overflow-auto border border-border flex-1 min-h-0"
      >
        <MetadataRenderer
          content={content}
          type={metaType}
          className={theme === "dark" ? "dark" : ""}
        />
      </div>
    );
  }

  const isJsonContent = isJsonString(content, mediaType);
  const isXmlContent = !isJsonContent && /^\s*</.test(content);

  if (isJsonContent) {
    let pretty = content;
    try {
      pretty = JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      /* leave as-is */
    }
    return (
      <pre
        data-testid="definition-content"
        className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono overflow-auto flex-1 min-h-0 whitespace-pre"
      >
        <JsonHighlight json={pretty} />
      </pre>
    );
  }

  if (isXmlContent) {
    return (
      <pre
        data-testid="definition-content"
        className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono overflow-auto flex-1 min-h-0 whitespace-pre"
      >
        <XmlHighlight xml={prettyXml(content)} />
      </pre>
    );
  }

  return (
    <pre
      data-testid="definition-content"
      className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono overflow-auto flex-1 min-h-0 whitespace-pre-wrap break-all"
    >
      {content}
    </pre>
  );
}

type DefinitionFetchState =
  | { status: "loading" }
  | { status: "done"; content: string }
  | { status: "error" };

export function useDefinitionFetch(
  url: string,
  onLoad?: (content: string) => void,
): DefinitionFetchState {
  const [state, setState] = useState<DefinitionFetchState>({
    status: "loading",
  });
  const connectionId = useConnectionId();
  const proxy = useProxy();
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  });

  useEffect(() => {
    let cancelled = false;
    const isCrossOrigin =
      new URL(url, window.location.href).origin !== window.location.origin;
    const useProxyForFetch = proxy.available && isCrossOrigin;

    const load = useProxyForFetch
      ? fetchTextViaProxy(connectionId, url)
      : fetch(url).then((res) => {
          if (
            !res.ok ||
            (res.headers.get("content-type") ?? "").includes("text/html")
          )
            throw new Error("not ok");
          return res.text();
        });

    load
      .then((content) => {
        if (!cancelled) {
          setState({ status: "done", content });
          onLoadRef.current?.(content);
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [url, connectionId, proxy.available]);

  return state;
}

function DefinitionFetchStatus({ url }: { url: string }) {
  return (
    <p className="text-sm text-muted-foreground py-4">
      Failed to load definition from <span className="font-mono">{url}</span>.{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline"
      >
        Open externally
      </a>
    </p>
  );
}

const DefinitionLoadingSpinner = (
  <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
    <span className="animate-spin rounded-full h-4 w-4 border-2 border-border border-t-primary" />
    Loading definition…
  </div>
);

export function LazyDefinitionLoader({
  url,
  defType,
  mediaType,
  theme,
}: {
  url: string;
  defType: string;
  mediaType?: string;
  theme: "light" | "dark";
}) {
  const state = useDefinitionFetch(url);

  if (state.status === "loading") return DefinitionLoadingSpinner;
  if (state.status === "error") return <DefinitionFetchStatus url={url} />;

  return (
    <DefinitionRenderer
      content={state.content}
      defType={defType}
      mediaType={mediaType}
      theme={theme}
    />
  );
}

export function RawDefinitionLoader({
  url,
  defType,
  mediaType,
  onLoad,
}: {
  url: string;
  defType: string;
  mediaType?: string;
  onLoad?: (content: string) => void;
}) {
  const state = useDefinitionFetch(url, onLoad);

  if (state.status === "loading") return DefinitionLoadingSpinner;
  if (state.status === "error") return <DefinitionFetchStatus url={url} />;

  const { content } = state;

  // Raw dialog shows source text only — intentionally skips MetadataRenderer
  // so the user sees what the server actually returned, not a rendered API explorer view.
  if (isXml(defType, mediaType)) {
    return (
      <pre className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono overflow-auto flex-1 min-h-0 whitespace-pre">
        <XmlHighlight xml={prettyXml(content)} />
      </pre>
    );
  }

  const isJsonContent = isJsonString(content, mediaType);
  const isXmlContent = !isJsonContent && /^\s*</.test(content);

  if (isJsonContent) {
    let pretty = content;
    try {
      pretty = JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      /* leave as-is */
    }
    return (
      <pre className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono overflow-auto flex-1 min-h-0 whitespace-pre">
        <JsonHighlight json={pretty} />
      </pre>
    );
  }

  if (isXmlContent) {
    return (
      <pre className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono overflow-auto flex-1 min-h-0 whitespace-pre">
        <XmlHighlight xml={prettyXml(content)} />
      </pre>
    );
  }

  return (
    <pre className="rounded-[var(--ord-radius)] border border-border bg-muted/30 p-4 text-xs font-mono overflow-auto flex-1 min-h-0 whitespace-pre-wrap break-all">
      {content}
    </pre>
  );
}

export function MetadataPreview({ def }: { def: ResourceDefinition }) {
  const definitionContent = useDefinitionContent();
  const { resolvedTheme } = useTheme();

  const fetchState = def.url ? (definitionContent.get(def.url) ?? null) : null;

  if (!def.url) {
    return (
      <p className="text-sm text-muted-foreground">
        No URL available for this definition.
      </p>
    );
  }

  if (!fetchState) {
    return (
      <LazyDefinitionLoader
        url={def.url}
        defType={def.type}
        mediaType={def.mediaType}
        theme={resolvedTheme}
      />
    );
  }

  if (fetchState.status === "loading") {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-border border-t-primary" />
        Loading definition…
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Failed to load definition from{" "}
        <span className="font-mono">{def.url}</span>.{" "}
        <a
          href={def.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Open externally
        </a>
      </p>
    );
  }

  return (
    <DefinitionRenderer
      content={fetchState.content}
      defType={def.type}
      mediaType={def.mediaType}
      theme={resolvedTheme}
    />
  );
}
