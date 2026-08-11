import { PROXY_BASE_URL } from "./ProxyContext";
import { AuthFailedError, ProxyFetchError } from "./errors";

async function proxyFetch(
  connectionId: string,
  url: string,
  headers?: Record<string, string>,
): Promise<Response> {
  const response = await fetch(`${PROXY_BASE_URL}/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      connectionId,
      url,
      ...(headers ? { headers } : {}),
    }),
  });

  if (!response.ok) {
    let body: { message?: string; error?: string; cause?: string } = {};
    try {
      body = (await response.json()) as typeof body;
    } catch {
      // ignore parse errors
    }

    if (response.status === 401 || response.status === 403) {
      throw new AuthFailedError(response.status, url);
    }

    const msg = body.message ?? body.error ?? "";
    const detail = body.cause ? `${msg}: ${body.cause}` : msg;
    throw new ProxyFetchError(response.status, url, detail);
  }

  return response;
}

export async function fetchViaProxy<T>(
  connectionId: string,
  url: string,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await proxyFetch(connectionId, url, headers);
  return (await response.json()) as T;
}

export async function fetchTextViaProxy(
  connectionId: string,
  url: string,
  headers?: Record<string, string>,
): Promise<string> {
  const response = await proxyFetch(connectionId, url, headers);
  return response.text();
}
