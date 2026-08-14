export interface Product {
  id: string;
  name: string;
  category: string;
  series?: string;
  description: string;
  features: string[];
  bestFor: string;
  price?: string;
  tier: "premium" | "mid" | "affordable" | "entry";
}

export const smartLockProducts: Product[] = [
  { id: "sl-k209", name: "Model K209", category: "smart_locks", series: "Elite Series", description: "Flagship smart lock for premium homes with facial recognition, palm-vein authentication, video intercom, and weather-ready protection.", features: ["Facial recognition entry", "Palm-vein authentication", "Fingerprint access for up to 100 users", "Wi-Fi app control", "Built-in video intercom viewer"], bestFor: "Premium homes", price: "Price on request", tier: "premium" },
  { id: "sl-s7", name: "Model S7", category: "smart_locks", series: "Elite Series", description: "Custom Israeli lock edition designed for executive apartments and premium shortlets that need elegant access control.", features: ["Facial recognition entry", "Fingerprint access for up to 100 users", "RFID card access for up to 50 cards", "Secure passcode entry", "IP66 waterproof performance"], bestFor: "Executive apartments & premium shortlets", price: "Price on request", tier: "premium" },
  { id: "sl-d20", name: "Model D20", category: "smart_locks", series: "Apex Series", description: "Reliable smart security for homes and apartments seeking advanced access without moving into the highest price tier.", features: ["Facial recognition entry", "Fingerprint access for up to 100 users", "RFID card access", "Wi-Fi app control", "Remote control access"], bestFor: "Homes & apartments", price: "Price on request", tier: "mid" },
  { id: "sl-h11", name: "Model H11", category: "smart_locks", series: "Apex Series", description: "Balanced smart lock for modern residential and mixed-use spaces with strong day-to-day convenience and access logging.", features: ["Facial recognition", "Fingerprint access for up to 100 users", "RFID card access for up to 50 cards", "Mobile app control", "Video intercom viewer"], bestFor: "Modern homes & lounges", price: "Price on request", tier: "mid" },
  { id: "sl-c11", name: "Model C11", category: "smart_locks", series: "Apex Series", description: "Practical smart entry model for rental apartments and commercial spaces that need durable, connected access control.", features: ["Facial recognition", "Passcode entry", "RFID card access", "Integrated doorbell", "Entry record & access logs"], bestFor: "Rental apartments & private commercial spaces", price: "Price on request", tier: "mid" },
  { id: "sl-sl02", name: "SL02", category: "smart_locks", series: "Pro Series", description: "Slim-profile smart lock for aluminum and wooden doors with strong security performance and staff attendance support.", features: ["Fingerprint access for up to 50 users", "RFID card access for up to 50 cards", "Wi-Fi & TTL mobile app control", "Built-in security camera", "Time attendance for staff"], bestFor: "Homes, offices & hotels", price: "Price on request", tier: "affordable" },
  { id: "sl-tf5", name: "TF5", category: "smart_locks", series: "Pro Series", description: "Affordable connected smart lock that supports remote access workflows for homes, offices, shortlets, and hotel setups.", features: ["Fingerprint access for up to 50 users", "RFID card access for up to 50 cards", "BLE mobile app control", "Remote control", "Time attendance for staff"], bestFor: "Residential apartments, offices & shortlets", price: "Price on request", tier: "affordable" },
  { id: "sl-n22", name: "N22", category: "smart_locks", series: "Pro Series", description: "Accessible smart security model with Wi-Fi control and dependable battery-powered access for everyday residential use.", features: ["Fingerprint access for up to 100 users", "RFID card access for up to 50 cards", "Secure passcode entry", "Wi-Fi mobile app control", "Entry record & access logs"], bestFor: "Homes & hospitality spaces", price: "Price on request", tier: "affordable" },
  { id: "sl-n14", name: "N14", category: "smart_locks", series: "Pro Series", description: "Business-friendly entry model for offices, retail stores, and hospitality operators that need reliable smart access at a lower entry point.", features: ["Fingerprint access for up to 50 users", "RFID card access for up to 50 cards", "BLE mobile app control", "Optional remote control", "Time attendance for staff"], bestFor: "Offices, retail stores & hotels", price: "Price on request", tier: "affordable" },
  { id: "sl-v80", name: "V80", category: "smart_locks", series: "Base Series", description: "Compact smart security option for conventional doors and gates with accessible biometric and app-based entry.", features: ["Fingerprint access for up to 100 fingerprints", "Card access for up to 50 cards", "Passcode entry", "Mobile app control", "Remote control access"], bestFor: "Conventional doors & gates", price: "Price on request", tier: "entry" },
  { id: "sl-g290", name: "G290", category: "smart_locks", series: "Base Series", description: "Everyday smart lock engineered for modern homes and office glass doors with a clean form factor and practical controls.", features: ["Fingerprint access", "Card access", "Mechanical key access", "Access record query", "Doorbell function"], bestFor: "Homes & office glass doors", price: "Price on request", tier: "entry" },
  { id: "sl-kt14", name: "KT14", category: "smart_locks", series: "Base Series", description: "Portable biometric security lock for flexible deployments where rugged waterproof durability matters.", features: ["Fingerprint access for up to 50 users", "Bluetooth app control", "Mechanical override key", "IP67 waterproof protection", "Time attendance logs"], bestFor: "Warehouses, gates & storage units", price: "Price on request", tier: "entry" },
  { id: "sl-hotel-suite", name: "Smart Hotel Ecosystem", category: "smart_locks", series: "Hotel Management Suite", description: "Connected hotel access ecosystem combining locks, gateway, cards, encoder, app, and dashboard for digital guest management.", features: ["Centralized guest access control", "Remote check-in with digital keys", "Real-time access log monitoring", "RFID cards and card encoder", "Optional energy-saving switch"], bestFor: "Hotels, guest houses & serviced apartments", price: "Custom deployment quote", tier: "premium" },
];

