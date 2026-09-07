import { supabase } from "@/integrations/supabase/client";

// Solar stock images
import bgSolarRoof from "@/assets/feature-solar-roof.jpg";
import bgPanelCloseup from "@/assets/bg-panel-closeup.jpg";
import bgRooftopInstall from "@/assets/bg-rooftop-install.jpg";
import bgSolarField from "@/assets/bg-solar-field.jpg";
import bgSolarAerial from "@/assets/bg-solar-aerial.jpg";
import bgCommercialSolar from "@/assets/bg-commercial-solar.jpg";
import bgLumivoltRoof from "@/assets/bg-lumivolt-rooftop.jpg";
import featureBattery from "@/assets/feature-battery.jpg";
import featureSolarPanel from "@/assets/feature-solar-panel.jpg";
import offerSolar from "@/assets/offer-solar.jpg";

// Smart Lock stock images
import bgSmartlockElite from "@/assets/bg-smartlock-elite.jpg";
import bgSmartlockApex from "@/assets/bg-smartlock-apex.jpg";
import bgSmartlockPro from "@/assets/bg-smartlock-pro.jpg";
import bgSmartlockBase from "@/assets/bg-smartlock-base.jpg";
import bgSmartlockHotel from "@/assets/bg-smartlock-hotel.jpg";
import bgSmartlockAccessory from "@/assets/bg-smartlock-accessory.jpg";
import stockSmartLock from "@/assets/stock-smart-lock.png";

// Automation stock images
import bgLagosApartment from "@/assets/bg-lagos-apartment.jpg";
import heroSmartHome from "@/assets/hero-smart-home.jpg";
import featureSmartDevice from "@/assets/feature-smart-automation-device.jpg";
import featureControlPanel from "@/assets/feature-control-panel.jpg";
import featureSmartApp from "@/assets/feature-smart-app.jpg";
import featureTabletMonitor from "@/assets/feature-tablet-monitor.jpg";

// CCTV stock images
import featureCctv from "@/assets/feature-cctv.jpg";
import featureSecurity from "@/assets/feature-security.jpg";

export interface StockPackageImage {
  label: string;
  category: "solar" | "automation" | "lock" | "cctv";
  url: string;
}

export const STOCK_PACKAGE_IMAGES: StockPackageImage[] = [
  // Solar Systems
  { label: "Premium Hybrid Solar Rooftop", category: "solar", url: bgRooftopInstall },
  { label: "Tier-1 Inverter & High-Volt Array", category: "solar", url: bgPanelCloseup },
  { label: "Commercial Rooftop Solar Farm", category: "solar", url: bgCommercialSolar },
  { label: "High-Capacity LiFePO4 Battery Bank", category: "solar", url: featureBattery },
  { label: "Mono-PERC Solar Panels Array", category: "solar", url: featureSolarPanel },
  { label: "Residential Hybrid Solar Installation", category: "solar", url: bgSolarRoof },
  { label: "Ground-Mount Solar Field System", category: "solar", url: bgSolarField },
  { label: "Aerial Rooftop Solar Installation", category: "solar", url: bgSolarAerial },
  { label: "LumiVolt Micro-Grid Array", category: "solar", url: bgLumivoltRoof },
  { label: "Solar Energy Dual-MPPT System", category: "solar", url: offerSolar },

  // Smart Locks
  { label: "STAMA Elite 3D Face ID Smart Lock", category: "lock", url: bgSmartlockElite },
  { label: "STAMA Apex Biometric Push-Pull Lock", category: "lock", url: bgSmartlockApex },
  { label: "STAMA Pro Slim Aluminum Smart Lock", category: "lock", url: bgSmartlockPro },
  { label: "STAMA Base Heavy-Duty Security Lock", category: "lock", url: bgSmartlockBase },
  { label: "STAMA Smart Hotel Access Lock", category: "lock", url: bgSmartlockHotel },
  { label: "STAMA Smart Gateway & Accessories", category: "lock", url: bgSmartlockAccessory },
  { label: "Biometric Interior Smart Lock Handle", category: "lock", url: stockSmartLock },

  // Home Automation
  { label: "Smart Living Room Automation (Apex)", category: "automation", url: bgLagosApartment },
  { label: "IoT Wall Switch & Smart Relays (Aura)", category: "automation", url: featureSmartDevice },
  { label: "Luxury Estate Smart Control Hub (Riviera)", category: "automation", url: heroSmartHome },
  { label: "In-Wall Multi-Gang Touch Panel", category: "automation", url: featureControlPanel },
  { label: "Granite Smart Tablet Monitor", category: "automation", url: featureTabletMonitor },
  { label: "Mobile Smart Life Automation App", category: "automation", url: featureSmartApp },

  // CCTV & Surveillance
  { label: "4-Channel 4K PoE CCTV Kit", category: "cctv", url: featureCctv },
  { label: "8-Channel AI Human Detection System", category: "cctv", url: featureSecurity },
  { label: "16-Channel Commercial PTZ Dome Kit", category: "cctv", url: featureCctv },
];

