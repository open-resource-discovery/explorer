import type { Connection } from "./types";

const STORAGE_KEY = "explorer:connections";

function isConnection(obj: unknown): obj is Connection {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === "string" &&
    typeof (obj as Record<string, unknown>).name === "string" &&
    typeof (obj as Record<string, unknown>).ordConfigUrl === "string" &&
    (obj as Record<string, unknown>).type === "system-endpoint"
  );
}

export function getConnections(): Connection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed) ? parsed.filter(isConnection) : [];
  } catch {
    return [];
  }
}

export function saveConnection(connection: Connection): void {
  if (typeof window === "undefined") return;
  const connections = getConnections();
  const index = connections.findIndex((c) => c.id === connection.id);
  if (index !== -1) {
    connections[index] = connection;
  } else {
    connections.push(connection);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
}

export function deleteConnection(id: string): void {
  if (typeof window === "undefined") return;
  const connections = getConnections().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
}

export function getConnection(id: string): Connection | undefined {
  return getConnections().find((c) => c.id === id);
}

export function createConnection(partial: Omit<Connection, "id">): Connection {
  return {
    ...partial,
    id: crypto.randomUUID(),
  };
}
