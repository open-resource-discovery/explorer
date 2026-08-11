import { createContext, useContext } from "react";

export const ConnectionIdContext = createContext<string>("");

export function useConnectionId(): string {
  return useContext(ConnectionIdContext);
}
