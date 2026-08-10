import type { OrdDocument } from "./types";

interface WellKnownDocument {
  url: string;
  accessStrategies?: unknown[];
}

interface WellKnownConfig {
  openResourceDiscovery: string;
  documents?: WellKnownDocument[];
}

function documentIdFromPath(path: string): string {
  // Extract last path segment as id, stripping leading slash
  const parts = path.replace(/\/+$/, "").split("/");
  return parts[parts.length - 1] ?? "document";
}

export async function discoverDocuments(
  baseUrl: string,
): Promise<OrdDocument[]> {
  const url = `${baseUrl.replace(/\/+$/, "")}/.well-known/open-resource-discovery`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Discovery failed: ${res.status} ${res.statusText}`);
  }
  const config: WellKnownConfig = (await res.json()) as WellKnownConfig;
  const base = new URL(baseUrl.replace(/\/+$/, ""));
  return (config.documents ?? []).map((doc) => {
    const resolved = new URL(doc.url, base.href);
    // Preserve full URL for cross-origin documents; relative path suffices for same-origin
    const path =
      resolved.origin === base.origin ? resolved.pathname : resolved.href;
    return {
      id: documentIdFromPath(path),
      name: documentIdFromPath(path),
      path,
    };
  });
}
