import { describe, it, expect } from "vitest";
import { classifyPemFile, classifyPemFiles } from "./pemUtils";

// Two distinct PEM certificate blocks for use across tests.
const CERT_BLOCK_1 = `-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAleaf1111111111111111
-----END CERTIFICATE-----`;

const CERT_BLOCK_2 = `-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAintermediate22222222
-----END CERTIFICATE-----`;

const CERT_BLOCK_3 = `-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAroot333333333333333
-----END CERTIFICATE-----`;

const MULTI_CERT_PEM = [CERT_BLOCK_1, CERT_BLOCK_2, CERT_BLOCK_3].join("\n");

function makeFileList(...files: File[]): FileList {
  return {
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
    ...Object.fromEntries(files.map((f, i) => [i, f])),
  } as unknown as FileList;
}

describe("classifyPemFile — single file classification", () => {
  it("recognises PKCS#8 unencrypted private key", () => {
    expect(
      classifyPemFile(
        "-----BEGIN PRIVATE KEY-----\ndata\n-----END PRIVATE KEY-----",
      ),
    ).toBe("private-key");
  });

  it("recognises PKCS#8 encrypted private key", () => {
    expect(
      classifyPemFile(
        "-----BEGIN ENCRYPTED PRIVATE KEY-----\ndata\n-----END ENCRYPTED PRIVATE KEY-----",
      ),
    ).toBe("private-key");
  });

  it("recognises PKCS#1 RSA private key", () => {
    expect(
      classifyPemFile(
        "-----BEGIN RSA PRIVATE KEY-----\ndata\n-----END RSA PRIVATE KEY-----",
      ),
    ).toBe("private-key");
  });

  it("recognises EC private key", () => {
    expect(
      classifyPemFile(
        "-----BEGIN EC PRIVATE KEY-----\ndata\n-----END EC PRIVATE KEY-----",
      ),
    ).toBe("private-key");
  });

  it("recognises a single certificate", () => {
    expect(
      classifyPemFile(
        "-----BEGIN CERTIFICATE-----\ndata\n-----END CERTIFICATE-----",
      ),
    ).toBe("certificate");
  });

  it("recognises a CA bundle (multiple certs)", () => {
    const bundle =
      "-----BEGIN CERTIFICATE-----\na\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nb\n-----END CERTIFICATE-----";
    expect(classifyPemFile(bundle)).toBe("ca-bundle");
  });

  it("returns unknown for unrecognised content", () => {
    expect(classifyPemFile("not a pem file")).toBe("unknown");
  });
});

describe("classifyPemFiles — certificate chain splitting", () => {
  it('splits a multi-cert PEM named "certificate_chain.pem" into cert (first block) and caCert (remaining)', async () => {
    const file = new File([MULTI_CERT_PEM], "certificate_chain.pem", {
      type: "text/plain",
    });
    const result = await classifyPemFiles(makeFileList(file));

    expect(result.cert).toBeDefined();
    expect(result.cert!.content).toBe(CERT_BLOCK_1);

    expect(result.caCert).toBeDefined();
    expect(result.caCert!.content).toBe(
      [CERT_BLOCK_2, CERT_BLOCK_3].join("\n"),
    );

    expect(result.key).toBeUndefined();
    expect(result.unknown).toHaveLength(0);
  });

  it('splits a multi-cert PEM named "fullchain.pem" into cert (first block) and caCert (remaining)', async () => {
    const file = new File([MULTI_CERT_PEM], "fullchain.pem", {
      type: "text/plain",
    });
    const result = await classifyPemFiles(makeFileList(file));

    expect(result.cert).toBeDefined();
    expect(result.cert!.content).toBe(CERT_BLOCK_1);

    expect(result.caCert).toBeDefined();
    expect(result.caCert!.content).toBe(
      [CERT_BLOCK_2, CERT_BLOCK_3].join("\n"),
    );

    expect(result.key).toBeUndefined();
    expect(result.unknown).toHaveLength(0);
  });

  it('treats a multi-cert PEM named "ca-bundle.pem" as a CA bundle without splitting (caCert = full content)', async () => {
    const file = new File([MULTI_CERT_PEM], "ca-bundle.pem", {
      type: "text/plain",
    });
    const result = await classifyPemFiles(makeFileList(file));

    expect(result.caCert).toBeDefined();
    expect(result.caCert!.content).toBe(MULTI_CERT_PEM);

    expect(result.cert).toBeUndefined();
    expect(result.key).toBeUndefined();
    expect(result.unknown).toHaveLength(0);
  });
});
