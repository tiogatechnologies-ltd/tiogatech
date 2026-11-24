import type { SolarPackage } from "@/hooks/useSolarPackages";
import type { SmartLock } from "@/hooks/useSmartLocks";
import type { CctvPackage } from "@/hooks/useCctvPackages";
import type { HomeAutomationPackage } from "@/hooks/useHomeAutomationPackages";
import { inferPackageLoadKw } from "@/lib/packageAppliances";
import { toNigerianE164 } from "@/lib/customerWhatsapp";
import type { Attribution } from "@/lib/attribution";

export type HeroServiceKey = "energy" | "security" | "smarthome" | "shop";

export type AdsServiceId =
  | "audit"
  | "solar"
  | "smart_locks"
  | "cctv"
  | "automation"
  | "engineering"
  | "retail"
  | "finance";

export type ConfiguratorGoalId =
  | "backup_power"
  | "cut_fuel"
  | "secure_doors"
  | "watch_property"
  | "automate"
  | "buy_product";

export type PropertyKind = "flat" | "duplex" | "shop" | "office" | "estate_hotel";

export type ContactChannel = "WhatsApp" | "Call" | "Email";

export interface CampaignConfig {
  slug: string;
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  subline: string;
  defaultHeroService: HeroServiceKey;
  defaultServices: AdsServiceId[];
  defaultGoals: ConfiguratorGoalId[];
  seoTitle: string;
  seoDescription: string;
}

export const CAMPAIGN_CONFIGS: Record<string, CampaignConfig> = {
  general: {
    slug: "general",
    eyebrow: "Tioga Technologies · Nationwide Engineering",
    headline: "Power, protect and automate",
    headlineAccent: "your home or business.",
    subline:
      "Solar & power · Smart locks · CCTV · Home automation · Free energy audit and a personalised quote in 24h.",
    defaultHeroService: "energy",
    defaultServices: ["audit"],
    defaultGoals: ["backup_power"],
    seoTitle: "Get a Free Energy Audit & Personalised Quote | Tioga Technologies",
    seoDescription:
      "Power, protect and automate your home or business across Nigeria. Book a free energy audit or get a personalised quote for solar, smart locks, CCTV, home automation and retail hardware in 24h.",
  },
  energy: {
    slug: "energy",
    eyebrow: "Solar & Hybrid Backup Systems",
    headline: "End blackouts and cut fuel bills",
    headlineAccent: "with engineered solar power.",
    subline:
      "Matched SRNE, itel & Deye inverters, LiFePO4 lithium batteries and Tier-1 panels. Book a free energy audit and get a sized quote in 24h.",
    defaultHeroService: "energy",
    defaultServices: ["audit", "solar"],
    defaultGoals: ["backup_power", "cut_fuel"],
    seoTitle: "Free Solar Energy Audit & Custom Quote | Tioga Technologies",
    seoDescription:
      "Size your solar inverter, lithium battery and panels properly. Book a free energy audit and receive a transparent quote in 24h.",
  },
  security: {
    slug: "security",
    eyebrow: "Smart Locks & AI CCTV Surveillance",
    headline: "Protect every door and perimeter",
    headlineAccent: "with biometric locks & AI CCTV.",
    subline:
      "3D Face ID smart locks, ColorVu perimeter cameras and off-grid 4G solar PTZ surveillance installed cleanly by certified Tioga engineers.",
    defaultHeroService: "security",
    defaultServices: ["smart_locks", "cctv"],
    defaultGoals: ["secure_doors", "watch_property"],
    seoTitle: "Smart Locks & AI CCTV Installation Quote | Tioga Technologies",
    seoDescription:
      "Upgrade your doors and perimeter with biometric smart locks and AI CCTV systems installed nationwide by Tioga engineers.",
  },
  smarthome: {
    slug: "smarthome",
    eyebrow: "VoltAi Whole-Home Automation",
    headline: "Control lights, curtains & climate",
    headlineAccent: "from one wall panel or app.",
    subline:
      "Apex, Aura and Riviera automation ecosystems tailored to your floor plan - with local Zigbee reliability, voice control and smart security.",
    defaultHeroService: "smarthome",
    defaultServices: ["automation"],
    defaultGoals: ["automate"],
    seoTitle: "Home Automation Consultation & Quote | Tioga Technologies",
    seoDescription:
      "Automate lighting, motorized curtains, climate and security with Tioga's Apex, Aura and Riviera smart home packages.",
  },
  retail: {
    slug: "retail",
    eyebrow: "Tioga Retail Store · Genuine Hardware",
    headline: "Shop genuine inverters, batteries",
    headlineAccent: "and smart home hardware.",
    subline:
      "Authorized distributor stock across SRNE, itel, Deye, Luxpower, Hikvision & Tuya - fast dispatch nationwide and flexible payment options.",
    defaultHeroService: "shop",
    defaultServices: ["retail"],
    defaultGoals: ["buy_product"],
    seoTitle: "Shop Solar, Smart Locks & CCTV Hardware | Tioga Technologies",
    seoDescription:
      "Genuine hybrid inverters, LiFePO4 batteries, solar panels, CCTV and smart locks shipped nationwide with warranty.",
  },
  blackfriday: {
    slug: "blackfriday",
    eyebrow: "Black Friday Deals · Solar, Security & Smart Home",
    headline: "Power, protect and automate",
    headlineAccent: "for less this Black Friday.",
    subline:
      "Locked-in Black Friday pricing on solar packages, biometric smart locks, CCTV kits and retail hardware - plus a free energy audit in 24h.",
    defaultHeroService: "energy",
    defaultServices: ["solar", "smart_locks", "retail"],
    defaultGoals: ["backup_power", "secure_doors"],
    seoTitle: "Black Friday Solar & Smart Home Deals | Tioga Technologies",
    seoDescription:
      "Claim Black Friday pricing on engineered solar packages, smart locks, CCTV kits and retail hardware from Tioga Technologies.",
  },
  finance: {
    slug: "finance",
    eyebrow: "Tioga Easy Flex · Pay Small-Small",
    headline: "Install solar or smart security now",
    headlineAccent: "and spread the cost monthly.",
    subline:
      "Flexible 3 to 24 month lease-to-own plans on solar packages, smart locks, CCTV and automation systems - get pre-qualified in 24h.",
    defaultHeroService: "energy",
    defaultServices: ["solar", "finance"],
    defaultGoals: ["backup_power"],
    seoTitle: "Flexible Solar & Smart Home Payment Plans | Tioga Technologies",
    seoDescription:
      "Spread the cost of your solar power, smart lock or automation installation with flexible monthly instalments.",
  },
};

