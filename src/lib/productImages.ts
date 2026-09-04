import bgPanelCloseup from "@/assets/bg-panel-closeup.jpg";
import featureSolarPanel from "@/assets/feature-solar-panel.jpg";
import bgCommercialSolar from "@/assets/bg-commercial-solar.jpg";
import offerSolar from "@/assets/offer-solar.jpg";
import catSolar from "@/assets/cat-solar.jpg";
import bgSolarField from "@/assets/bg-solar-field.jpg";

import featureBattery from "@/assets/feature-battery.jpg";
import bgBundle from "@/assets/bg-bundle.jpg";
import bgCircuit from "@/assets/bg-circuit.jpg";

import bgSmartlockElite from "@/assets/bg-smartlock-elite.jpg";
import bgSmartlockApex from "@/assets/bg-smartlock-apex.jpg";
import bgSmartlockPro from "@/assets/bg-smartlock-pro.jpg";
import bgSmartlockBase from "@/assets/bg-smartlock-base.jpg";
import bgSmartlockAccessory from "@/assets/bg-smartlock-accessory.jpg";
import bgSmartlockHotel from "@/assets/bg-smartlock-hotel.jpg";

import featureSmartAutomationDevice from "@/assets/feature-smart-automation-device.jpg";
import featureControlPanel from "@/assets/feature-control-panel.jpg";
import featureSmartApp from "@/assets/feature-smart-app.jpg";
import featureTabletMonitor from "@/assets/feature-tablet-monitor.jpg";
import heroSmartHome from "@/assets/hero-smart-home.jpg";

import featureCctv from "@/assets/feature-cctv.jpg";
import featureSecurity from "@/assets/feature-security.jpg";
import offerSecurity from "@/assets/offer-security.jpg";

export interface StockImageOption {
  label: string;
  category: string;
  url: string;
  preview: string;
}

export const STOCK_IMAGE_LIBRARY: StockImageOption[] = [
  // Solar & Inverters
  { label: "Solar Inverter Closeup (Tier-1)", category: "Inverters", url: "/src/assets/bg-panel-closeup.jpg", preview: bgPanelCloseup },
  { label: "Solar Inverter Dual MPPT", category: "Inverters", url: "/src/assets/offer-solar.jpg", preview: offerSolar },
  { label: "Solar Hybrid Inverter High-Voltage", category: "Inverters", url: "/src/assets/cat-solar.jpg", preview: catSolar },
  { label: "Solar Array Field Perspective", category: "Inverters", url: "/src/assets/bg-solar-field.jpg", preview: bgSolarField },
  { label: "Commercial Rooftop Solar", category: "Inverters", url: "/src/assets/bg-commercial-solar.jpg", preview: bgCommercialSolar },

  // Batteries
  { label: "LiFePO4 Lithium Storage Pack", category: "Batteries", url: "/src/assets/feature-battery.jpg", preview: featureBattery },
  { label: "Powerwall Battery Wall Mount", category: "Batteries", url: "/src/assets/bg-bundle.jpg", preview: bgBundle },
  { label: "Compact Battery & Circuit System", category: "Batteries", url: "/src/assets/bg-circuit.jpg", preview: bgCircuit },

  // Solar Panels
  { label: "Mono PERC High-Efficiency Panel", category: "Solar Panels", url: "/src/assets/feature-solar-panel.jpg", preview: featureSolarPanel },
  { label: "Bifacial Commercial Solar Panel", category: "Solar Panels", url: "/src/assets/bg-commercial-solar.jpg", preview: bgCommercialSolar },

  // Smart Locks
  { label: "STAMA Elite 3D Face ID Lock", category: "Smart Locks", url: "/src/assets/bg-smartlock-elite.jpg", preview: bgSmartlockElite },
  { label: "STAMA Apex Biometric Lock", category: "Smart Locks", url: "/src/assets/bg-smartlock-apex.jpg", preview: bgSmartlockApex },
  { label: "STAMA Pro Slim Aluminum Lock", category: "Smart Locks", url: "/src/assets/bg-smartlock-pro.jpg", preview: bgSmartlockPro },
  { label: "STAMA Base Gate & Heavy Duty Lock", category: "Smart Locks", url: "/src/assets/bg-smartlock-base.jpg", preview: bgSmartlockBase },
  { label: "STAMA Biometric Smart Padlock", category: "Smart Locks", url: "/src/assets/bg-smartlock-accessory.jpg", preview: bgSmartlockAccessory },
  { label: "STAMA Smart Hotel Access Ecosystem", category: "Smart Locks", url: "/src/assets/bg-smartlock-hotel.jpg", preview: bgSmartlockHotel },

  // Home Automation
  { label: "Smart Touch Glass Wall Switch", category: "Home Automation", url: "/src/assets/feature-smart-automation-device.jpg", preview: featureSmartAutomationDevice },
  { label: "Multi-Gang Smart Switch Panel", category: "Home Automation", url: "/src/assets/feature-control-panel.jpg", preview: featureControlPanel },
  { label: "Smart IoT Mobile App Sync", category: "Home Automation", url: "/src/assets/feature-smart-app.jpg", preview: featureSmartApp },
  { label: "Granite Smart Touch Display Hub", category: "Home Automation", url: "/src/assets/feature-tablet-monitor.jpg", preview: featureTabletMonitor },
  { label: "Universal Smart Home Hub", category: "Home Automation", url: "/src/assets/hero-smart-home.jpg", preview: heroSmartHome },

  // CCTV & Security
  { label: "PTZ Indoor Smart Security Camera", category: "CCTV", url: "/src/assets/feature-cctv.jpg", preview: featureCctv },
  { label: "2K Outdoor Weatherproof Bullet Camera", category: "CCTV", url: "/src/assets/feature-security.jpg", preview: featureSecurity },
  { label: "4MP Vandal-Proof Dome Camera", category: "CCTV", url: "/src/assets/offer-security.jpg", preview: offerSecurity },
];

