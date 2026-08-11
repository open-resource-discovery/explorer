export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}
