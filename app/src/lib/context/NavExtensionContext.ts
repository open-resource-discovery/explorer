import { createContext, useContext } from "react";

interface NavExtensionContextValue {
  resourceDetailLabel: string | null;
  setResourceDetailLabel: (label: string | null) => void;
  resetExplorer: () => void;
  setResetExplorer: (fn: () => void) => void;
}

export const NavExtensionContext = createContext<NavExtensionContextValue>({
  resourceDetailLabel: null,
  setResourceDetailLabel: () => {},
  resetExplorer: () => {},
  setResetExplorer: () => {},
});

export function useNavExtension(): NavExtensionContextValue {
  return useContext(NavExtensionContext);
}
