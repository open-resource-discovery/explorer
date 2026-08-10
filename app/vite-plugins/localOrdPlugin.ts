import type { Plugin } from "vite";
import { sampleOrdDocument } from "../src/lib/data/sampleOrdDocument";
import { sampleOrdDocumentOperator } from "../src/lib/data/sampleOrdDocumentOperator";

export function localOrdPlugin(): Plugin {
  return {
    name: "local-ord",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/ord-config.json") {
          const body = JSON.stringify({
            openResourceDiscoveryV1: {
              documents: [
                {
                  url: "open-resource-discovery/v1/documents/sample",
                  perspective: "system-instance",
                  accessStrategies: [{ type: "open" }],
                },
                {
                  url: "open-resource-discovery/v1/documents/sample-operator",
                  perspective: "operator",
                  accessStrategies: [{ type: "open" }],
                },
              ],
            },
          });
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(body);
          return;
        }

        if (req.url === "/open-resource-discovery/v1/documents/sample") {
          const body = JSON.stringify(sampleOrdDocument);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(body);
          return;
        }

        if (
          req.url === "/open-resource-discovery/v1/documents/sample-operator"
        ) {
          const body = JSON.stringify(sampleOrdDocumentOperator);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(body);
          return;
        }

        next();
      });
    },
  };
}
