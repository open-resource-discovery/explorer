import {
  Link,
  Outlet,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@lib/hooks/useTheme";
import { useNavExtension } from "@lib/context/NavExtensionContext";
import { ConnectionDropdown } from "./ConnectionDropdown";
import { PerspectiveDropdown } from "./PerspectiveDropdown";

export function RootLayout() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { id: connectionId, docId } = useParams({ strict: false });

  const inConnections =
    pathname === "/connections" || pathname.startsWith("/connections/");
  const inExplorer = pathname.includes("/documents/");

  const { resolvedTheme, setTheme } = useTheme();
  const { resourceDetailLabel, resetExplorer } = useNavExtension();

  return (
    <div
      className={`ord-root flex h-screen flex-col${resolvedTheme === "dark" ? " dark" : ""}`}
    >
      <header className="flex items-center gap-0 border-b border-border bg-background px-4 py-0">
        {/* Logo */}
        <Link
          to="/connections"
          className="flex items-center gap-2 pr-4 py-3 hover:opacity-80 transition-opacity"
        >
          <img
            src={`${import.meta.env.BASE_URL}ORD_Icon_Color_Logo.svg`}
            alt="ORD Explorer"
            className="h-6 w-6"
          />
          <span className="font-semibold text-foreground">ORD Explorer</span>
        </Link>

        {/* Nav tabs */}
        <nav className="ml-4 flex h-full items-stretch">
          <Link
            to="/connections"
            className={`flex items-center border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              inConnections && !inExplorer
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Connections
          </Link>
          {inExplorer && connectionId && docId && (
            <>
              <ChevronRight className="self-center h-3.5 w-3.5 text-border" />
              <ConnectionDropdown
                currentConnectionId={connectionId}
                currentPerspectiveId={docId}
                onReset={resetExplorer}
                hasResourceDetail={!!resourceDetailLabel}
              />
              <ChevronRight className="self-center h-3.5 w-3.5 text-border" />
              <PerspectiveDropdown
                connectionId={connectionId}
                currentPerspectiveId={docId}
                onReset={resetExplorer}
                hasResourceDetail={!!resourceDetailLabel}
              />
            </>
          )}
          {inExplorer && resourceDetailLabel && (
            <>
              <ChevronRight className="self-center h-3.5 w-3.5 text-border" />
              <span className="flex items-center border-b-2 border-primary px-3 py-3 text-sm font-medium text-primary">
                {resourceDetailLabel}
              </span>
            </>
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right icons */}
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/open-resource-discovery/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </a>
          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle theme"
            className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
