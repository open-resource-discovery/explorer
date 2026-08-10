import { generate } from "selfsigned";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const certsDir = join(dirname(fileURLToPath(import.meta.url)), "certs");

const notAfter = new Date();
notAfter.setFullYear(notAfter.getFullYear() + 10);

const ca = await generate([{ name: "commonName", value: "Test CA" }], {
  algorithm: "sha256",
  extensions: [{ name: "basicConstraints", cA: true }],
  notAfterDate: notAfter,
});

writeFileSync(join(certsDir, "ca.crt"), ca.cert);
writeFileSync(join(certsDir, "ca.key"), ca.private);

const server = await generate([{ name: "commonName", value: "localhost" }], {
  algorithm: "sha256",
  extensions: [
    { name: "basicConstraints", cA: false },
    {
      name: "subjectAltName",
      altNames: [
        { type: 2, value: "localhost" },
        { type: 7, ip: "127.0.0.1" },
      ],
    },
  ],
  notAfterDate: notAfter,
  ca: { key: ca.private, cert: ca.cert },
});

writeFileSync(join(certsDir, "server.crt"), server.cert);
writeFileSync(join(certsDir, "server.key"), server.private);

const client = await generate([{ name: "commonName", value: "test-client" }], {
  algorithm: "sha256",
  clientCertificate: true,
  extensions: [{ name: "basicConstraints", cA: false }],
  notAfterDate: notAfter,
  ca: { key: ca.private, cert: ca.cert },
});

writeFileSync(join(certsDir, "client.crt"), client.cert);
writeFileSync(join(certsDir, "client.key"), client.private);

// Convenience bundles for UI upload testing
writeFileSync(join(certsDir, "certificate_chain.pem"), client.cert + ca.cert);
writeFileSync(join(certsDir, "private-key.pem"), client.private);

console.log("Generated certs in", certsDir);
console.log("  ca.crt, ca.key");
console.log("  server.crt, server.key");
console.log("  client.crt, client.key");
console.log("  certificate_chain.pem, private-key.pem");
