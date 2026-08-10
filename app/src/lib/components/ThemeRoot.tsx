import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { ThemeProvider, useTheme } from "@lib/hooks/useTheme.tsx";
import { cn } from "@lib/utils/cn";

interface ThemeRootProps {
  className?: string;
  children: ReactNode;
}

const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer(): HTMLElement | undefined {
  const container = useContext(PortalContainerContext);
  return container ?? undefined;
}

function ThemeRootInner({ className, children }: ThemeRootProps) {
  const { resolvedTheme } = useTheme();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  return (
    <div
      ref={setContainer}
      className={cn(
        "ord-root ord-ui",
        resolvedTheme === "dark" && "dark",
        className,
      )}
    >
      <PortalContainerContext.Provider value={container}>
        {children}
      </PortalContainerContext.Provider>
    </div>
  );
}

export function ThemeRootContent({ className, children }: ThemeRootProps) {
  return <ThemeRootInner className={className}>{children}</ThemeRootInner>;
}

export function ThemeRoot({ className, children }: ThemeRootProps) {
  return (
    <ThemeProvider>
      <ThemeRootInner className={className}>{children}</ThemeRootInner>
    </ThemeProvider>
  );
}