const CAMPAIGN_ALIASES: Record<string, string> = {
  solar: "energy",
  power: "energy",
  lumi: "energy",
  audit: "energy",
  locks: "security",
  smartlocks: "security",
  cctv: "security",
  automation: "smarthome",
  voltai: "smarthome",
  shop: "retail",
  store: "retail",
  bf26: "blackfriday",
  bf: "blackfriday",
  easyflex: "finance",
};

export function resolveCampaignConfig(campaignParam?: string | null): CampaignConfig {
  if (!campaignParam) return CAMPAIGN_CONFIGS.general;
  const key = campaignParam.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const resolvedKey = CAMPAIGN_ALIASES[key] || key;
  return CAMPAIGN_CONFIGS[resolvedKey] || CAMPAIGN_CONFIGS.general;
}

export interface ServiceOptionMeta {
  id: AdsServiceId;
  label: string;
  shortDesc: string;
  footerRoute: string;
  accent: "gold" | "blue" | "violet" | "green";
}

export const SERVICE_OPTIONS: ServiceOptionMeta[] = [
  {
    id: "audit",
    label: "Free Energy Audit",
    shortDesc: "Engineer sizes your load at zero cost",
    footerRoute: "/solar-packages",
    accent: "gold",
  },
  {
    id: "solar",
    label: "Solar & Power",
    shortDesc: "Hybrid inverters, LiFePO4 batteries & panels",
    footerRoute: "/solar-packages",
    accent: "gold",
  },
  {
    id: "smart_locks",
    label: "Smart Locks",
    shortDesc: "Biometric, 3D Face ID & hotel access",
    footerRoute: "/smart-locks",
    accent: "blue",
  },
  {
    id: "cctv",
    label: "CCTV & Security",
    shortDesc: "ColorVu AI cameras & 4G solar PTZ",
    footerRoute: "/cctv",
    accent: "blue",
  },
  {
    id: "automation",
    label: "Home Automation",
    shortDesc: "Smart lighting, curtains, climate & voice",
    footerRoute: "/home-automation",
    accent: "violet",
  },
  {
    id: "engineering",
    label: "Engineering Solutions",
    shortDesc: "Commercial power, estates & custom IoT",
    footerRoute: "/solutions",
    accent: "green",
  },
  {
    id: "retail",
    label: "Retail Product",
    shortDesc: "Buy hardware directly from our store",
    footerRoute: "/retail",
    accent: "green",
  },
  {
    id: "finance",
    label: "Flexible Payment",
    shortDesc: "Spread cost over 3 to 24 months",
    footerRoute: "/finance",
    accent: "gold",
  },
];