const ASSET_MAP: Record<string, string> = {
  "/src/assets/bg-panel-closeup.jpg": bgPanelCloseup,
  "/src/assets/feature-solar-panel.jpg": featureSolarPanel,
  "/src/assets/bg-commercial-solar.jpg": bgCommercialSolar,
  "/src/assets/offer-solar.jpg": offerSolar,
  "/src/assets/cat-solar.jpg": catSolar,
  "/src/assets/bg-solar-field.jpg": bgSolarField,

  "/src/assets/feature-battery.jpg": featureBattery,
  "/src/assets/bg-bundle.jpg": bgBundle,
  "/src/assets/bg-circuit.jpg": bgCircuit,

  "/src/assets/bg-smartlock-elite.jpg": bgSmartlockElite,
  "/src/assets/bg-smartlock-apex.jpg": bgSmartlockApex,
  "/src/assets/bg-smartlock-pro.jpg": bgSmartlockPro,
  "/src/assets/bg-smartlock-base.jpg": bgSmartlockBase,
  "/src/assets/bg-smartlock-accessory.jpg": bgSmartlockAccessory,
  "/src/assets/bg-smartlock-hotel.jpg": bgSmartlockHotel,

  "/src/assets/feature-smart-automation-device.jpg": featureSmartAutomationDevice,
  "/src/assets/feature-control-panel.jpg": featureControlPanel,
  "/src/assets/feature-smart-app.jpg": featureSmartApp,
  "/src/assets/feature-tablet-monitor.jpg": featureTabletMonitor,
  "/src/assets/hero-smart-home.jpg": heroSmartHome,

  "/src/assets/feature-cctv.jpg": featureCctv,
  "/src/assets/feature-security.jpg": featureSecurity,
  "/src/assets/offer-security.jpg": offerSecurity,
};

export function resolveProductImage(url?: string | null, category?: string): string {
  if (!url) {
    if (category?.toLowerCase().includes("inverter")) return bgPanelCloseup;
    if (category?.toLowerCase().includes("batter")) return featureBattery;
    if (category?.toLowerCase().includes("panel")) return featureSolarPanel;
    if (category?.toLowerCase().includes("lock")) return bgSmartlockElite;
    if (category?.toLowerCase().includes("cctv")) return featureCctv;
    return featureSmartAutomationDevice;
  }

  if (ASSET_MAP[url]) {
    return ASSET_MAP[url];
  }

  return url;
}

/**
 * Returns a collection of multi-angle images for a product to power the rich gallery
 */
export function getMultiAngleProductImages(primaryUrl?: string | null, category?: string): string[] {
  const primary = resolveProductImage(primaryUrl, category);
  const cat = (category || "").toLowerCase();

  let alternates: string[] = [];
  if (cat.includes("inverter")) {
    alternates = [offerSolar, catSolar, bgSolarField, bgCommercialSolar];
  } else if (cat.includes("batter")) {
    alternates = [bgBundle, bgCircuit, featureBattery];
  } else if (cat.includes("panel")) {
    alternates = [bgCommercialSolar, bgPanelCloseup, bgSolarField];
  } else if (cat.includes("lock")) {
    alternates = [bgSmartlockApex, bgSmartlockPro, bgSmartlockBase, bgSmartlockElite];
  } else if (cat.includes("cctv")) {
    alternates = [featureSecurity, offerSecurity, featureCctv];
  } else {
    alternates = [featureControlPanel, featureTabletMonitor, featureSmartApp, heroSmartHome];
  }

  const gallery = [primary, ...alternates.filter((img) => img !== primary)];
  return gallery.slice(0, 4);
}
