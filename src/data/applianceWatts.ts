// Common Nigerian household appliance wattage database
export interface ApplianceInfo {
  name: string;
  minWatts: number;
  maxWatts: number;
  avgWatts: number;
  category: "lighting" | "cooling" | "entertainment" | "kitchen" | "laundry" | "other";
  icon: string;
}

export const applianceDatabase: ApplianceInfo[] = [
  // Lighting
  { name: "LED Bulb", minWatts: 5, maxWatts: 15, avgWatts: 10, category: "lighting", icon: "💡" },
  { name: "Energy Saving Bulb", minWatts: 15, maxWatts: 25, avgWatts: 20, category: "lighting", icon: "💡" },
  { name: "Fluorescent Tube", minWatts: 18, maxWatts: 40, avgWatts: 30, category: "lighting", icon: "💡" },
  { name: "Spotlight", minWatts: 20, maxWatts: 50, avgWatts: 35, category: "lighting", icon: "🔦" },

  // Cooling
  { name: "Ceiling Fan", minWatts: 60, maxWatts: 100, avgWatts: 75, category: "cooling", icon: "🌀" },
  { name: "Standing Fan", minWatts: 40, maxWatts: 70, avgWatts: 55, category: "cooling", icon: "🌀" },
  { name: "Table Fan", minWatts: 25, maxWatts: 50, avgWatts: 40, category: "cooling", icon: "🌀" },
  { name: "1HP AC", minWatts: 700, maxWatts: 1200, avgWatts: 900, category: "cooling", icon: "❄️" },
  { name: "1.5HP AC", minWatts: 1100, maxWatts: 1700, avgWatts: 1400, category: "cooling", icon: "❄️" },
  { name: "2HP AC", minWatts: 1500, maxWatts: 2200, avgWatts: 1800, category: "cooling", icon: "❄️" },

  // Entertainment
  { name: "TV (32\")", minWatts: 30, maxWatts: 60, avgWatts: 45, category: "entertainment", icon: "📺" },
  { name: "TV (43\")", minWatts: 50, maxWatts: 90, avgWatts: 70, category: "entertainment", icon: "📺" },
  { name: "TV (55\")", minWatts: 80, maxWatts: 130, avgWatts: 100, category: "entertainment", icon: "📺" },
  { name: "TV (65\"+)", minWatts: 100, maxWatts: 200, avgWatts: 150, category: "entertainment", icon: "📺" },
  { name: "Laptop", minWatts: 30, maxWatts: 80, avgWatts: 50, category: "entertainment", icon: "💻" },
  { name: "Desktop Computer", minWatts: 150, maxWatts: 400, avgWatts: 250, category: "entertainment", icon: "🖥️" },
  { name: "Sound System", minWatts: 50, maxWatts: 200, avgWatts: 100, category: "entertainment", icon: "🔊" },
  { name: "DSTV/Decoder", minWatts: 15, maxWatts: 30, avgWatts: 20, category: "entertainment", icon: "📡" },
  { name: "Gaming Console", minWatts: 100, maxWatts: 250, avgWatts: 150, category: "entertainment", icon: "🎮" },

  // Kitchen
  { name: "Fridge (Single Door)", minWatts: 80, maxWatts: 150, avgWatts: 100, category: "kitchen", icon: "🧊" },
  { name: "Fridge (Double Door)", minWatts: 150, maxWatts: 300, avgWatts: 200, category: "kitchen", icon: "🧊" },
  { name: "Deep Freezer (Small)", minWatts: 100, maxWatts: 200, avgWatts: 150, category: "kitchen", icon: "🧊" },
  { name: "Deep Freezer (Large)", minWatts: 200, maxWatts: 400, avgWatts: 300, category: "kitchen", icon: "🧊" },
  { name: "Microwave", minWatts: 600, maxWatts: 1200, avgWatts: 900, category: "kitchen", icon: "🍲" },
  { name: "Electric Kettle", minWatts: 1000, maxWatts: 2200, avgWatts: 1500, category: "kitchen", icon: "☕" },
  { name: "Blender", minWatts: 200, maxWatts: 500, avgWatts: 350, category: "kitchen", icon: "🥤" },
  { name: "Toaster", minWatts: 700, maxWatts: 1200, avgWatts: 900, category: "kitchen", icon: "🍞" },
  { name: "Rice Cooker", minWatts: 300, maxWatts: 700, avgWatts: 500, category: "kitchen", icon: "🍚" },
  { name: "Electric Cooker/Hot Plate", minWatts: 1000, maxWatts: 2500, avgWatts: 1500, category: "kitchen", icon: "🍳" },

  // Laundry
  { name: "Washing Machine", minWatts: 300, maxWatts: 800, avgWatts: 500, category: "laundry", icon: "👔" },
  { name: "Iron", minWatts: 800, maxWatts: 1500, avgWatts: 1000, category: "laundry", icon: "👕" },
  { name: "Dryer", minWatts: 1800, maxWatts: 3000, avgWatts: 2400, category: "laundry", icon: "👗" },

  // Other
  { name: "Water Pump", minWatts: 370, maxWatts: 1500, avgWatts: 750, category: "other", icon: "🚰" },
  { name: "CCTV System", minWatts: 30, maxWatts: 100, avgWatts: 60, category: "other", icon: "📷" },
  { name: "WiFi Router", minWatts: 5, maxWatts: 20, avgWatts: 12, category: "other", icon: "📶" },
  { name: "Phone Charger", minWatts: 5, maxWatts: 25, avgWatts: 10, category: "other", icon: "📱" },
  { name: "Hair Dryer", minWatts: 800, maxWatts: 2000, avgWatts: 1200, category: "other", icon: "💇" },
  { name: "Electric Heater", minWatts: 1000, maxWatts: 3000, avgWatts: 2000, category: "other", icon: "🔥" },
];

