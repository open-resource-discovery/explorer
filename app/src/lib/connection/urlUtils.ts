const ORD_CONFIGURATION_POSTFIX = "/.well-known/open-resource-discovery";

// Bare hostnames get http://, anything else that fails URL parsing gets https://.
// Root paths get the well-known ORD config path appended; non-root paths are kept as-is.
export function parseDestinationUrl(arg: string): string {
  let urlStr = arg;
  if (urlStr.startsWith("localhost") || /^[\w-]+:\d+$/.test(urlStr)) {
    urlStr = `http://${urlStr}`;
  }

  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    try {
      url = new URL(`https://${urlStr}`);
    } catch (error) {
      throw new Error(`Invalid URL: ${arg}`, { cause: error });
    }
  }

  const hasPathname = !(url.pathname === "" || url.pathname === "/");
  if (hasPathname) {
    return url.toString();
  }

  return new URL(ORD_CONFIGURATION_POSTFIX, url).toString();
}