let cachedPackageImages: Record<string, string> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Loads the package images mapping from Supabase site_settings
 */
export async function fetchPackageImagesMap(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedPackageImages && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedPackageImages;
  }

  try {
    const { data, error } = await supabase
      .from("site_settings" as any)
      .select("value")
      .eq("key", "package_images")
      .maybeSingle();

    if (error || !data || !data.value) {
      cachedPackageImages = cachedPackageImages || {};
    } else {
      cachedPackageImages = (data.value as Record<string, string>) || {};
    }
    lastFetchTime = now;
    return cachedPackageImages;
  } catch {
    return cachedPackageImages || {};
  }
}

/**
 * Saves a package's custom picture to site_settings (and updates the cache)
 */
export async function savePackageImage(packageId: string, imageUrl: string | null): Promise<boolean> {
  try {
    const current = await fetchPackageImagesMap();
    const updated = { ...current };

    if (imageUrl && imageUrl.trim()) {
      updated[packageId] = imageUrl.trim();
    } else {
      delete updated[packageId];
    }

    cachedPackageImages = updated;
    lastFetchTime = Date.now();

    const { error } = await supabase.from("site_settings" as any).upsert(
      {
        key: "package_images",
        value: updated,
      },
      { onConflict: "key" }
    );

    return !error;
  } catch (err) {
    console.error("Failed to save package image:", err);
    return false;
  }
}

/**
 * Returns the default image for a package type/index
 */
export function getDefaultPackageImage(
  category: "solar" | "automation" | "lock" | "cctv",
  identifier?: string | number
): string {
  if (category === "solar") {
    const num = typeof identifier === "number" ? identifier : Number(identifier) || 0;
    const solarImages = [
      bgRooftopInstall,
      bgPanelCloseup,
      bgCommercialSolar,
      featureBattery,
      featureSolarPanel,
      bgSolarRoof,
      bgSolarField,
      bgSolarAerial,
      bgLumivoltRoof,
      offerSolar,
    ];
    return solarImages[num % solarImages.length];
  }

  if (category === "automation") {
    const tier = String(identifier || "").toLowerCase();
    if (tier.includes("aura") || tier.includes("sprout")) return featureSmartDevice;
    if (tier.includes("riviera") || tier.includes("ibiza")) return heroSmartHome;
    return bgLagosApartment;
  }

  if (category === "lock") {
    const s = String(identifier || "").toLowerCase();
    if (s.includes("hotel")) return bgSmartlockHotel;
    if (s.includes("accessory")) return bgSmartlockAccessory;
    if (s.includes("elite")) return bgSmartlockElite;
    if (s.includes("apex")) return bgSmartlockApex;
    if (s.includes("pro")) return bgSmartlockPro;
    return bgSmartlockBase;
  }

  // cctv
  return featureCctv;
}
