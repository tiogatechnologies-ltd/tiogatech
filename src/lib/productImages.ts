import type { SyntheticEvent } from "react";
import retailImageOverrides from "@/data/retailImageOverrides.json";
import representativeImages from "@/data/retailRepresentativeImages.json";
import photos from "@/data/retailPhotoFallbacks.json";
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
  { label: "3D Face ID Biometric Lock", category: "Smart Locks", url: "/products/clear/lock-face-recognition.webp", preview: "/products/clear/lock-face-recognition.webp" },
  { label: "Apex Fingerprint Mortise Lock", category: "Smart Locks", url: "/products/clear/lock-fingerprint-handle.webp", preview: "/products/clear/lock-fingerprint-handle.webp" },
  { label: "Slim Aluminum Door Lock", category: "Smart Locks", url: "/products/clear/lock-slim-aluminum.webp", preview: "/products/clear/lock-slim-aluminum.webp" },
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
  { label: "Elite 3D Face ID Lock", category: "Smart Locks", url: "/src/assets/bg-smartlock-elite.jpg", preview: bgSmartlockElite },
  { label: "Apex Biometric Lock", category: "Smart Locks", url: "/src/assets/bg-smartlock-apex.jpg", preview: bgSmartlockApex },
  { label: "Pro Slim Aluminum Lock", category: "Smart Locks", url: "/src/assets/bg-smartlock-pro.jpg", preview: bgSmartlockPro },
  { label: "Base Gate & Heavy Duty Lock", category: "Smart Locks", url: "/src/assets/bg-smartlock-base.jpg", preview: bgSmartlockBase },
  { label: "Biometric Smart Padlock", category: "Smart Locks", url: "/src/assets/bg-smartlock-accessory.jpg", preview: bgSmartlockAccessory },
  { label: "Smart Hotel Access Ecosystem", category: "Smart Locks", url: "/src/assets/bg-smartlock-hotel.jpg", preview: bgSmartlockHotel },

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

export const PRODUCT_PHOTO_PENDING = "/products/photo-pending.svg";

// Model aliases cover database listings whose names differ from the static catalogue.
function modelPhoto(name = ""): string | undefined {
  if (/felicity/i.test(name)) {
    if (/lpbf\s*48100/i.test(name)) return "/products/felicity/fel-bat-fl-lpbf48100.webp";
    if (/lpbf\s*48200/i.test(name)) return "/products/felicity/fel-bat-fl-lpbf48200.webp";
  }
  if (/deye.*8\s*kw/i.test(name)) return "/products/core/deye-8kw-hybrid.webp";
  if (/deye.*5\s*kw/i.test(name)) return "/products/core/deye-5kw-hybrid.webp";
  return undefined;
}

