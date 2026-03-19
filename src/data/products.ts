export interface Product {
  id: string;
  name: string;
  category: string;
  series?: string;
  features: string[];
  bestFor: string;
  price?: string;
  tier: "premium" | "mid" | "affordable" | "entry";
}

export const smartLockProducts: Product[] = [
  // Elite Series
  { id: "sl-k209", name: "Model K209", category: "smart_locks", series: "Elite Series", features: ["Facial recognition", "Fingerprint access", "WiFi app control", "Video intercom", "Anti-pry alarm"], bestFor: "Premium Homes", tier: "premium" },
  { id: "sl-s7", name: "Model S7", category: "smart_locks", series: "Elite Series", features: ["Facial recognition", "RFID card access", "Fingerprint sensor", "WiFi app control", "Anti-pry alarm"], bestFor: "Luxury Apartments", tier: "premium" },
  // Apex Series
  { id: "sl-d20", name: "Model D20", category: "smart_locks", series: "Apex Series", features: ["Fingerprint access", "RFID card", "PIN code entry", "Anti-pry alarm"], bestFor: "Modern Homes", tier: "mid" },
  { id: "sl-h11", name: "Model H11", category: "smart_locks", series: "Apex Series", features: ["Fingerprint sensor", "WiFi app control", "RFID card", "Auto-lock"], bestFor: "Homes & Offices", tier: "mid" },
  { id: "sl-c11", name: "Model C11", category: "smart_locks", series: "Apex Series", features: ["Fingerprint access", "PIN code", "RFID card", "Low battery alert"], bestFor: "Small Offices", tier: "mid" },
  // Pro Series
  { id: "sl-sl02", name: "SL02", category: "smart_locks", series: "Pro Series", features: ["Fingerprint sensor", "PIN code entry", "Durable build", "Easy install"], bestFor: "Businesses & Hotels", tier: "affordable" },
  { id: "sl-tf5", name: "TF5", category: "smart_locks", series: "Pro Series", features: ["Fingerprint access", "RFID card", "Anti-tamper alarm"], bestFor: "Offices", tier: "affordable" },
  { id: "sl-n22", name: "N22", category: "smart_locks", series: "Pro Series", features: ["PIN code", "RFID card", "Compact design"], bestFor: "Hotels & Hostels", tier: "affordable" },
  { id: "sl-xo4", name: "XO4", category: "smart_locks", series: "Pro Series", features: ["Fingerprint sensor", "Keypad entry", "Robust metal body"], bestFor: "Commercial Use", tier: "affordable" },
  { id: "sl-n14", name: "N14", category: "smart_locks", series: "Pro Series", features: ["PIN code", "RFID card", "Budget-friendly"], bestFor: "Rental Properties", tier: "affordable" },
  // Base Series
  { id: "sl-v80", name: "V80", category: "smart_locks", series: "Base Series", features: ["Fingerprint access", "Portable design", "Battery powered"], bestFor: "Cabinets & Drawers", tier: "entry" },
  { id: "sl-g290", name: "G290", category: "smart_locks", series: "Base Series", features: ["PIN code entry", "Compact size", "Easy installation"], bestFor: "Entry Level", tier: "entry" },
  { id: "sl-kt14", name: "KT14", category: "smart_locks", series: "Base Series", features: ["Fingerprint sensor", "Portable", "USB rechargeable"], bestFor: "Travel & Luggage", tier: "entry" },
];

