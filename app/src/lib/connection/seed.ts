import {
  getConnections,
  saveConnection,
  deleteConnection,
  createConnection,
} from "./store";

const SAMPLE_CONNECTION_ID = "sample";

export function seedLocalConnectionIfEmpty(): void {
  if (typeof window === "undefined") return;

  const baseOrigin =
    window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
  const ordConfigUrl = baseOrigin + "/ord-config.json";

  const existing = getConnections();
  const sample = existing.find((c) => c.id === SAMPLE_CONNECTION_ID);
  if (sample) {
    if (sample.ordConfigUrl === ordConfigUrl) return;
    deleteConnection(SAMPLE_CONNECTION_ID);
  }

  const connection = createConnection({
    name: "Sample ORD System",
    ordConfigUrl,
    type: "system-endpoint",
    auth: "none",
  });
  saveConnection({ ...connection, id: SAMPLE_CONNECTION_ID });
}
