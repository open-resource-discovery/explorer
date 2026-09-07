import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { localOrdPlugin } from "./vite-plugins/localOrdPlugin";

export default defineConfig({
  root: resolve(__dirname, "."),
  base: process.env.VITE_BASE ?? "/",
  publicDir: resolve(__dirname, "../public"),
  plugins: [react(), tailwindcss(), localOrdPlugin()],
  server: {
    fs: {
      // Allow serving files from outside the app root (needed when
      // @open-resource-discovery/metadata-renderer resolves via a local symlink in dev).
      allow: [".."],
    },
    proxy: {
      "/proxy-api": {
        target: `http://localhost:${process.env.PROXY_PORT ?? "44123"}`,
        rewrite: (path) => path.replace(/^\/proxy-api/, ""),
      },
    },
  },
  optimizeDeps: {
    // highlight.js language files are CJS modules imported by
    // @asyncapi/react-component. Pre-bundle them so Vite wraps
    // module.exports into a proper ESM default export.
    include: [
      "highlight.js/lib/core",
      "highlight.js/lib/languages/json",
      "highlight.js/lib/languages/yaml",
      "highlight.js/lib/languages/bash",
    ],
  },
  build: {
    outDir: resolve(__dirname, "../dist/app"),
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        // Rolldown 8.1.3+ regression: the chunk-split algorithm merges Vue
        // runtime into the same shared chunk as clsx/floating-ui, creating a
        // circular import with the Scalar icon library chunk. Force Vue runtime
        // into a dedicated leaf chunk so the icon library's Vue imports never
        // land in a chunk that also needs imports from the icon library.
        manualChunks(id: string) {
          if (
            id.includes("/node_modules/vue/") ||
            id.includes("/node_modules/@vue/")
          ) {
            return "vue-runtime";
          }
        },
      },
    },
  },
  resolve: {
    alias: [{ find: "@lib", replacement: resolve(__dirname, "./src/lib") }],
  },
});
