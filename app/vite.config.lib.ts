import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "."),
  plugins: [react(), tailwindcss()],
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, "src/lib/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    outDir: resolve(__dirname, "../dist/lib"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
    rolldownOptions: {
      external: (id: string) =>
        id === "react" ||
        id === "react-dom" ||
        // avsc (via @asyncapi/parser) calls require('buffer').Buffer. Rolldown stubs
        // Node.js built-ins with {} in browser builds, leaving Buffer undefined at
        // runtime. Externalizing 'buffer' emits a real ESM import in the pre-built
        // lib so the consuming app (e.g. provider-server) can supply the npm polyfill.
        id === "buffer" ||
        id === "util" ||
        id === "events" ||
        id === "stream" ||
        id.startsWith("react/") ||
        id.startsWith("react-dom/") ||
        id.startsWith("use-sync-external-store") ||
        id.includes("/node_modules/react/") ||
        id.includes("/node_modules/react-dom/") ||
        id.includes("/node_modules/use-sync-external-store/"),
      output: {
        interop: "esModule",
      },
    },
  },
  resolve: {
    alias: [
      { find: "@lib", replacement: resolve(__dirname, "./src/lib") },
      // @open-resource-discovery/metadata-renderer imports the pre-built UMD browser
      // bundle of @asyncapi/react-component, which has a CJS require("react") shim.
      // Redirect to the proper ESM entry so rolldown never generates the CJS shim.
      {
        find: "@asyncapi/react-component/browser/index.js",
        replacement: resolve(
          __dirname,
          "../node_modules/@asyncapi/react-component/lib/esm/index.js",
        ),
      },
    ],
  },
});