/** Owner-authorized representative photos. Match the hardware type before broad categories. */
export function getProductPhotoFallback(category = "", name = ""): string {
  const exact = modelPhoto(name);
  if (exact) return exact;
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (/charge controller|mppt.*controller/.test(n)) return photos.chargeController;
  if (/\bfan\b/.test(n)) return photos.fan;
  if (/hard disk|hard drive/.test(n)) return photos.hardDisk;
  if (/\bups\b.*router|power supply.*camera/.test(n)) return photos.ups;
  if (/web\s?cam/.test(n)) return photos.webcam;
  if (/lock|padlock/.test(n)) return /face|3d|k209|i9300|v81c/.test(n) ? photos.lockFace : photos.lockHandle;
  if (/doorbell|door bell/.test(n)) return /chime|extra doorbell/.test(n) ? photos.chime : photos.doorbell;
  if (/curtain robot/.test(n)) return photos.curtainRobot;
  if (/blind motor|shade motor|roller motor/.test(n)) return photos.curtainMotor;
  if (/curtain|version track/.test(n)) return photos.curtainTrack;
  if (/transformer|led driver/.test(n)) return photos.transformer;
  if (/strip|running light/.test(n)) return photos.ledStrip;
  if (/connector|power head|recessed part/.test(n)) return photos.trackConnector;
  if (/subwoofer/.test(n)) return photos.subwoofer;
  if (/ceiling.*speaker|passive.*speaker|speaker.*passive/.test(n)) return photos.ceilingSpeaker;
  if (/amplifier/.test(n)) return photos.amplifier;
  if (/speaker/.test(n)) return photos.speaker;
  if (/power station|solar generator|vitabank/.test(n)) return photos.powerStation;
  if (/solar.*(?:panel|mono|poly)|photovoltaic/.test(n)) return photos.panel;
  if (/expansion pole/.test(n)) return photos.pole;
  if (/street light/.test(n)) return photos.streetLight;
  if (/solar flood/.test(n)) return photos.solarFlood;
  if (/all.in.one/.test(n)) return photos.allInOne;
  if (/battery|lifepo4|lithium/.test(n)) return photos.battery;
  if (/inverter/.test(n)) return photos.inverter;
  if (/camera|ptz|cctv/.test(n)) return /solar|outdoor/.test(n) ? photos.solarCamera : photos.camera;
  if (/gas/.test(n)) return photos.gasSensor;
  if (/door sensor|window sensor/.test(n)) return photos.doorSensor;
  if (/presence/.test(n)) return photos.presenceSensor;
  if (/sensor|alarm/.test(n)) return photos.motionSensor;
  if (/smart.*plug|wifi.*plug/.test(n)) return photos.plug;
  if (/socket/.test(n)) return /double/.test(n) ? photos.doubleSocket : photos.socket;
  if (/dimmer/.test(n)) return photos.dimmer;
  if (/water heat|\bac\b.*switch|air conditioner/.test(n)) return photos.heater;
  if (/scene/.test(n)) return photos.scene;
  if (/switch/.test(n)) {
    if (/4\s*gang/.test(n)) return photos.switch4;
    if (/3\s*gang/.test(n)) return photos.switch3;
    if (/2\s*gang/.test(n)) return photos.switch2;
    return photos.switch1;
  }
  if (/gateway|network/.test(n)) return photos.gateway;
  if (/lighting|light|track/.test(n)) return photos.trackLight;
  if (/charge controller/.test(c)) return photos.chargeController;
  if (/solar panels/.test(c)) return photos.panel;
  if (/batter/.test(c)) return photos.battery;
  if (/inverter/.test(c)) return photos.inverter;
  if (/portable power/.test(c)) return photos.powerStation;
  if (/all.in.one/.test(c)) return photos.allInOne;
  if (/ess/.test(c)) return photos.commercialEss;
  if (/lock/.test(c)) return photos.lockFace;
  if (/camera|cctv/.test(c)) return photos.camera;
  if (/switch/.test(c)) return photos.switch1;
  if (/sensor/.test(c)) return photos.motionSensor;
  if (/curtain/.test(c)) return photos.curtainTrack;
  if (/gateway|network/.test(c)) return photos.gateway;
  if (/audio|intercom/.test(c)) return photos.speaker;
  if (/street light/.test(c)) return photos.streetLight;
  if (/light|track/.test(c)) return photos.trackLight;
  return photos.controlPanel;
}

export function resolveProductImage(url?: string | null, category?: string, name?: string): string {
  const original = url?.trim();
  if (!original || original === PRODUCT_PHOTO_PENDING || original.startsWith("/products/minisim/")) return getProductPhotoFallback(category, name);
  const overrides: Record<string, string> = retailImageOverrides;
  return overrides[original] || ASSET_MAP[original] || original;
}

export function isRepresentativeProductImage(url?: string | null, _category?: string, name?: string): boolean {
  const original = url?.trim();
  if (!original || original === PRODUCT_PHOTO_PENDING || original.startsWith("/products/minisim/")) return !modelPhoto(name);
  return Object.prototype.hasOwnProperty.call(representativeImages, original);
}

export function handleProductImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  const fallback = getProductPhotoFallback(image.dataset.productCategory, image.dataset.productName || image.alt);
  // Stop after one replacement, including when a locally hosted fallback fails.
  if (image.dataset.photoFallbackSrc === image.getAttribute("src") || image.getAttribute("src") === fallback) return;
  image.dataset.photoFallbackSrc = fallback;
  image.src = fallback;
  image.title = "Representative image";
  const note = image.closest("[data-product-photo-container]")?.querySelector<HTMLElement>("[data-product-photo-note]");
  if (note) note.hidden = false;
}

/**
 * Returns a collection of multi-angle images for a product to power the rich gallery
 */
export function getMultiAngleProductImages(primaryUrl?: string | null, category?: string, name?: string): string[] {
  const primary = resolveProductImage(primaryUrl, category, name);
  return primary ? [primary] : [];
}
