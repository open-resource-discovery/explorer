import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:net";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { start } from "../dist/proxy.mjs";
import {
  buildMtlsConfig,
  loadCertificateContent,
  MtlsError,
} from "../src/mtls.ts";

let baseUrl;
let stopProxy;

before(async () => {
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", resolve);
  });
  const { port } = reservation.address();
  await new Promise((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve())),
  );
  stopProxy = await start(port);
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await stopProxy?.();
});

async function register(origin, contentType = "application/json") {
  const headers = { "Content-Type": contentType };
  if (origin !== undefined) headers.Origin = origin;
  return fetch(`${baseUrl}/connections/security-test`, {
    method: "POST",
    headers,
    body: JSON.stringify({ cert: "test-certificate", key: "test-key" }),
  });
}

test("compiled proxy starts and serves health", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.equal(typeof body.session, "string");
});

test("allowed local JSON request can register credentials", async () => {
  const response = await register("http://localhost:5173");
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "http://localhost:5173",
  );
});

test("local tooling can register without an Origin header", async () => {
  assert.equal((await register(undefined)).status, 200);
});

test("untrusted origins cannot change credentials", async () => {
  assert.equal((await register("https://untrusted.invalid")).status, 403);
  const response = await fetch(`${baseUrl}/connections/security-test`, {
    method: "DELETE",
    headers: { Origin: "https://untrusted.invalid" },
  });
  assert.equal(response.status, 403);
});

test("public hosted origin cannot register mTLS credentials", async () => {
  assert.equal(
    (await register("https://open-resource-discovery.github.io")).status,
    403,
  );
});

test("plain-text requests cannot smuggle JSON bodies", async () => {
  assert.equal((await register(undefined, "text/plain")).status, 415);
});

test("a MIME parameter cannot turn text/plain into application/json", async () => {
  assert.equal(
    (await register(undefined, "text/plain; marker=application/json")).status,
    415,
  );
});

test("JSON requests may declare a charset", async () => {
  assert.equal(
    (await register(undefined, "application/json; charset=utf-8")).status,
    200,
  );
});

test("preflight accepts local origins and rejects untrusted origins", async () => {
  for (const [origin, status] of [
    ["http://localhost:8080", 204],
    ["https://untrusted.invalid", 403],
  ]) {
    const response = await fetch(`${baseUrl}/fetch`, {
      method: "OPTIONS",
      headers: { Origin: origin },
    });
    assert.equal(response.status, status);
  }
});

const pem = "-----BEGIN CERTIFICATE-----\nYWJj\n-----END CERTIFICATE-----";

test("inline and base64 PEM remain supported for network credentials", () => {
  assert.equal(loadCertificateContent(pem, false), pem);
  assert.equal(
    loadCertificateContent(Buffer.from(pem).toString("base64"), false),
    pem,
  );
});

test("network credentials cannot read an existing certificate file", () => {
  const directory = mkdtempSync(join(tmpdir(), "explorer-mtls-"));
  const certificatePath = join(directory, "test.pem");
  try {
    writeFileSync(certificatePath, pem);
    assert.equal(loadCertificateContent(certificatePath, true), pem);
    assert.throws(
      () => loadCertificateContent(certificatePath, false),
      MtlsError,
    );
    assert.throws(
      () => buildMtlsConfig({ cert: certificatePath, key: pem }, false),
      MtlsError,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("fetch errors do not disclose filesystem paths to clients", async () => {
  const response = await fetch(`${baseUrl}/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      connectionId: "security-test",
      url: "https://untrusted.invalid/",
    }),
  });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "fetch_failed" });
});
