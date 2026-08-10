import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "."),
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: [
        "src/lib/index.ts",
        "src/lib/data/**",
        "src/lib/components/explorer/pages/**",
        "src/lib/components/auth/**",
        "src/lib/components/ThemeRoot.tsx",
        "src/lib/components/explorer/ORDExplorer.tsx",
        "src/lib/components/explorer/ExplorerSidebar.tsx",
        "src/lib/components/explorer/explorerTypes.ts",
        "src/lib/components/explorer/resourceTypeConfig.tsx",
        "src/lib/components/explorer/useNavState.ts",
        // Context wiring and fetch orchestration — covered by e2e, not unit tests
        "src/lib/context/DefinitionContentContext.ts",
        "src/lib/context/DefinitionContentProvider.tsx",
        // Network/IO code — covered by e2e tests, not unit tests
        "src/lib/fetcher/**",
        "src/lib/proxy/**",
        "src/lib/connection/**",
        "src/lib/hooks/useOrdDocument.ts",
        "src/pages/**",
      ],
      thresholds: { statements: 80, branches: 75 },
    },
  },
  resolve: {
    alias: {
      "@lib": resolve(__dirname, "./src/lib"),
    },
  },
});
