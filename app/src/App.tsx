import { RouterProvider } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { router } from "./router";
import { ProxyProvider } from "@lib/proxy";
import { ThemeProvider } from "@lib/hooks/useTheme";
import { NavExtensionContext } from "@lib/context/NavExtensionContext";
import "./lib/styles.css";

function App() {
  const [resourceDetailLabel, setResourceDetailLabel] = useState<string | null>(
    null,
  );
  const resetExplorerRef = useRef<() => void>(() => {});
  const setResetExplorer = useCallback((fn: () => void) => {
    resetExplorerRef.current = fn;
  }, []);
  const resetExplorer = useCallback(() => {
    resetExplorerRef.current();
  }, []);

  return (
    <ThemeProvider>
      <ProxyProvider>
        <NavExtensionContext.Provider
          value={{
            resourceDetailLabel,
            setResourceDetailLabel,
            resetExplorer,
            setResetExplorer,
          }}
        >
          <RouterProvider router={router} />
        </NavExtensionContext.Provider>
      </ProxyProvider>
    </ThemeProvider>
  );
}

export default App;
