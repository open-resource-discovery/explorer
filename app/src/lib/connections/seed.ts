import { loadConnections, saveConnections } from "./store";
import type { Connection } from "./types";

const SAMPLE_CONNECTION_ID = "sample";

export function makeSampleConnection(): Connection {
  return {
    id: SAMPLE_CONNECTION_ID,
    name: "Sample ORD Document",
    baseUrl: window.location.origin,
    documents: [
      {
        id: "sample",
        name: "Sample ORD Document",
        path: "/open-resource-discovery/v1/documents/sample",
      },
    ],
  };
}

export function seedLocalConnectionIfEmpty(): void {
  const existing = loadConnections();
  if (existing.length === 0) {
    saveConnections([makeSampleConnection()]);
  }
}