// Fuzzy search for appliance wattage
export function findApplianceWatts(query: string): ApplianceInfo | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Exact match first
  const exact = applianceDatabase.find(a => a.name.toLowerCase() === q);
  if (exact) return exact;

  // Partial match
  const partial = applianceDatabase.find(a => a.name.toLowerCase().includes(q) || q.includes(a.name.toLowerCase()));
  if (partial) return partial;

  // Keyword match
  const keywords: Record<string, string> = {
    "bulb": "LED Bulb", "light": "LED Bulb", "lamp": "LED Bulb",
    "fan": "Ceiling Fan", "ac": "1HP AC", "air con": "1HP AC", "air conditioner": "1HP AC",
    "tv": "TV (43\")", "television": "TV (43\")",
    "fridge": "Fridge (Single Door)", "refrigerator": "Fridge (Double Door)",
    "freezer": "Deep Freezer (Small)", "deep freezer": "Deep Freezer (Small)",
    "laptop": "Laptop", "computer": "Desktop Computer", "pc": "Desktop Computer",
    "pump": "Water Pump", "water": "Water Pump",
    "iron": "Iron", "pressing": "Iron",
    "microwave": "Microwave", "kettle": "Electric Kettle",
    "blender": "Blender", "washing": "Washing Machine",
    "decoder": "DSTV/Decoder", "dstv": "DSTV/Decoder", "gotv": "DSTV/Decoder",
    "router": "WiFi Router", "wifi": "WiFi Router",
    "phone": "Phone Charger", "charger": "Phone Charger",
    "sound": "Sound System", "speaker": "Sound System",
    "toaster": "Toaster", "cooker": "Rice Cooker",
    "hair": "Hair Dryer", "dryer": "Hair Dryer",
    "heater": "Electric Heater",
    "game": "Gaming Console", "xbox": "Gaming Console", "playstation": "Gaming Console", "ps5": "Gaming Console",
  };

  for (const [kw, name] of Object.entries(keywords)) {
    if (q.includes(kw)) {
      return applianceDatabase.find(a => a.name === name) || null;
    }
  }

  return null;
}

// Estimate watts for unknown appliances
export function estimateWatts(name: string): ApplianceInfo {
  return {
    name,
    minWatts: 50,
    maxWatts: 500,
    avgWatts: 200,
    category: "other",
    icon: "⚡",
  };
}

export interface SelectedAppliance {
  name: string;
  quantity: number;
  info: ApplianceInfo;
}

export function calculateTotalWatts(appliances: SelectedAppliance[]): { min: number; max: number; avg: number } {
  return appliances.reduce(
    (acc, a) => ({
      min: acc.min + a.info.minWatts * a.quantity,
      max: acc.max + a.info.maxWatts * a.quantity,
      avg: acc.avg + a.info.avgWatts * a.quantity,
    }),
    { min: 0, max: 0, avg: 0 }
  );
}

export function recommendedInverterSize(avgWatts: number): string {
  if (avgWatts <= 1000) return "1KVA";
  if (avgWatts <= 1500) return "1.5KVA";
  if (avgWatts <= 2500) return "2.5KVA";
  if (avgWatts <= 3500) return "3.5KVA";
  if (avgWatts <= 5000) return "5KVA";
  if (avgWatts <= 7500) return "7.5KVA";
  if (avgWatts <= 10000) return "10KVA";
  if (avgWatts <= 20000) return "20KVA";
  return "30KVA+";
}

export function getBudgetRange(budget: string): { min: number; max: number } {
  switch (budget) {
    case "Below ₦500k": return { min: 0, max: 500000 };
    case "₦500k – ₦1M": return { min: 500000, max: 1000000 };
    case "₦1M – ₦3M": return { min: 1000000, max: 3000000 };
    case "₦3M+": return { min: 3000000, max: Infinity };
    default: return { min: 0, max: Infinity };
  }
}

export function parsePrice(price: string): number | null {
  const match = price.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}
