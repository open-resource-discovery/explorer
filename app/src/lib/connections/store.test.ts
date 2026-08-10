import { describe, it, expect, beforeEach } from "vitest";
import {
  loadConnections,
  saveConnections,
  getConnection,
  addConnection,
  removeConnection,
} from "./store";
import type { Connection } from "./types";

const conn1: Connection = {
  id: "a1",
  name: "Conn A",
  baseUrl: "https://a.example.com",
  documents: [{ id: "doc1", name: "Doc 1", path: "/ord/v1/docs/doc1" }],
};

const conn2: Connection = {
  id: "b2",
  name: "Conn B",
  baseUrl: "https://b.example.com",
  documents: [],
};

beforeEach(() => {
  localStorage.clear();
});

describe("loadConnections", () => {
  it("returns empty array when storage is empty", () => {
    expect(loadConnections()).toEqual([]);
  });

  it("returns parsed connections from storage", () => {
    localStorage.setItem("explorer:connections", JSON.stringify([conn1]));
    expect(loadConnections()).toEqual([conn1]);
  });

  it("returns empty array when storage contains invalid JSON", () => {
    localStorage.setItem("explorer:connections", "not-json");
    expect(loadConnections()).toEqual([]);
  });
});

describe("saveConnections / loadConnections round-trip", () => {
  it("persists and retrieves multiple connections", () => {
    saveConnections([conn1, conn2]);
    expect(loadConnections()).toEqual([conn1, conn2]);
  });
});

describe("getConnection", () => {
  it("returns the matching connection", () => {
    saveConnections([conn1, conn2]);
    expect(getConnection("a1")).toEqual(conn1);
  });

  it("returns undefined for an unknown id", () => {
    saveConnections([conn1]);
    expect(getConnection("unknown")).toBeUndefined();
  });
});

describe("addConnection", () => {
  it("appends a new connection", () => {
    saveConnections([conn1]);
    addConnection(conn2);
    expect(loadConnections()).toEqual([conn1, conn2]);
  });

  it("replaces an existing connection with the same id", () => {
    saveConnections([conn1]);
    const updated = { ...conn1, name: "Updated" };
    addConnection(updated);
    const all = loadConnections();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Updated");
  });
});

describe("removeConnection", () => {
  it("removes the connection with the given id", () => {
    saveConnections([conn1, conn2]);
    removeConnection("a1");
    expect(loadConnections()).toEqual([conn2]);
  });

  it("is a no-op for an unknown id", () => {
    saveConnections([conn1]);
    removeConnection("unknown");
    expect(loadConnections()).toEqual([conn1]);
  });
});