export const PROPERTY_OPTIONS: Array<{ id: PropertyKind; label: string; hint: string }> = [
  { id: "flat", label: "Flat", hint: "1–3 bedroom apartment" },
  { id: "duplex", label: "Duplex", hint: "Full house / multi-floor" },
  { id: "shop", label: "Shop", hint: "Store, salon or clinic" },
  { id: "office", label: "Office", hint: "Workspace or studio" },
  { id: "estate_hotel", label: "Estate / Hotel", hint: "Multi-unit or hospitality" },
];

export interface QuickAppliancePreset {
  id: string;
  name: string;
  avgWatts: number;
  category: "lighting" | "cooling" | "entertainment" | "kitchen" | "laundry" | "other";
  defaultQty: number;
}

export const CONFIGURATOR_APPLIANCES: QuickAppliancePreset[] = [
  { id: "led_bulb", name: "LED Bulb", avgWatts: 10, category: "lighting", defaultQty: 10 },
  { id: "fan", name: "Ceiling Fan", avgWatts: 75, category: "cooling", defaultQty: 3 },
  { id: "tv", name: "TV (43\")", avgWatts: 70, category: "entertainment", defaultQty: 2 },
  { id: "laptop", name: "Laptop", avgWatts: 50, category: "entertainment", defaultQty: 2 },
  { id: "fridge", name: "Fridge (Double Door)", avgWatts: 200, category: "kitchen", defaultQty: 1 },
  { id: "freezer", name: "Deep Freezer (Small)", avgWatts: 150, category: "kitchen", defaultQty: 0 },
  { id: "ac_1hp", name: "1HP AC", avgWatts: 900, category: "cooling", defaultQty: 0 },
  { id: "ac_1_5hp", name: "1.5HP AC", avgWatts: 1400, category: "cooling", defaultQty: 0 },
  { id: "water_pump", name: "Water Pump", avgWatts: 750, category: "other", defaultQty: 0 },
  { id: "washing_machine", name: "Washing Machine", avgWatts: 500, category: "laundry", defaultQty: 0 },
  { id: "microwave", name: "Microwave", avgWatts: 900, category: "kitchen", defaultQty: 0 },
  { id: "router", name: "WiFi Router", avgWatts: 12, category: "other", defaultQty: 1 },
];

export function calculateConfiguratorWatts(counts: Record<string, number>): number {
  return CONFIGURATOR_APPLIANCES.reduce((sum, a) => {
    const qty = Math.max(0, counts[a.id] ?? 0);
    return sum + qty * a.avgWatts;
  }, 0);
}

/**
 * Recommends the smallest real package from `useSolarPackages` whose `largest_load_kw`
 * (or inferred kW) covers `totalWatts` with a 25% surge/headroom buffer.
 * Prefers Lithium packages when capacities tie.
 */
export function recommendSolarPackage(
  packages: SolarPackage[],
  totalWatts: number,
  property: PropertyKind = "flat",
): SolarPackage | null {
  const active = packages.filter((p) => p.is_active !== false && p.total_price > 0);
  if (active.length === 0) return null;

  // Property baseline when user hasn't added appliances yet
  const baselineWattsByProp: Record<PropertyKind, number> = {
    flat: 600,
    shop: 800,
    duplex: 2200,
    office: 3200,
    estate_hotel: 7500,
  };
  const effectiveWatts = totalWatts > 0 ? totalWatts : baselineWattsByProp[property];
  const requiredKw = Math.max(0.8, (effectiveWatts * 1.25) / 1000);

  const sorted = [...active].sort((a, b) => {
    const aKw = inferPackageLoadKw(a);
    const bKw = inferPackageLoadKw(b);
    if (aKw !== bKw) return aKw - bKw;
    const aLith = a.battery_type === "lithium" ? 0 : 1;
    const bLith = b.battery_type === "lithium" ? 0 : 1;
    if (aLith !== bLith) return aLith - bLith;
    return a.total_price - b.total_price;
  });

  const match = sorted.find((p) => inferPackageLoadKw(p) >= requiredKw);
  return match || sorted[sorted.length - 1];
}

/**
 * Picks 2–3 real smart locks from `useSmartLocks` best suited to the property type.
 */
