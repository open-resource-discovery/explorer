import { createContext, useContext } from "react";
import type { OrdDocument } from "@open-resource-discovery/specification";

export const OrdDocumentContext = createContext<OrdDocument | null>(null);

export function useOrdDocument(): OrdDocument {
  const doc = useContext(OrdDocumentContext);
  if (!doc) throw new Error("useOrdDocument must be used inside ORDExplorer");
  return doc;
}
