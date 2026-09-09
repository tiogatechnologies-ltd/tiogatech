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
  // Solar Systems (19 unique packages)
  { label: "Package #1 — 3.5kVA Starter Hybrid System", category: "solar", url: "/products/packages/pkg-solar-1.webp" },
  { label: "Package #2 — 5kVA Popular Hybrid System", category: "solar", url: "/products/packages/pkg-solar-2.webp" },
  { label: "Package #3 — 7.5kVA Family Hybrid System", category: "solar", url: "/products/packages/pkg-solar-3.webp" },
  { label: "Package #4 — 10kVA Premium Single-Phase System", category: "solar", url: "/products/packages/pkg-solar-4.webp" },
  { label: "Package #5 — 10kVA 3-Phase Commercial System", category: "solar", url: "/products/packages/pkg-solar-5.webp" },
  { label: "Package #6 — 10kVA 3-Phase Extended Runtime", category: "solar", url: "/products/packages/pkg-solar-6.webp" },
  { label: "Package #7 — 20kVA Dual-Inverter Villa System", category: "solar", url: "/products/packages/pkg-solar-7.webp" },
  { label: "Package #8 — 30kVA Enterprise Mini-Grid System", category: "solar", url: "/products/packages/pkg-solar-8.webp" },
  { label: "Package #9 — 1kVA Tubular Starter System", category: "solar", url: "/products/packages/pkg-solar-9.webp" },
  { label: "Package #10 — 1.5kVA Tubular Compact System", category: "solar", url: "/products/packages/pkg-solar-10.webp" },
  { label: "Package #11 — 2.5kVA Tubular Popular System", category: "solar", url: "/products/packages/pkg-solar-11.webp" },
  { label: "Package #12 — 3kVA Tubular Family System", category: "solar", url: "/products/packages/pkg-solar-12.webp" },
  { label: "Package #13 — 5kVA Tubular Premium System", category: "solar", url: "/products/packages/pkg-solar-13.webp" },
  { label: "Package #14 — 5kVA Tubular Value System", category: "solar", url: "/products/packages/pkg-solar-14.webp" },
  { label: "Package #15 — 7.5kVA Tubular AC Support System", category: "solar", url: "/products/packages/pkg-solar-15.webp" },
  { label: "Package #16 — 10kVA Tubular 16-Battery Bank", category: "solar", url: "/products/packages/pkg-solar-16.webp" },
  { label: "Package #17 — 40kVA Core Series Commercial", category: "solar", url: "/products/packages/pkg-solar-17.webp" },
  { label: "Package #18 — 40kVA Pro Series High-Voltage", category: "solar", url: "/products/packages/pkg-solar-18.webp" },
  { label: "Package #19 — 40kVA Max Series Micro-Grid", category: "solar", url: "/products/packages/pkg-solar-19.webp" },

  // Smart Locks & Accessories
  { label: "STAMA Elite K209 3D Face ID Smart Lock", category: "lock", url: "/products/core/stama-k209-face-lock.webp" },
  { label: "STAMA Elite S7 Israeli Edition Lock", category: "lock", url: "/products/core/stama-s7-premier.webp" },
  { label: "STAMA Apex D20 Biometric Smart Lock", category: "lock", url: "/products/core/stama-d20-apex.webp" },
  { label: "STAMA Apex H11 Video Doorbell Lock", category: "lock", url: "/products/core/stama-h11-intercom.webp" },
  { label: "STAMA Apex F27 Wi-Fi Video Intercom Lock", category: "lock", url: "/products/core/stama-f27-wifi.webp" },
  { label: "STAMA Apex T8 Israeli Custom Lock", category: "lock", url: "/products/core/stama-t8-israeli.webp" },
  { label: "STAMA Pro SL02 Aluminum Slim Lock", category: "lock", url: "/products/core/stama-sl02-aluminum.webp" },
  { label: "STAMA Pro N14 Time-Attendance Smart Lock", category: "lock", url: "/products/core/stama-n14-pro.webp" },
  { label: "STAMA Pro N22 Security Smart Lock", category: "lock", url: "/products/core/stama-n22-security.webp" },
  { label: "STAMA Pro X04 Best-Value Smart Lock", category: "lock", url: "/products/core/stama-x04-budget.webp" },
  { label: "STAMA Basic-Pro B16 Camera Smart Lock", category: "lock", url: "/products/core/stama-b16-camera.webp" },
  { label: "STAMA Pro TFS BLE Shortlet Smart Lock", category: "lock", url: "/products/core/stama-tf5-shortlet.webp" },
  { label: "STAMA Base G290 Frameless Glass Lock", category: "lock", url: "/products/core/stama-g290-glass.webp" },
  { label: "STAMA Base V80 Heavy-Duty Gate Lock", category: "lock", url: "/products/core/stama-v80-gate.webp" },
  { label: "STAMA KT14 Heavy-Duty IP67 Smart Padlock", category: "lock", url: "/products/core/stama-kt14-padlock.webp" },
  { label: "STAMA Smart Lock 7.4V Rechargeable Battery", category: "lock", url: "/products/core/stama-lock-battery.webp" },
  { label: "STAMA Smart Lock Remote Control Fob", category: "lock", url: "/products/core/stama-lock-remote.webp" },
  { label: "STAMA G2 Bluetooth-to-WiFi Gateway Hub", category: "lock", url: "/products/core/stama-lock-gateway.webp" },
  { label: "STAMA RFID Smart Keycard / Keyfob", category: "lock", url: "/products/core/stama-rfid-card.webp" },
  { label: "STAMA Centralized Hotel Management System", category: "lock", url: "/products/core/stama-hotel-system.webp" },

  // Home Automation
  { label: "Apex Series — Full Living Room Automation", category: "automation", url: "/products/core/pkg-automation-apex.webp" },
  { label: "Aura Series — Smart Relays & Lighting Hub", category: "automation", url: "/products/core/pkg-automation-aura.webp" },
  { label: "Riviera Series — Luxury Estate Unified Control", category: "automation", url: "/products/core/pkg-automation-riviera.webp" },

  // CCTV & Surveillance
  { label: "4-Channel 4K ColorVu PoE CCTV Kit", category: "cctv", url: "/products/core/pkg-cctv-4ch-kit.webp" },
  { label: "8-Channel AI Audio Perimeter CCTV Kit", category: "cctv", url: "/products/core/pkg-cctv-8ch-kit.webp" },
  { label: "4G Solar Standalone Dual-Lens PTZ Camera", category: "cctv", url: "/products/core/pkg-cctv-solar-ptz.webp" },
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

    const row = data as { value?: Record<string, string> } | null;
    if (error || !row || !row.value) {
      cachedPackageImages = cachedPackageImages || {};
    } else {
      cachedPackageImages = row.value || {};
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
    if (num >= 1 && num <= 19) {
      return `/products/packages/pkg-solar-${num}.webp`;
    }
    return "/products/packages/pkg-solar-1.webp";
  }

  if (category === "automation") {
    const tier = String(identifier || "").toLowerCase();
    if (tier.includes("aura") || tier.includes("sprout")) return "/products/core/pkg-automation-aura.webp";
    if (tier.includes("riviera") || tier.includes("ibiza")) return "/products/core/pkg-automation-riviera.webp";
    return "/products/core/pkg-automation-apex.webp";
  }

  if (category === "lock") {
    const s = String(identifier || "").toLowerCase();
    if (s.includes("hotel")) return "/products/core/stama-hotel-system.webp";
    if (s.includes("gateway")) return "/products/core/stama-lock-gateway.webp";
    if (s.includes("battery")) return "/products/core/stama-lock-battery.webp";
    if (s.includes("remote")) return "/products/core/stama-lock-remote.webp";
    if (s.includes("rfid") || s.includes("card")) return "/products/core/stama-rfid-card.webp";
    if (s.includes("padlock") || s.includes("kt14")) return "/products/core/stama-kt14-padlock.webp";
    if (s.includes("k209")) return "/products/core/stama-k209-face-lock.webp";
    if (s.includes("f27")) return "/products/core/stama-f27-wifi.webp";
    if (s.includes("t8")) return "/products/core/stama-t8-israeli.webp";
    if (s.includes("h11")) return "/products/core/stama-h11-intercom.webp";
    if (s.includes("n14")) return "/products/core/stama-n14-pro.webp";
    if (s.includes("n22")) return "/products/core/stama-n22-security.webp";
    if (s.includes("x04")) return "/products/core/stama-x04-budget.webp";
    if (s.includes("b16")) return "/products/core/stama-b16-camera.webp";
    if (s.includes("g290") || s.includes("glass")) return "/products/core/stama-g290-glass.webp";
    if (s.includes("v80") || s.includes("gate")) return "/products/core/stama-v80-gate.webp";
    if (s.includes("sl02")) return "/products/core/stama-sl02-aluminum.webp";
    if (s.includes("elite") || s.includes("s7")) return "/products/core/stama-s7-premier.webp";
    if (s.includes("apex") || s.includes("d20")) return "/products/core/stama-d20-apex.webp";
    if (s.includes("pro") || s.includes("tfs")) return "/products/core/stama-tf5-shortlet.webp";
    return "/products/clear/lock-fingerprint-handle.webp";
  }

  // cctv
  const c = String(identifier || "").toLowerCase();
  if (c.includes("8") || c.includes("8ch")) return "/products/core/pkg-cctv-8ch-kit.webp";
  if (c.includes("ptz") || c.includes("solar")) return "/products/core/pkg-cctv-solar-ptz.webp";
  return "/products/core/pkg-cctv-4ch-kit.webp";
}
