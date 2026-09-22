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
  "smart_lighting_&_track": "Smart Lighting & Track",
  "smart_lighting": "Smart Lighting & Track",
  lighting: "Smart Lighting & Track",
  lights: "Smart Lighting & Track",
  street_light: "Solar Street Lights",
  street_lights: "Solar Street Lights",
  solar_street_light: "Solar Street Lights",
  solar_street_lights: "Solar Street Lights",
  "solar street lights": "Solar Street Lights",
  "solar street light": "Solar Street Lights",
  "smart lighting & track": "Smart Lighting & Track",
  commercial_ess: "Commercial ESS",
  "commercial ess": "Commercial ESS",
  ess: "Commercial ESS",
  charge_controller: "Charge Controllers",
  charge_controllers: "Charge Controllers",
  "charge controllers": "Charge Controllers",
  "charge controller": "Charge Controllers",
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
    if (n.includes("inverter") || n.includes("deye") || n.includes("srne") || n.includes("solis") || n.includes("hybrid")) {
      return "Inverters";
    }
  }

  return CATEGORY_MAP[c] || CATEGORY_MAP[category?.trim().toLowerCase() || ""] || category?.trim() || "Inverters";
}

/** Best-effort brand inference for products that don't have an explicit `brand` field. */
export function inferBrand(name: string, category: string | null | undefined): string {
  const n = name || "";
  if (n.includes("SRNE")) return "SRNE";
  if (n.includes("Luxpower") || n.includes("LXP") || n.includes("SNA") || n.includes("Geta") || n.includes("PGEM") || n.includes("PSHIELD") || n.includes("PSTACK") || n.includes("ECO Beast") || n.includes("TriP") || n.includes("TRIP")) return "Luxpower";
  if (n.includes("Deye")) return "Deye";
  if (n.includes("Felicity") || n.startsWith("FL-") || n.startsWith("IVGM") || n.startsWith("IVEM") || n.startsWith("IVPS") || n.startsWith("IVPM") || n.startsWith("IVAM") || n.startsWith("IVBM") || n.startsWith("LPBF") || n.startsWith("FLA") || n.startsWith("FLH") || n.startsWith("HOPE") || n.startsWith("AI100") || n.startsWith("SCCM") || n.startsWith("BTCB") || n.startsWith("FSPD") || n.startsWith("T-REX")) return "Felicity";
  if (n.includes("AlpSolarr") || n.includes("Alpsolar") || n.startsWith("ALP-") || n.includes("Pulse S") || n.includes("ROSA G2") || n.includes("ROSA T2") || n.includes("Livo-") || n.includes("Livo 16") || n.includes("PowerGoo")) return "AlpSolarr";
  if (n.includes("Taico") || n.startsWith("TAI-")) return "Taico";
  if (n.includes("Dawnice") || n.startsWith("DAW-")) return "Dawnice";
  if (n.includes("Solis") || n.startsWith("SOLIS-") || n.startsWith("S6-")) return "Solis";
  if (n.includes("SolarPro") || n.includes("Solarpro") || n.startsWith("SOLARPRO-")) return "SolarPro";
  if (n.includes("Infinisolar") || n.includes("InfiniSolar") || n.startsWith("INFINI-")) return "Infinisolar";
  if (n.includes("Longi")) return "Longi";
  if (n.includes("JA Solar") || n.includes("JA ")) return "JA Solar";
  if (n.includes("Jinko")) return "Jinko";
  if (normalizeCategory(category).includes("Lock")) return "Tioga Smart";
  return "Tioga";
}