export const solarProducts: Product[] = [
  // SRNE Top Picks
  { id: "sr-5kw-p", name: "HFP4850S80-145 (5KW Parallel)", category: "solar", series: "SRNE Top Picks", features: ["5KW output", "48V system", "Parallel support", "Hybrid inverter", "MPPT charge controller"], bestFor: "Home Backup", price: "Contact for price", tier: "premium" },
  { id: "sr-5kw", name: "HF4850S80-H (5KW)", category: "solar", series: "SRNE Top Picks", features: ["5KW output", "48V system", "Hybrid inverter", "LCD display", "Built-in MPPT"], bestFor: "Home Backup", price: "Contact for price", tier: "premium" },
  { id: "sr-6kw", name: "HYP4860S100-H (6KW)", category: "solar", series: "SRNE Top Picks", features: ["6KW output", "48V system", "High capacity", "Hybrid design", "Smart monitoring"], bestFor: "Large Homes", price: "Contact for price", tier: "premium" },
  // Mid Range
  { id: "sr-1.5kw", name: "SRNE 1.5KW Inverter", category: "solar", series: "Mid Range", features: ["1.5KW output", "24V system", "Compact size"], bestFor: "Small Loads", tier: "affordable" },
  { id: "sr-3kw", name: "SRNE 3KW Inverter", category: "solar", series: "Mid Range", features: ["3KW output", "24V/48V", "MPPT controller"], bestFor: "Medium Homes", tier: "mid" },
  { id: "sr-3.3kw", name: "SRNE 3.3KW Inverter", category: "solar", series: "Mid Range", features: ["3.3KW output", "48V system", "LCD display"], bestFor: "Medium Homes", tier: "mid" },
  // High Capacity
  { id: "sr-10kw", name: "SRNE 10KW Inverter", category: "solar", series: "High Capacity", features: ["10KW output", "48V system", "Parallel capable", "Commercial grade"], bestFor: "Business Use", price: "Contact for price", tier: "premium" },
  { id: "sr-12kw", name: "SRNE 12KW Inverter", category: "solar", series: "High Capacity", features: ["12KW output", "Heavy load support", "Industrial design"], bestFor: "Heavy Load", price: "Contact for price", tier: "premium" },
  { id: "sr-20kw", name: "SRNE 20KW Inverter", category: "solar", series: "High Capacity", features: ["20KW output", "Three-phase", "Enterprise solution"], bestFor: "Industrial", price: "Contact for price", tier: "premium" },
  // AlpSolarr
  { id: "alp-s2", name: "Pulse S2", category: "solar", series: "AlpSolarr Systems", features: ["Compact energy storage", "Smart monitoring", "Residential use"], bestFor: "Modern Homes", tier: "mid" },
  { id: "alp-s3", name: "Pulse S3", category: "solar", series: "AlpSolarr Systems", features: ["Mid-capacity storage", "App control", "Silent operation"], bestFor: "Modern Homes", tier: "mid" },
  { id: "alp-s4", name: "Pulse S4", category: "solar", series: "AlpSolarr Systems", features: ["High-capacity storage", "Smart inverter", "Efficient design"], bestFor: "Large Homes", tier: "premium" },
  { id: "alp-g2", name: "G2 Series", category: "solar", series: "AlpSolarr Systems", features: ["Next-gen storage", "AI optimization", "Sleek design"], bestFor: "Premium Homes", tier: "premium" },
  // Power Stations
  { id: "itel-ps", name: "Itel Power Station", category: "solar", series: "Power Stations", features: ["Portable power", "Multiple outlets", "USB charging", "LED display"], bestFor: "Portable Use", tier: "entry" },
];

export const smartHomeProducts: Product[] = [
  { id: "sh-8g", name: "8 Gang WiFi Smart Switch", category: "smarthome", features: ["8 gang control", "WiFi enabled", "App control", "Voice assistant compatible"], bestFor: "Large Rooms", tier: "mid" },
  { id: "sh-1g", name: "1 Gang WiFi Smart Switch", category: "smarthome", features: ["Single switch", "WiFi enabled", "Timer function", "Remote control"], bestFor: "Any Room", tier: "entry" },
  { id: "sh-granite", name: "Granite Display Smart Switch", category: "smarthome", features: ["Touch display", "Premium granite finish", "Scene control", "Energy monitoring"], bestFor: "Premium Homes", tier: "premium" },
];

export const cctvProducts: Product[] = [
  { id: "cc-indoor", name: "Indoor Camera", category: "cctv", features: ["1080p HD", "Night vision", "Motion detection", "Two-way audio"], bestFor: "Home & Office", tier: "entry" },
  { id: "cc-outdoor", name: "Outdoor Camera", category: "cctv", features: ["Weatherproof IP66", "1080p HD", "IR night vision", "Motion alerts"], bestFor: "Outdoor Security", tier: "mid" },
  { id: "cc-dome", name: "Dome Camera", category: "cctv", features: ["360° coverage", "Vandal-proof", "HD recording", "Remote viewing"], bestFor: "Offices & Shops", tier: "mid" },
  { id: "cc-bullet", name: "Bullet Camera", category: "cctv", features: ["Long range IR", "1080p HD", "Weatherproof", "Night vision 30m"], bestFor: "Perimeter Security", tier: "affordable" },
];

export type ProductInterest = "solar" | "panels" | "batteries" | "smarthome" | "smartlocks" | "cctv" | "full_solar" | "other";

export function getProductsForInterests(interests: ProductInterest[], budget?: string): Product[] {
  let results: Product[] = [];

  const solarInterests: ProductInterest[] = ["solar", "panels", "batteries", "full_solar"];
  if (interests.some((i) => solarInterests.includes(i))) results.push(...solarProducts);
  if (interests.includes("smartlocks")) results.push(...smartLockProducts);
  if (interests.includes("smarthome")) results.push(...smartHomeProducts);
  if (interests.includes("cctv")) results.push(...cctvProducts);

  // Budget-based sorting
  const tierOrder = getTierOrder(budget);
  results.sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));

  return results;
}

function getTierOrder(budget?: string): Product["tier"][] {
  if (budget === "₦3M+" || budget === "₦1M – ₦3M") {
    return ["premium", "mid", "affordable", "entry"];
  }
  if (budget === "Below ₦500k") {
    return ["entry", "affordable", "mid", "premium"];
  }
  return ["mid", "premium", "affordable", "entry"];
}

export function groupBySeries(products: Product[]): Record<string, Product[]> {
  const groups: Record<string, Product[]> = {};
  for (const p of products) {
    const key = p.series || p.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}
