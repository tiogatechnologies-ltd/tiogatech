/**
 * Product names, blog posts and job descriptions are authored in the Supabase
 * admin, where em dashes creep in from pasted copy. The source tree is em-dash
 * free, so normalising on read keeps rendered copy consistent without needing a
 * write migration against every content table.
 */
const EM_DASH = /—/g;

export function normalizeCopy(value: string): string {
  // " — " reads as a separator, so collapse the surrounding spaces into one hyphen.
  return value.replace(/\s*—\s*/g, " - ").replace(EM_DASH, "-");
}

/** Deep-normalises every string in an API payload, leaving other values as-is. */
export function normalizeDeep<T>(input: T): T {
  if (typeof input === "string") return normalizeCopy(input) as unknown as T;
  if (Array.isArray(input)) return input.map((item) => normalizeDeep(item)) as unknown as T;
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      out[key] = normalizeDeep(value);
    }
    return out as T;
  }
  return input;
}
