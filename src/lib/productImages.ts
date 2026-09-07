import bgPanelCloseup from "@/assets/bg-panel-closeup.jpg";
import featureSolarPanel from "@/assets/feature-solar-panel.jpg";
import bgCommercialSolar from "@/assets/bg-commercial-solar.jpg";
import offerSolar from "@/assets/bg-rooftop-install.jpg";
import catSolar from "@/assets/bg-rooftop-install.jpg";
import bgSolarField from "@/assets/bg-solar-field.jpg";

import featureBattery from "@/assets/feature-battery.jpg";
import bgBundle from "@/assets/hero-smart-home.jpg";
import bgCircuit from "@/assets/bg-circuit.jpg";

import bgSmartlockElite from "@/assets/bg-smartlock-elite.jpg";
import bgSmartlockApex from "@/assets/bg-smartlock-apex.jpg";
import bgSmartlockPro from "@/assets/bg-smartlock-pro.jpg";
import bgSmartlockBase from "@/assets/bg-smartlock-base.jpg";
import bgSmartlockAccessory from "@/assets/bg-smartlock-accessory.jpg";
import bgSmartlockHotel from "@/assets/bg-smartlock-hotel.jpg";
import stockSmartLock from "@/assets/stock-smart-lock.png";

import featureSmartAutomationDevice from "@/assets/feature-smart-automation-device.jpg";
import featureControlPanel from "@/assets/bg-lagos-apartment.jpg";
import featureSmartApp from "@/assets/feature-smart-app.jpg";
import featureTabletMonitor from "@/assets/feature-tablet-monitor.jpg";
import heroSmartHome from "@/assets/hero-smart-home.jpg";

import featureCctv from "@/assets/feature-cctv.jpg";
import featureSecurity from "@/assets/feature-security.jpg";
import offerSecurity from "@/assets/feature-cctv.jpg";

export interface StockImageOption {
  label: string;
  category: string;
  url: string;
  preview: string;
}

export const STOCK_IMAGE_LIBRARY: StockImageOption[] = [
  // High-Resolution Clear Hardware
  { label: "Deye Hybrid Inverter (Tier-1 Crisp)", category: "Inverters", url: "/products/clear/inverter-deye-hybrid.webp", preview: "/products/clear/inverter-deye-hybrid.webp" },
  { label: "Growatt / Must Solar Inverter", category: "Inverters", url: "/products/clear/inverter-growatt-must.webp", preview: "/products/clear/inverter-growatt-must.webp" },
  { label: "Felicity LiFePO4 Battery (Tier-1 Crisp)", category: "Batteries", url: "/products/clear/battery-felicity-lifepo4.webp", preview: "/products/clear/battery-felicity-lifepo4.webp" },
  { label: "Powerwall & Lithium Rack Battery", category: "Batteries", url: "/products/clear/battery-powerwall-rack.webp", preview: "/products/clear/battery-powerwall-rack.webp" },
  { label: "Longi Hi-MO 5 Solar Module", category: "Solar Panels", url: "/products/clear/panel-longi-solar.webp", preview: "/products/clear/panel-longi-solar.webp" },
  { label: "Canadian Solar Monocrystalline Panel", category: "Solar Panels", url: "/products/clear/panel-canadian-solar.webp", preview: "/products/clear/panel-canadian-solar.webp" },
  { label: "STAMA 3D Face ID Biometric Lock", category: "Smart Locks", url: "/products/clear/lock-face-recognition.webp", preview: "/products/clear/lock-face-recognition.webp" },
  { label: "STAMA Apex Fingerprint Mortise Lock", category: "Smart Locks", url: "/products/clear/lock-fingerprint-handle.webp", preview: "/products/clear/lock-fingerprint-handle.webp" },
  { label: "STAMA Slim Aluminum Door Lock", category: "Smart Locks", url: "/products/clear/lock-slim-aluminum.webp", preview: "/products/clear/lock-slim-aluminum.webp" },
  { label: "Outdoor Solar 4G Dual PTZ Camera", category: "CCTV", url: "/products/clear/camera-ptz-solar.webp", preview: "/products/clear/camera-ptz-solar.webp" },
  { label: "Outdoor PTZ Night Vision Dome Camera", category: "CCTV", url: "/products/clear/camera-ptz-outdoor.webp", preview: "/products/clear/camera-ptz-outdoor.webp" },
  { label: "Tuya Glass Smart Touch Switch", category: "Home Automation", url: "/products/clear/switch-2gang-white.webp", preview: "/products/clear/switch-2gang-white.webp" },
  { label: "Tuya Smart Touch Central Panel", category: "Home Automation", url: "/products/clear/panel-touch-4inch.webp", preview: "/products/clear/panel-touch-4inch.webp" },
  { label: "Frameless Coaxial Ceiling Speaker", category: "Home Automation", url: "/products/clear/speaker-ceiling-coaxial.webp", preview: "/products/clear/speaker-ceiling-coaxial.webp" },

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
  { label: "Biometric Interior Smart Handle Lock", category: "Smart Locks", url: "/src/assets/stock-smart-lock.png", preview: stockSmartLock },
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
  "/src/assets/stock-smart-lock.png": stockSmartLock,

  "/src/assets/feature-smart-automation-device.jpg": featureSmartAutomationDevice,
  "/src/assets/feature-control-panel.jpg": featureControlPanel,
  "/src/assets/feature-smart-app.jpg": featureSmartApp,
  "/src/assets/feature-tablet-monitor.jpg": featureTabletMonitor,
  "/src/assets/hero-smart-home.jpg": heroSmartHome,

  "/src/assets/feature-cctv.jpg": featureCctv,
  "/src/assets/feature-security.jpg": featureSecurity,
  "/src/assets/offer-security.jpg": offerSecurity,
};

