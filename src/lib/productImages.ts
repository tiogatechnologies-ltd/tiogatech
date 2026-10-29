import type { SyntheticEvent } from "react";
import retailImageOverrides from "@/data/retailImageOverrides.json";
import representativeImages from "@/data/retailRepresentativeImages.json";
import photos from "@/data/retailPhotoFallbacks.json";
import brandPhotos from "@/data/retailBrandPhotoFallbacks.json";
import photoCaptions from "@/data/retailPhotoCaptions.json";
import { photoBrandKey, photoNameKey, productPhotoForm } from "./productPhotoIdentity";
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

// Brand-specific choices only. A category alone is never enough to select a photo.
export const STOCK_IMAGE_LIBRARY: StockImageOption[] = [
  { label: "Luxpower VitaBank 500", category: "Portable Power Stations", original: "/products/luxpower/luxpower-vitabank-500-power-station.webp" },
  { label: "Deye BOS-G battery module", category: "Batteries", original: "/products/deye/deye-bos-g-pro-5kwh-module.webp" },
  { label: "Felicity SCCM charge-controller family", category: "Charge Controllers", original: "/products/felicity/fel-mppt-fl-sccm6048-li.webp" },
  { label: "Infini HP800 inverter family", category: "Inverters", original: "/products/infinisolar/infini-hp800-5-5kva-48v.webp" },
].map(({ label, category, original }) => ({ label, category, url: retailImageOverrides[original], preview: retailImageOverrides[original] }));

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
    if (/lpbf\s*48100/i.test(name)) return retailImageOverrides["/products/felicity/fel-bat-fl-lpbf48100.webp"];
    if (/lpbf\s*48200/i.test(name)) return retailImageOverrides["/products/felicity/fel-bat-fl-lpbf48200.webp"];
  }
  if (/deye.*8\s*kw/i.test(name)) return "/products/core/deye-8kw-hybrid.webp";
  if (/deye.*5\s*kw/i.test(name)) return "/products/core/deye-5kw-hybrid.webp";
  return undefined;
}

/** Preserve product identity before considering any representative photograph. */
export function getProductPhotoFallback(category = "", name = "", brand = ""): string {
  const names: Record<string, string> = brandPhotos.names;
  const assigned = names[photoNameKey(name)];
  if (assigned) return assigned;
  const exact = modelPhoto(name);
  if (exact) return exact;
  const families: Record<string, Record<string, string>> = brandPhotos.brands;
  const key = photoNameKey(name);
  const brandKey = brand ? photoBrandKey(brand)
    : /exulted|^dealer/i.test(name) ? "exultedeagles"
      : /sorotech|sorotec/i.test(name) ? "sorotec"
        : Object.keys(families).find(b => key.includes(b));
  const form = productPhotoForm(name, category);
  if (brandKey && !/^(?:tuya|tioga)/.test(brandKey)) return families[brandKey]?.[form] || "";
  // Solar equipment must have a known brand and matching form. Never use a Deye,
  // Itel, Felicity, etc. image as a universal category fallback.
  if (form && !["fan", "pole"].includes(form)) return "";
  const n = name.toLowerCase();
  const c = category.toLowerCase();
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
  if (/expansion pole/.test(n)) return photos.pole;
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
  if (/lock/.test(c)) return photos.lockFace;
  if (/camera|cctv/.test(c)) return photos.camera;
  if (/switch/.test(c)) return photos.switch1;
  if (/sensor/.test(c)) return photos.motionSensor;
  if (/curtain/.test(c)) return photos.curtainTrack;
  if (/gateway|network/.test(c)) return photos.gateway;
  if (/audio|intercom/.test(c)) return photos.speaker;
  if (/light|track/.test(c)) return photos.trackLight;
  return photos.controlPanel;
}

export function resolveProductImage(url?: string | null, category?: string, name?: string): string {
  // Saved carts may hold a previously resolved (wrong-brand) URL. The reviewed
  // product name takes precedence without changing that URL for its real brand.
  const reviewed: Record<string, { image: string }> = brandPhotos.reviewedNames;
  const productPhoto = reviewed[photoNameKey(name)];
  if (productPhoto) return productPhoto.image;
  const original = url?.trim();
  if (!original || original === PRODUCT_PHOTO_PENDING || original.startsWith("/products/minisim/")) return getProductPhotoFallback(category, name);
  const overrides: Record<string, string> = retailImageOverrides;
  return overrides[original] || ASSET_MAP[original] || original;
}

export function isRepresentativeProductImage(url?: string | null, _category?: string, name?: string): boolean {
  const reviewed: Record<string, { representative: boolean }> = brandPhotos.reviewedNames;
  const productPhoto = reviewed[photoNameKey(name)];
  if (productPhoto) return productPhoto.representative;
  const original = url?.trim();
  if (!original || original === PRODUCT_PHOTO_PENDING || original.startsWith("/products/minisim/")) return !modelPhoto(name) && !brandPhotos.exactNames.includes(photoNameKey(name));
  return Object.prototype.hasOwnProperty.call(representativeImages, original);
}

export function getProductPhotoCaption(url?: string | null, name?: string): string {
  const reviewed: Record<string, { caption: string }> = brandPhotos.reviewedNames;
  const captions: Record<string, string> = photoCaptions;
  return reviewed[photoNameKey(name)]?.caption || captions[url?.trim() || ""] || "Representative image";
}

export function handleProductImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  const fallback = getProductPhotoFallback(image.dataset.productCategory, image.dataset.productName || image.alt, image.dataset.productBrand);
  // Stop after one replacement, including when a locally hosted fallback fails.
  if (!fallback || image.dataset.photoFallbackSrc === image.getAttribute("src") || image.getAttribute("src") === fallback) return;
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