export const solarProducts: Product[] = [
  { id: "sr-5kw-p", name: "HFP4850S80-145 (5KW Parallel)", category: "solar", series: "SRNE Top Picks", description: "Premium parallel-ready hybrid inverter for dependable residential backup and scalable energy systems.", features: ["5KW output", "48V system", "Parallel support", "Hybrid inverter", "MPPT charge controller"], bestFor: "Home backup", price: "Contact for price", tier: "premium" },
  { id: "sr-5kw", name: "HF4850S80-H (5KW)", category: "solar", series: "SRNE Top Picks", description: "Versatile 5KW hybrid inverter with onboard monitoring features for stable home power support.", features: ["5KW output", "48V system", "Hybrid inverter", "LCD display", "Built-in MPPT"], bestFor: "Home backup", price: "Contact for price", tier: "premium" },
  { id: "sr-6kw", name: "HYP4860S100-H (6KW)", category: "solar", series: "SRNE Top Picks", description: "High-performance hybrid inverter built for larger homes and heavier daily demand.", features: ["6KW output", "48V system", "High capacity", "Hybrid design", "Smart monitoring"], bestFor: "Large homes", price: "Contact for price", tier: "premium" },
  { id: "sr-1.5kw", name: "SRNE 1.5KW Inverter", category: "solar", series: "Mid Range", description: "Compact inverter for light everyday loads and budget-conscious backup setups.", features: ["1.5KW output", "24V system", "Compact size"], bestFor: "Small loads", price: "Contact for price", tier: "affordable" },
  { id: "sr-3kw", name: "SRNE 3KW Inverter", category: "solar", series: "Mid Range", description: "Well-balanced inverter option for homes that want better backup capacity without going fully premium.", features: ["3KW output", "24V/48V", "MPPT controller"], bestFor: "Medium homes", price: "Contact for price", tier: "mid" },
  { id: "sr-3.3kw", name: "SRNE 3.3KW Inverter", category: "solar", series: "Mid Range", description: "Improved mid-range inverter with a 48V system and clear monitoring display.", features: ["3.3KW output", "48V system", "LCD display"], bestFor: "Medium homes", price: "Contact for price", tier: "mid" },
  { id: "sr-10kw", name: "SRNE 10KW Inverter", category: "solar", series: "High Capacity", description: "Commercial-grade inverter for business operations and heavy residential usage.", features: ["10KW output", "48V system", "Parallel capable", "Commercial grade"], bestFor: "Business use", price: "Contact for price", tier: "premium" },
  { id: "sr-12kw", name: "SRNE 12KW Inverter", category: "solar", series: "High Capacity", description: "Heavy-load inverter for demanding installations that need more headroom and reliability.", features: ["12KW output", "Heavy load support", "Industrial design"], bestFor: "Heavy load", price: "Contact for price", tier: "premium" },
  { id: "sr-20kw", name: "SRNE 20KW Inverter", category: "solar", series: "High Capacity", description: "Enterprise-oriented three-phase power solution for industrial environments and large sites.", features: ["20KW output", "Three-phase", "Enterprise solution"], bestFor: "Industrial", price: "Contact for price", tier: "premium" },
  { id: "alp-s2", name: "Pulse S2", category: "solar", series: "AlpSolarr Systems", description: "Compact residential energy storage unit built for efficient everyday smart-home backup.", features: ["Compact energy storage", "Smart monitoring", "Residential use"], bestFor: "Modern homes", price: "Contact for price", tier: "mid" },
  { id: "alp-s3", name: "Pulse S3", category: "solar", series: "AlpSolarr Systems", description: "Mid-capacity home storage system with quiet performance and app-connected control.", features: ["Mid-capacity storage", "App control", "Silent operation"], bestFor: "Modern homes", price: "Contact for price", tier: "mid" },
  { id: "alp-s4", name: "Pulse S4", category: "solar", series: "AlpSolarr Systems", description: "High-capacity smart storage solution for larger homes that need stronger backup coverage.", features: ["High-capacity storage", "Smart inverter", "Efficient design"], bestFor: "Large homes", price: "Contact for price", tier: "premium" },
  { id: "alp-g2", name: "G2 Series", category: "solar", series: "AlpSolarr Systems", description: "Premium residential energy platform with AI optimization and a sleek integrated design.", features: ["Next-gen storage", "AI optimization", "Sleek design"], bestFor: "Premium homes", price: "Contact for price", tier: "premium" },
  { id: "itel-ps", name: "Itel Power Station", category: "solar", series: "Power Stations", description: "Portable power station for flexible backup, mobile charging, and light-use off-grid convenience.", features: ["Portable power", "Multiple outlets", "USB charging", "LED display"], bestFor: "Portable use", price: "Contact for price", tier: "entry" },
];

