import { createServer } from "node:https";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const devDir = dirname(fileURLToPath(import.meta.url));
const certsDir = join(devDir, "certs");
const repoRoot = join(devDir, "..", "..", "public");

const PORT = 44124;

const ca = readFileSync(join(certsDir, "ca.crt"));
const cert = readFileSync(join(certsDir, "server.crt"));
const key = readFileSync(join(certsDir, "server.key"));

const wellKnown = readFileSync(
  join(repoRoot, ".well-known", "open-resource-discovery"),
  "utf-8",
);
const ordDocument = readFileSync(
  join(repoRoot, "open-resource-discovery", "v1", "documents", "sample"),
  "utf-8",
);

const server = createServer(
  {
    cert,
    key,
    ca,
    requestCert: true,
    rejectUnauthorized: true,
  },
  (req, res) => {
    const url = req.url ?? "/";
    console.log(`[mtls-server] ${req.method} ${url}`);

    if (url === "/.well-known/open-resource-discovery") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(wellKnown);
      return;
    }

    if (url === "/open-resource-discovery/v1/documents/sample") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(ordDocument);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  },
);

server.listen(PORT, () => {
  console.log(`[mtls-server] Listening on https://localhost:${PORT}`);
  console.log(`[mtls-server] Full mTLS enforced — client cert required`);
  console.log(`[mtls-server] Add a connection in the app:`);
  console.log(`[mtls-server]   Base URL: https://localhost:${PORT}`);
  console.log(`[mtls-server]   Auth: mTLS`);
  console.log(`[mtls-server]   Client cert: dev/certs/client.crt`);
  console.log(`[mtls-server]   Client key:  dev/certs/client.key`);
  console.log(`[mtls-server]   CA bundle:   dev/certs/ca.crt`);
});
