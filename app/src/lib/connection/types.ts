export type AuthType = "none" | "bearer" | "mtls";

export interface PerspectiveDocument {
  url: string;
  title?: string;
}

export interface Perspective {
  id: string;
  label?: string;
  documents: PerspectiveDocument[];
}

export interface Connection {
  id: string; // UUID
  name: string;
  ordConfigUrl: string;
  type: "system-endpoint";
  auth: AuthType;
  bearerToken?: string; // only if auth === "bearer"
  prefetchDefinitions?: boolean;
}
