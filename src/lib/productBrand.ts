/** Legacy snake_case category values (from older DB rows) mapped to their current display labels. */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  solar: "Inverters",
  smart_lock: "Smart Locks",
  smart_locks: "Smart Locks",
  home_automation: "Home Automation",
  smarthome: "Home Automation",
  cctv: "CCTV",
};

/** Normalizes a product's category to the current display label, folding in legacy values. */
export function normalizeCategory(category: string | null | undefined): string {
  const c = (category || "").trim();
  return LEGACY_CATEGORY_MAP[c.toLowerCase()] || c;
}

/** Best-effort brand inference for products that don't have an explicit `brand` field. */
export function inferBrand(name: string, category: string | null | undefined): string {
  const n = name || "";
  if (n.includes("Deye")) return "Deye";
  if (n.includes("Felicity")) return "Felicity";
  if (n.includes("Longi")) return "Longi";
  if (normalizeCategory(category).includes("Lock")) return "STAMA";
  return "Tioga";
}
