// Adapted from @open-resource-discovery/crawler
import type {
  OrdConfiguration,
  OrdDocument,
} from "@open-resource-discovery/specification";

const ORD_CONFIGURATION_POSTFIX = "/.well-known/open-resource-discovery";

export const DEFAULT_PERSPECTIVE = "system-instance";

export function isRemoteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function isOrdConfiguration(body: unknown): body is OrdConfiguration {
  return (
    typeof body === "object" &&
    body !== null &&
    "openResourceDiscoveryV1" in body
  );
}

export function isOrdDocument(body: unknown): body is OrdDocument {
  return (
    typeof body === "object" && body !== null && "openResourceDiscovery" in body
  );
}

/**
 * Constructs a complete URL by combining a base URL with a resource URL.
 *
 * For remote URLs (starting with 'http'), returns the resource URL as-is.
 * For relative/absolute paths, resolves them against the base URL using the URL API.
 */
export function getFetchUrl(baseUrl: string, resourceUrl: string): string {
  if (isRemoteUrl(resourceUrl)) {
    return resourceUrl;
  }

  const baseUrlObj = new URL(baseUrl);

  let resourcePath = resourceUrl;
  let resourceSearch = "";

  const qmarkIndex = resourceUrl.indexOf("?");
  if (qmarkIndex !== -1) {
    resourcePath = resourceUrl.slice(0, qmarkIndex);
    resourceSearch = resourceUrl.slice(qmarkIndex);
  }

  // Use URL API to resolve the path: combine base pathname with resource path
  const combined = new URL(
    resourcePath,
    baseUrlObj.origin + baseUrlObj.pathname.replace(/\/$/, "") + "/",
  ).href;
  const resolvedUrl = new URL(combined);

  if (resourceSearch) {
    resolvedUrl.search = resourceSearch;
  }

  return resolvedUrl.toString();
}

/**
 * Extracts the distinct perspective IDs declared in an ORD configuration.
 * Documents without an explicit perspective default to "system-instance".
 */
export function extractPerspectives(config: OrdConfiguration): string[] {
  const entries = config.openResourceDiscoveryV1?.documents ?? [];
  const seen = new Set<string>();
  for (const entry of entries) {
    seen.add(
      (entry as { perspective?: string }).perspective ?? DEFAULT_PERSPECTIVE,
    );
  }
  return [...seen];
}

/**
 * Get the base URL based on the ORD spec.
 * If configBaseUrl is provided it is used directly; otherwise the well-known suffix
 * is stripped from wellKnownUrl. If the URL does not end with the well-known suffix
 * (e.g. a custom configuration path), the URL's origin is returned as the base.
 */
export function getBaseUrl(
  wellKnownUrl: string,
  configBaseUrl?: string,
): string {
  if (configBaseUrl) {
    return configBaseUrl;
  }

  if (wellKnownUrl.endsWith(ORD_CONFIGURATION_POSTFIX)) {
    return wellKnownUrl.replace(ORD_CONFIGURATION_POSTFIX, "");
  }

  // Custom configuration path — return the directory of the config URL so
  // relative document URLs resolve correctly (spec requires baseUrl or absolute
  // URLs for custom endpoints, but this is the most correct fallback).
  const u = new URL(wellKnownUrl);
  u.pathname = u.pathname.replace(/\/[^/]*$/, "") || "/";
  return u.origin + u.pathname;
}