export function matchSmartLocks(
  locks: SmartLock[],
  property: PropertyKind,
  limit = 3,
): SmartLock[] {
  const active = locks.filter((l) => l.is_active !== false && l.category !== "accessory");
  if (active.length === 0) return [];

  const score = (l: SmartLock): number => {
    const text = `${l.series} ${l.name} ${l.ideal_for} ${l.description} ${l.category}`.toLowerCase();
    let s = 0;
    if (property === "estate_hotel") {
      if (l.category === "hotel" || /\bhotel\b/.test(text)) s += 15;
      else if (/estate|shortlet|airbnb/.test(text)) s += 8;
      if (/elite|apex/.test(text)) s += 4;
    } else if (property === "office" || property === "shop") {
      if (/office|glass|aluminum|commercial|pro|shop/.test(text)) s += 10;
      if (/apex|pro/.test(text)) s += 3;
    } else if (property === "duplex") {
      if (/elite|apex|face|video|intercom|exterior|waterproof/.test(text)) s += 10;
      if (/home|duplex|residence/.test(text)) s += 4;
    } else {
      // flat
      if (/apartment|flat|shortlet|base|pro|wifi|budget/.test(text)) s += 10;
      if (/home/.test(text)) s += 3;
    }
    return s;
  };

  return [...active]
    .sort((a, b) => score(b) - score(a) || a.sort_order - b.sort_order)
    .slice(0, limit);
}

/**
 * Picks the best matching CCTV kit from `useCctvPackages` for the property type.
 */
export function matchCctvPackage(
  packages: CctvPackage[],
  property: PropertyKind,
): CctvPackage | null {
  const active = packages.filter((p) => p.is_active !== false);
  if (active.length === 0) return null;

  if (property === "duplex" || property === "office" || property === "estate_hotel") {
    const eightPlus = active.find((p) => p.channels >= 8);
    if (eightPlus) return eightPlus;
  }

  if (property === "flat" || property === "shop") {
    const fourCh = active.find((p) => p.channels === 4);
    if (fourCh) return fourCh;
  }

  return active[0];
}

/**
 * Picks the closest Home Automation tier from `useHomeAutomationPackages` for the property type.
 */
export function matchAutomationPackage(
  packages: HomeAutomationPackage[],
  property: PropertyKind,
): HomeAutomationPackage | null {
  const active = packages.filter((p) => p.is_active !== false);
  if (active.length === 0) return null;

  const sorted = [...active].sort(
    (a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER) || a.sort_order - b.sort_order,
  );

  if (property === "estate_hotel") {
    return sorted.find((p) => /riviera/i.test(`${p.tier} ${p.name}`)) || sorted[sorted.length - 1];
  }
  if (property === "duplex" || property === "office") {
    return sorted.find((p) => /aura/i.test(`${p.tier} ${p.name}`)) || sorted[Math.min(1, sorted.length - 1)];
  }
  return sorted.find((p) => /apex/i.test(`${p.tier} ${p.name}`)) || sorted[0];
}

export const RETAIL_CATEGORY_LINKS: Array<{ label: string; categoryParam: string; to: string }> = [
  { label: "Solar Inverters", categoryParam: "Inverters", to: "/retail?category=Inverters" },
  { label: "LiFePO4 Batteries", categoryParam: "Batteries", to: "/retail?category=Batteries" },
  { label: "Solar Panels", categoryParam: "Solar Panels", to: "/retail?category=Solar%20Panels" },
  { label: "CCTV & Cameras", categoryParam: "CCTV & Cameras", to: "/retail?category=CCTV%20%26%20Cameras" },
  { label: "Smart Door Locks", categoryParam: "Smart Door Locks", to: "/retail?category=Smart%20Door%20Locks" },
  { label: "Smart Home Switches", categoryParam: "Smart Switches & Sockets", to: "/retail?category=Smart%20Switches%20%26%20Sockets" },
];

export function mapGoalsToServices(goals: ConfiguratorGoalId[]): AdsServiceId[] {
  const set = new Set<AdsServiceId>();
  for (const g of goals) {
    if (g === "backup_power" || g === "cut_fuel") {
      set.add("solar");
      set.add("audit");
    } else if (g === "secure_doors") {
      set.add("smart_locks");
    } else if (g === "watch_property") {
      set.add("cctv");
    } else if (g === "automate") {
      set.add("automation");
    } else if (g === "buy_product") {
      set.add("retail");
    }
  }
  return Array.from(set);
}

/**
 * Produces the deduplicated union of `leads.products[]` keys matching LeadForm.tsx conventions.
 */
