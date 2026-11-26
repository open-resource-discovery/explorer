import type { Plugin } from "vite";

const vendorStyles = [
  "/@open-resource-discovery/ui-components/dist/ui-components.css",
  "/@open-resource-discovery/metadata-renderer/dist/index.css",
];

// Vendor entry points can import their CSS through JavaScript as well as the
// explicit imports in styles.css. Put both paths in the same cascade layer so
// an automatically imported preflight cannot override Explorer utilities.
export function layerOrdStylesPlugin(): Plugin {
  return {
    name: "explorer-layer-ord-styles",
    enforce: "pre",
    transform(source, id) {
      const path = id.split("?", 1)[0].replaceAll("\\", "/");
      if (!vendorStyles.some((suffix) => path.endsWith(suffix))) return;
      return {
        code: `@layer theme, base, components, utilities;\n@layer components {\n${source}\n}`,
        map: null,
      };
    },
  };
}