export function resolveProductImage(url?: string | null, category?: string, name?: string): string {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();

  // If no URL or older low-res PDF thumbnail, fallback to crystal-clear high-res hardware photo
  if (!url || url.startsWith("/products/minisim/")) {
    if (cat.includes("inverter")) return "/products/clear/inverter-deye-hybrid.webp";
    if (cat.includes("batter")) return "/products/clear/battery-felicity-lifepo4.webp";
    if (cat.includes("panel") && (cat.includes("solar") || n.includes("solar"))) return "/products/clear/panel-longi-solar.webp";
    if (cat.includes("lock")) return "/products/clear/lock-fingerprint-handle.webp";
    if (cat.includes("cctv") || cat.includes("camera")) return "/products/clear/camera-ptz-outdoor.webp";
    if (cat.includes("switch")) return "/products/clear/switch-2gang-white.webp";
    if (cat.includes("socket")) return "/products/clear/socket-single-universal.webp";
    if (cat.includes("sensor") || cat.includes("alarm")) return "/products/clear/sensor-pir-motion.webp";
    if (cat.includes("audio") || cat.includes("speaker") || cat.includes("sound")) return "/products/clear/speaker-ceiling-coaxial.webp";
    if (cat.includes("curtain")) return "/products/clear/curtain-motor-track.webp";
    if (cat.includes("panel") || cat.includes("control")) return "/products/clear/panel-touch-4inch.webp";
    if (cat.includes("light") || cat.includes("track")) return "/products/clear/track-magnetic-rail.webp";
    return "/products/clear/switch-2gang-white.webp";
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
    alternates = [
      "/products/clear/inverter-deye-hybrid.webp",
      "/products/clear/inverter-growatt-must.webp",
      "/products/clear/meter-digital-power.webp",
      "/products/clear/breaker-smart-mcb.webp",
    ];
  } else if (cat.includes("batter")) {
    alternates = [
      "/products/clear/battery-felicity-lifepo4.webp",
      "/products/clear/battery-powerwall-rack.webp",
    ];
  } else if (cat.includes("panel")) {
    alternates = [
      "/products/clear/panel-longi-solar.webp",
      "/products/clear/panel-canadian-solar.webp",
    ];
  } else if (cat.includes("lock")) {
    alternates = [
      "/products/clear/lock-face-recognition.webp",
      "/products/clear/lock-fingerprint-handle.webp",
      "/products/clear/lock-slim-aluminum.webp",
      "/products/clear/lock-glass-door.webp",
    ];
  } else if (cat.includes("cctv") || cat.includes("camera")) {
    alternates = [
      "/products/clear/camera-ptz-solar.webp",
      "/products/clear/camera-ptz-outdoor.webp",
      "/products/clear/camera-ptz-indoor.webp",
      "/products/clear/camera-doorbell-video.webp",
    ];
  } else if (cat.includes("curtain")) {
    alternates = [
      "/products/clear/curtain-motor-track.webp",
      "/products/clear/curtain-roller-shade.webp",
      "/products/clear/curtain-robot.webp",
      "/products/clear/curtain-remote.webp",
    ];
  } else if (cat.includes("sensor") || cat.includes("alarm")) {
    alternates = [
      "/products/clear/sensor-pir-motion.webp",
      "/products/clear/sensor-door-window.webp",
      "/products/clear/sensor-smoke-alarm.webp",
      "/products/clear/sensor-siren-strobe.webp",
    ];
  } else if (cat.includes("audio") || cat.includes("speaker") || cat.includes("sound")) {
    alternates = [
      "/products/clear/speaker-ceiling-coaxial.webp",
      "/products/clear/audio-wall-amplifier.webp",
      "/products/clear/echo-show-screen.webp",
      "/products/clear/echo-dot-speaker.webp",
    ];
  } else if (cat.includes("panel") || cat.includes("control")) {
    alternates = [
      "/products/clear/panel-touch-4inch.webp",
      "/products/clear/panel-touch-6inch.webp",
      "/products/clear/panel-touch-10inch.webp",
      "/products/clear/panel-rotary-knob.webp",
    ];
  } else {
    alternates = [
      "/products/clear/switch-1gang-white.webp",
      "/products/clear/switch-2gang-white.webp",
      "/products/clear/switch-3gang-white.webp",
      "/products/clear/switch-4gang-white.webp",
    ];
  }

  const gallery = [primary, ...alternates.filter((img) => img !== primary)];
  return gallery.slice(0, 4);
}
