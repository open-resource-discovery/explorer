import type { OrdDocument } from "@open-resource-discovery/specification";
import { createContext, useContext } from "react";

export const OrdDocumentContext = createContext<OrdDocument | null>(null);

export function useOrdDocument(): OrdDocument {
  const doc = useContext(OrdDocumentContext);
  if (!doc) throw new Error("useOrdDocument must be used inside ORDExplorer");
  return doc;
}