export function mapServicesToProducts(services: AdsServiceId[]): string[] {
  const out = new Set<string>();
  for (const s of services) {
    switch (s) {
      case "audit":
      case "solar":
        out.add("solar");
        out.add("panels");
        out.add("batteries");
        out.add("full_solar");
        break;
      case "smart_locks":
        out.add("smartlocks");
        break;
      case "cctv":
        out.add("cctv");
        break;
      case "automation":
        out.add("smarthome");
        break;
      case "engineering":
        out.add("engineering");
        break;
      case "retail":
        out.add("retail");
        break;
      case "finance":
        out.add("finance");
        break;
    }
  }
  return out.size > 0 ? Array.from(out) : ["solar"];
}

export interface AdsLeadFormInput {
  services: AdsServiceId[];
  propertyType: string;
  location: string;
  budget: string;
  // Conditional solar fields (reusing SolarFlow options)
  systemType: string;
  usageDuration: string;
  appliances: string[];
  estimatedWatts: number;
  // Conditional security fields (reusing SecurityFlow options)
  accessTypes: string[];
  cctvCoverage: string[];
  // Conditional automation fields (reusing AutomationFlow options)
  automateWhat: string[];
  controlPreference: string;
  automationScale: string;
  // Contact
  fullName: string;
  phone: string;
  email: string;
  preferredContact: ContactChannel;
  consent: boolean;
  extraNotes: string;
  // Configurator matches carried into form
  matchedSummary: string[];
}

export interface AdsLeadPayload {
  full_name: string;
  phone: string;
  email: string | null;
  location: string;
  products: string[];
  has_electricity: string | null;
  main_goal: string | null;
  appliances: string[];
  budget: string;
  timeline: string | null;
  notes: string;
  consent: boolean;
  affiliate_code?: string | null;
  affiliate_link_slug?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
}

/**
 * Pure builder for the `leads` table insert payload, matching `LeadForm.tsx`'s schema.
 */
export function buildAdsLeadPayload(
  input: AdsLeadFormInput,
  context: {
    pathname: string;
    campaign: string;
    attribution?: Partial<Attribution> | null;
  },
): AdsLeadPayload {
  const products = mapServicesToProducts(input.services);
  const serviceLabels = input.services
    .map((id) => SERVICE_OPTIONS.find((o) => o.id === id)?.label || id)
    .join(", ");

  const details: string[] = [
    `[Ads LP: ${context.pathname}]`,
    `Services: ${serviceLabels || "General Inquiry"}`,
  ];
  if (input.propertyType) details.push(`Property: ${input.propertyType}`);
  if (input.preferredContact) details.push(`Preferred: ${input.preferredContact}`);
  if (input.estimatedWatts > 0) details.push(`Est. Load: ${input.estimatedWatts}W`);
  if (input.accessTypes.length > 0) details.push(`Lock Access: ${input.accessTypes.join(", ")}`);
  if (input.cctvCoverage.length > 0) details.push(`CCTV Coverage: ${input.cctvCoverage.join(", ")}`);
  if (input.automateWhat.length > 0) details.push(`Automate: ${input.automateWhat.join(", ")}`);
  if (input.automationScale) details.push(`Automation Scale: ${input.automationScale}`);
  if (input.matchedSummary.length > 0) details.push(`Matches: ${input.matchedSummary.join(", ")}`);
  if (context.attribution?.fbclid) details.push(`fbclid: ${context.attribution.fbclid}`);
  if (context.attribution?.gclid) details.push(`gclid: ${context.attribution.gclid}`);
  if (input.extraNotes.trim()) details.push(`Customer Note: ${input.extraNotes.trim()}`);

  const mainGoalParts: string[] = [];
  if (input.usageDuration) mainGoalParts.push(`Backup: ${input.usageDuration}`);
  if (input.controlPreference) mainGoalParts.push(`Control: ${input.controlPreference}`);
  if (mainGoalParts.length === 0 && serviceLabels) mainGoalParts.push(serviceLabels);

  const attr = context.attribution;
  const attributionFields = attr
    ? {
        affiliate_code: attr.affiliate_code || null,
        affiliate_link_slug: attr.affiliate_link_slug || null,
        utm_source: attr.utm_source || null,
        utm_medium: attr.utm_medium || null,
        utm_campaign: attr.utm_campaign || null,
        utm_term: attr.utm_term || null,
        utm_content: attr.utm_content || null,
        referrer: attr.referrer || null,
      }
    : {};

  return {
    full_name: input.fullName.trim(),
    phone: toNigerianE164(input.phone),
    email: input.email.trim() || null,
    location: input.location.trim(),
    products,
    has_electricity: input.systemType || null,
    main_goal: mainGoalParts.join(" · ") || null,
    appliances: input.appliances,
    budget: input.budget || "Not specified",
    timeline: null,
    notes: details.join(" · "),
    consent: input.consent,
    ...attributionFields,
  };
}
