export type PemFileType =
  "certificate" | "ca-bundle" | "private-key" | "unknown";

export function classifyPemFile(content: string): PemFileType {
  if (
    content.includes("-----BEGIN PRIVATE KEY-----") ||
    content.includes("-----BEGIN ENCRYPTED PRIVATE KEY-----") ||
    content.includes("-----BEGIN RSA PRIVATE KEY-----") ||
    content.includes("-----BEGIN EC PRIVATE KEY-----")
  ) {
    return "private-key";
  }

  const certMatches = (content.match(/-----BEGIN CERTIFICATE-----/g) ?? [])
    .length;
  if (certMatches > 1) return "ca-bundle";
  if (certMatches === 1) return "certificate";

  return "unknown";
}

function looksLikeCaFilename(name: string): boolean {
  return /(?:^|[-_.])ca(?:[-_.]|$)/i.test(name);
}

function looksLikeCertChainFilename(name: string): boolean {
  return /chain/i.test(name);
}

function extractPemBlocks(content: string): string[] {
  const matches =
    content.match(
      /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
    ) ?? [];
  return matches.map((m) => m.trim());
}

export interface PemClassification {
  cert?: { file: File; content: string };
  key?: { file: File; content: string };
  caCert?: { file: File; content: string };
  unknown: File[];
}

export async function classifyPemFiles(
  files: FileList,
): Promise<PemClassification> {
  const result: PemClassification = { unknown: [] };

  const readings = Array.from(files).map(
    (file) =>
      new Promise<{ file: File; content: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({ file, content: reader.result as string });
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      }),
  );

  const read = await Promise.all(readings);

  for (const { file, content } of read) {
    const type = classifyPemFile(content);
    switch (type) {
      case "private-key":
        result.key = { file, content };
        break;
      case "ca-bundle":
        if (looksLikeCertChainFilename(file.name)) {
          const blocks = extractPemBlocks(content);
          result.cert = { file, content: blocks[0] ?? content };
          if (blocks.length > 1) {
            result.caCert = { file, content: blocks.slice(1).join("\n") };
          }
        } else {
          result.caCert = { file, content };
        }
        break;
      case "certificate":
        if (looksLikeCaFilename(file.name)) {
          result.caCert = { file, content };
        } else {
          result.cert = { file, content };
        }
        break;
      default:
        result.unknown.push(file);
    }
  }

  return result;
}
