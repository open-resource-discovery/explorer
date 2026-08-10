import { createContext, useContext } from "react";

export type DefinitionFetchState =
  | { status: "loading" }
  | { status: "done"; content: string }
  | { status: "error" };

export type DefinitionContentMap = Map<string, DefinitionFetchState>;

export const DefinitionContentContext =
  createContext<DefinitionContentMap | null>(null);

export function useDefinitionContent(): DefinitionContentMap {
  const ctx = useContext(DefinitionContentContext);
  if (!ctx)
    throw new Error(
      "useDefinitionContent must be used inside DefinitionContentProvider",
    );
  return ctx;
}
