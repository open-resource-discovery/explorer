export function normalizeTestId(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}
