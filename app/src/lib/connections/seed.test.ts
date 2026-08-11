import { describe, it, expect, beforeEach, vi } from "vitest";
import { seedLocalConnectionIfEmpty, makeSampleConnection } from "./seed";
import { loadConnections, saveConnections } from "./store";
import type { Connection } from "./types";

const otherConn: Connection = {
  id: "other",
  name: "Other",
  baseUrl: "https://other.example.com",
  documents: [],
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("seedLocalConnectionIfEmpty", () => {
  it("seeds the sample connection when storage is empty", () => {
    seedLocalConnectionIfEmpty();
    expect(loadConnections()).toEqual([makeSampleConnection()]);
  });

  it("does not overwrite existing connections", () => {
    saveConnections([otherConn]);
    seedLocalConnectionIfEmpty();
    expect(loadConnections()).toEqual([otherConn]);
  });
});

describe("makeSampleConnection", () => {
  it("uses window.location.origin as baseUrl", () => {
    const conn = makeSampleConnection();
    expect(conn.baseUrl).toBe(window.location.origin);
  });

  it("points to the static sample document path", () => {
    const conn = makeSampleConnection();
    expect(conn.documents[0]?.path).toBe(
      "/open-resource-discovery/v1/documents/sample",
    );
  });
});
