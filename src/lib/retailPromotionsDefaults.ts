import bgSolarHero from "@/assets/bg-commercial-solar.jpg";
import bgInverterHero from "@/assets/bg-panel-closeup.jpg";
import bgSmartLockHero from "@/assets/bg-smartlock-apex.jpg";

export type SourceType = "product" | "solar_package" | "smart_lock" | "automation_package" | "custom";

export interface HeroSlideContent {
  id: string;
  is_active: boolean;
  source_type?: SourceType;
  source_id?: string | null;
  badge: string;
  headline: string;
  subheadline: string;
  highlight_text: string;
  discount_pct: number | null;
  price_ngn?: number | null;
  image_url: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
}

export interface FlashDealContent {
  is_active: boolean;
  headline: string;
  discount_label: string;
  discount_code: string;
  description: string;
  perk_label: string;
  ends_at: string; // ISO timestamp
}

export const DEFAULT_HERO_SLIDES: HeroSlideContent[] = [
  {
    id: "default-slide-inverters",
    is_active: true,
    source_type: "custom",
    source_id: null,
    badge: "Official Distributor Guarantee",
    headline: "Commercial & Residential Tier-1 Solar Inverters",
    subheadline: "Direct warehouse supply of Deye Hybrid Inverters, SRNE & Felicity LiFePO4 Lithium Batteries, and Longi Tier 1 Solar Panels with nationwide delivery.",
    highlight_text: "Up to 5-Year Replacement Warranty",
    discount_pct: 10,
    price_ngn: null,
    image_url: bgSolarHero,
    cta_text: "Explore Inverters & Batteries",
    cta_link: "/retail?category=Inverters",
    secondary_cta_text: "LumiVolt Load Calculator",
    secondary_cta_link: "/lumivolt",
  },
  {
    id: "default-slide-bundles",
    is_active: true,
    source_type: "custom",
    source_id: null,
    badge: "Turnkey Solar Bundles",
    headline: "Complete 5kVA & 10kVA Turnkey Solar Power Packs",
    subheadline: "Pre-matched hybrid inverters with high-cycle lithium iron phosphate batteries. Zero grid changeover flicker for sensitive electronics and medical clinics.",
    highlight_text: "Same-Day Dispatch in Lagos & Abuja",
    discount_pct: 15,
    price_ngn: null,
    image_url: bgInverterHero,
    cta_text: "Shop Solar Bundles",
    cta_link: "/solar-packages",
    secondary_cta_text: "Spread Payment in Installments",
    secondary_cta_link: "/finance",
  },
  {
    id: "default-slide-locks",
    is_active: true,
    source_type: "custom",
    source_id: null,
    badge: "Advanced Smart Security",
    headline: "STAMA 3D Face Recognition & Biometric Smart Locks",
    subheadline: "Military-grade encryption, Tuya & TTlock cloud sync, hidden physical key backup, and anti-tamper alarms for residences and luxury hospitality suites.",
    highlight_text: "Free Expert Installation in Lagos",
    discount_pct: 10,
    price_ngn: null,
    image_url: bgSmartLockHero,
    cta_text: "Shop Smart Locks",
    cta_link: "/retail?category=Smart+Locks",
    secondary_cta_text: "Hotel Access Systems",
    secondary_cta_link: "/contact",
  },
];

export const getDefaultFlashDeal = (): FlashDealContent => {
  const future = new Date();
  future.setDate(future.getDate() + 7);
  future.setHours(23, 59, 59, 999);

  return {
    is_active: true,
    headline: "Mid-Month Energy Flash Deals",
    discount_label: "Up to 15% Off",
    discount_code: "TIOGA2026",
    description: "Apply code at checkout for free 24-hour expedited dispatch on all inverter and battery storage orders.",
    perk_label: "24h Dispatch",
    ends_at: future.toISOString(),
  };
};

export const DEFAULT_FLASH_DEAL: FlashDealContent = getDefaultFlashDeal();

/**
 * Resolves the flash deal configuration:
 * 1. If admin explicitly disabled it (is_active === false), return null.
 * 2. If admin configured it with active status, return the merged deal.
 * 3. If no content row exists in Supabase (unconfigured), return the authentic default deal.
 */
export const resolveFlashDeal = (rawContent: any): FlashDealContent | null => {
  if (rawContent == null) {
    return DEFAULT_FLASH_DEAL;
  }
  if (typeof rawContent === "object") {
    if (rawContent.is_active === false) {
      return null;
    }
    return {
      ...DEFAULT_FLASH_DEAL,
      ...rawContent,
      is_active: rawContent.is_active ?? true,
    };
  }
  return DEFAULT_FLASH_DEAL;
};
