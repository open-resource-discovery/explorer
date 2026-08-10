import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePerspectives } from "./usePerspectives";
import type { Connection } from "@lib/connection/types";

const mockFetchOrdConfiguration = vi.fn();
const mockExtractPerspectives = vi.fn();
const mockGetFetchUrl = vi.fn((baseUrl: string, url: string) =>
  url.startsWith("http") ? url : `${baseUrl}/${url}`,
);

vi.mock("@lib/fetcher", () => ({
  fetchOrdConfiguration: (...args: unknown[]) =>
    mockFetchOrdConfiguration(...args),
  extractPerspectives: (...args: unknown[]) => mockExtractPerspectives(...args),
  getFetchUrl: (baseUrl: string, url: string) => mockGetFetchUrl(baseUrl, url),
  getBaseUrl: (wellKnownUrl: string, configBaseUrl?: string) =>
    configBaseUrl ??
    wellKnownUrl.replace("/.well-known/open-resource-discovery", ""),
}));

const BASE_CONNECTION: Connection = {
  id: "c1",
  name: "Test",
  ordConfigUrl: "https://example.com/.well-known/open-resource-discovery",
  type: "system-endpoint",
  auth: "none",
};

const SAMPLE_CONFIG = {
  openResourceDiscoveryV1: {
    documents: [
      { url: "ord/v1/documents/main", perspective: "system-instance" },
    ],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockExtractPerspectives.mockReturnValue(["system-instance"]);
});

describe("usePerspectives", () => {
  it("starts in loading state", () => {
    mockFetchOrdConfiguration.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePerspectives(BASE_CONNECTION));
    const [state] = result.current;
    expect(state.status).toBe("loading");
  });

  it("transitions to ready with resolved perspectives", async () => {
    mockFetchOrdConfiguration.mockResolvedValue(SAMPLE_CONFIG);
    const { result } = renderHook(() => usePerspectives(BASE_CONNECTION));

    await waitFor(() => expect(result.current[0].status).toBe("ready"));

    const [state] = result.current;
    if (state.status !== "ready") throw new Error("unreachable");
    expect(state.perspectives).toHaveLength(1);
    expect(state.perspectives[0].id).toBe("system-instance");
    expect(state.perspectives[0].documents).toHaveLength(1);
    expect(state.fetchedAt).toBeInstanceOf(Date);
  });

  it("transitions to error when fetch fails", async () => {
    mockFetchOrdConfiguration.mockRejectedValue(new Error("HTTP 404"));
    const { result } = renderHook(() => usePerspectives(BASE_CONNECTION));

    await waitFor(() => expect(result.current[0].status).toBe("error"));

    const [state] = result.current;
    if (state.status !== "error") throw new Error("unreachable");
    expect(state.error).toBe("HTTP 404");
  });

  it("re-fetches when retry is called", async () => {
    mockFetchOrdConfiguration.mockResolvedValue(SAMPLE_CONFIG);
    const { result } = renderHook(() => usePerspectives(BASE_CONNECTION));

    await waitFor(() => expect(result.current[0].status).toBe("ready"));
    expect(mockFetchOrdConfiguration).toHaveBeenCalledTimes(1);

    const [, retry] = result.current;
    retry();
    await waitFor(() =>
      expect(mockFetchOrdConfiguration).toHaveBeenCalledTimes(2),
    );
  });

  it("sends bearer token in auth header", async () => {
    mockFetchOrdConfiguration.mockResolvedValue(SAMPLE_CONFIG);
    const conn: Connection = {
      ...BASE_CONNECTION,
      auth: "bearer",
      bearerToken: "tok123",
    };
    renderHook(() => usePerspectives(conn));

    await waitFor(() => expect(mockFetchOrdConfiguration).toHaveBeenCalled());
    const headers: Headers = mockFetchOrdConfiguration.mock.calls[0][1];
    expect(headers.get("Authorization")).toBe("Bearer tok123");
  });
});
