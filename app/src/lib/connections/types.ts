export interface OrdDocument {
  id: string;
  name: string;
  path: string;
}

export interface Connection {
  id: string;
  name: string;
  baseUrl: string;
  documents: OrdDocument[];
}
