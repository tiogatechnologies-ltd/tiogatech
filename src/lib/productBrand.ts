/** Canonical category labels mapped from legacy, lowercase, or snake_case values. */
const CATEGORY_MAP: Record<string, string> = {
  inverter: "Inverters",
  inverters: "Inverters",
  battery: "Batteries",
  batteries: "Batteries",
  solar_panel: "Solar Panels",
  solar_panels: "Solar Panels",
  "solar panels": "Solar Panels",
  "solar panel": "Solar Panels",
  solar: "Inverters", // Fallback for old solar rows if not refined by name
  smart_lock: "Smart Locks",
  smart_locks: "Smart Locks",
  "smart locks": "Smart Locks",
  smartlock: "Smart Locks",
  smartlocks: "Smart Locks",
  home_automation: "Home Automation",
  "home automation": "Home Automation",
  smarthome: "Home Automation",
  smart_home: "Home Automation",
  cctv: "CCTV",
};

/** Normalizes a product's category to the current display label, folding in legacy values and disambiguating vague names. */
export function normalizeCategory(category: string | null | undefined, name?: string): string {
  const c = (category || "").trim().toLowerCase().replace(/\s+/g, "_");
  const n = (name || "").toLowerCase();

  // If category is generic/vague or legacy 'solar', disambiguate using the product name
  if (c === "solar" || !c) {
    if (n.includes("battery") || n.includes("lifepo4") || n.includes("kwh") || n.includes("felicity")) {
      return "Batteries";
    }
    if (n.includes("panel") || n.includes("longi") || n.includes("jinko") || n.includes("ja solar") || n.includes("mono perc")) {
      return "Solar Panels";
    }
    if (n.includes("inverter") || n.includes("deye") || n.includes("srne") || n.includes("hybrid")) {
      return "Inverters";
    }
  }

  return CATEGORY_MAP[c] || CATEGORY_MAP[category?.trim().toLowerCase() || ""] || category?.trim() || "Inverters";
}

/** Best-effort brand inference for products that don't have an explicit `brand` field. */
export function inferBrand(name: string, category: string | null | undefined): string {
  const n = name || "";
  if (n.includes("SRNE")) return "SRNE";
  if (n.includes("Deye")) return "Deye";
  if (n.includes("Felicity")) return "Felicity";
  if (n.includes("Longi")) return "Longi";
  if (n.includes("JA Solar") || n.includes("JA ")) return "JA Solar";
  if (n.includes("Jinko")) return "Jinko";
  if (normalizeCategory(category).includes("Lock")) return "STAMA";
  return "Tioga";
}
