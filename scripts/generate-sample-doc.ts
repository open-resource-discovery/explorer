/**
 * Generates public/open-resource-discovery/v1/documents/sample from
 * app/src/lib/data/sampleOrdDocument.ts. Run before every production build
 * so the static file served by GH Pages stays in sync with the TS source.
 *
 * Usage: node --experimental-strip-types scripts/generate-sample-doc.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// The TS alias @open-resource-discovery/specification is resolved by vite at
// app build time. For this script we resolve the same package from node_modules.
// We only need the type, not the runtime value, so a plain dynamic import works.
const { sampleOrdDocument } =
  await import("../app/src/lib/data/sampleOrdDocument.ts");
const { sampleOrdDocumentOperator } =
  await import("../app/src/lib/data/sampleOrdDocumentOperator.ts");

const outDir = resolve(root, "public/open-resource-discovery/v1/documents");
mkdirSync(outDir, { recursive: true });

const outPath = resolve(outDir, "sample");
writeFileSync(outPath, JSON.stringify(sampleOrdDocument, null, 2) + "\n");
console.log(`wrote ${outPath}`);

const outPathOperator = resolve(outDir, "sample-operator");
writeFileSync(
  outPathOperator,
  JSON.stringify(sampleOrdDocumentOperator, null, 2) + "\n",
);
console.log(`wrote ${outPathOperator}`);
