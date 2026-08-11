import type { Connection } from "./types";

const STORAGE_KEY = "explorer:connections";

export function loadConnections(): Connection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Connection[]) : [];
  } catch {
    return [];
  }
}

export function saveConnections(connections: Connection[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  } catch {
    // QuotaExceededError or storage unavailable
  }
}

export function getConnection(id: string): Connection | undefined {
  return loadConnections().find((c) => c.id === id);
}

export function addConnection(connection: Connection): void {
  const existing = loadConnections().filter((c) => c.id !== connection.id);
  saveConnections([...existing, connection]);
}

export function removeConnection(id: string): void {
  saveConnections(loadConnections().filter((c) => c.id !== id));
}