export const smartHomeProducts: Product[] = [
  { id: "sh-8g", name: "8 Gang WiFi Smart Switch", category: "smarthome", description: "Advanced wall switch for controlling multiple circuits remotely from your phone or voice assistant.", features: ["8 gang control", "WiFi enabled", "App control", "Voice assistant compatible"], bestFor: "Large rooms", price: "Contact for price", tier: "mid" },
  { id: "sh-1g", name: "1 Gang WiFi Smart Switch", category: "smarthome", description: "Simple entry smart switch that brings remote control and scheduling to any room.", features: ["Single switch", "WiFi enabled", "Timer function", "Remote control"], bestFor: "Any room", price: "Contact for price", tier: "entry" },
  { id: "sh-granite", name: "Granite Display Smart Switch", category: "smarthome", description: "Premium display switch with scene control and energy monitoring for higher-end interiors.", features: ["Touch display", "Premium granite finish", "Scene control", "Energy monitoring"], bestFor: "Premium homes", price: "Contact for price", tier: "premium" },
];

export const cctvProducts: Product[] = [
  { id: "cc-indoor", name: "Indoor Camera", category: "cctv", description: "Compact indoor monitoring camera for everyday home and office visibility.", features: ["1080p HD", "Night vision", "Motion detection", "Two-way audio"], bestFor: "Home & office", price: "Contact for price", tier: "entry" },
  { id: "cc-outdoor", name: "Outdoor Camera", category: "cctv", description: "Weather-ready exterior camera built to monitor compounds, entrances, and open spaces.", features: ["Weatherproof IP66", "1080p HD", "IR night vision", "Motion alerts"], bestFor: "Outdoor security", price: "Contact for price", tier: "mid" },
  { id: "cc-dome", name: "Dome Camera", category: "cctv", description: "Wide-coverage dome camera for indoor commercial spaces that need discreet visibility.", features: ["360° coverage", "Vandal-proof", "HD recording", "Remote viewing"], bestFor: "Offices & shops", price: "Contact for price", tier: "mid" },
  { id: "cc-bullet", name: "Bullet Camera", category: "cctv", description: "Long-range perimeter camera for driveways, fences, and exposed outdoor areas.", features: ["Long range IR", "1080p HD", "Weatherproof", "Night vision 30m"], bestFor: "Perimeter security", price: "Contact for price", tier: "affordable" },
];

export type ProductInterest = "solar" | "panels" | "batteries" | "smarthome" | "smartlocks" | "cctv" | "full_solar" | "other";

export function getProductsForInterests(interests: ProductInterest[], budget?: string): Product[] {
  const results: Product[] = [];

  const solarInterests: ProductInterest[] = ["solar", "panels", "batteries", "full_solar"];
  if (interests.some((i) => solarInterests.includes(i))) results.push(...solarProducts);
  if (interests.includes("smartlocks")) results.push(...smartLockProducts);
  if (interests.includes("smarthome")) results.push(...smartHomeProducts);
  if (interests.includes("cctv")) results.push(...cctvProducts);

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
