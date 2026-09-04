import { AuthFailedError, ProxyFetchError } from "./errors";

async function proxyFetch(
  proxyBaseUrl: string,
  connectionId: string,
  url: string,
  headers?: Record<string, string>,
): Promise<Response> {
  const response = await fetch(`${proxyBaseUrl}/fetch`, {
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
  proxyBaseUrl: string,
  connectionId: string,
  url: string,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await proxyFetch(proxyBaseUrl, connectionId, url, headers);
  return (await response.json()) as T;
}

export async function fetchTextViaProxy(
  proxyBaseUrl: string,
  connectionId: string,
  url: string,
  headers?: Record<string, string>,
): Promise<string> {
  const response = await proxyFetch(proxyBaseUrl, connectionId, url, headers);
  return response.text();
}
