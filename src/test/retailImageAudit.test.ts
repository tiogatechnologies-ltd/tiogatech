import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import decisions from "../../docs/image-audit-2026-10-28/image-decisions.json";
import overrides from "@/data/retailImageOverrides.json";
import corrections from "../../docs/image-audit-2026-10-29/brand-corrections.json";
import brandFallbacks from "@/data/retailBrandPhotoFallbacks.json";
import { photoBrandKey, productPhotoForm } from "@/lib/productPhotoIdentity";
import { PRODUCTS } from "@/data/products";
import { getMultiAngleProductImages, getProductPhotoFallback, getProductPhotoCaption, isRepresentativeProductImage, handleProductImageError, PRODUCT_PHOTO_PENDING, resolveProductImage } from "@/lib/productImages";

describe("Retail image audit safeguards", () => {
  it("applies reviewed originals and representative replacements consistently", () => {
    for (const [original, image] of Object.entries(overrides)) {
      expect(resolveProductImage(original)).toBe(image);
      expect(fs.existsSync(path.resolve("public" + image)), image).toBe(true);
    }
    expect(resolveProductImage("/products/items/product-0047.webp")).not.toBe(PRODUCT_PHOTO_PENDING);
    expect(resolveProductImage("/products/blue-carbon/inv-001-bc-1.5kva-12v-hybrid.webp")).not.toBe(PRODUCT_PHOTO_PENDING);
    expect(resolveProductImage("/products/blue-carbon/inv-021-bc-4kva-hybrid.webp")).toMatch(/^\/products\/verified\//);
    expect(resolveProductImage("/products/ecoflow/ecoflow-delta-2-max.webp")).toMatch(/^\/products\/verified\//);
  });

  it("records the actual source dimensions and never enlarges an original", async () => {
    const photos = Object.values(decisions).filter(d => d.status === "source-matched") as Array<{
      image: string; source: string; sourcePage: string; width: number; height: number;
    }>;
    expect(photos.length).toBeGreaterThan(100);
    for (const photo of photos) {
      expect(photo.source).toMatch(/^https:\/\//);
      expect(photo.sourcePage).toMatch(/^https:\/\//);
      const meta = await sharp(path.resolve("public" + photo.image)).metadata();
      expect(meta.width).toBeLessThanOrEqual(photo.width);
      expect(meta.height).toBeLessThanOrEqual(photo.height);
    }
  });

  it("every catalogue product has an existing photograph instead of a pending state", () => {
    for (const p of PRODUCTS) {
      const image = resolveProductImage(p.image_url, p.category, p.name);
      expect(image, p.name).not.toBe(PRODUCT_PHOTO_PENDING);
      expect(fs.existsSync(path.resolve("public" + image)), p.name).toBe(true);
    }
  });

  it("resolves the three database products shown in the customer screenshot", () => {
    for (const [model, path] of [["FL-LPBF48100", "/products/felicity/fel-bat-fl-lpbf48100.webp"], ["FL-LPBF48200", "/products/felicity/fel-bat-fl-lpbf48200.webp"]]) {
      const name = "Felicity Solar Lithium Battery (" + model + ")";
      expect(resolveProductImage(null, "Batteries", name)).toBe(resolveProductImage(path));
      expect(getMultiAngleProductImages(null, "Batteries", name)).toEqual([resolveProductImage(path)]);
      expect(isRepresentativeProductImage(null, "Batteries", name)).toBe(false);
    }
    const name = "Tioga Smart Lock 3D Face ID Pro with Video Doorbell";
    expect(resolveProductImage(null, "Smart Locks", name)).toBe("/products/core/stama-k209-face-lock.webp");
    expect(isRepresentativeProductImage(null, "Smart Locks", name)).toBe(true);
  });

  it("matches representative hardware by subtype even when a catalogue category is inaccurate", () => {
    expect(getProductPhotoFallback("Commercial ESS", 'Infini 18" Standing Fan')).toBe(getProductPhotoFallback("", "Rechargeable fan"));
    expect(getProductPhotoFallback("Smart Door Locks", "Outdoor Motion Sensor")).toBe(getProductPhotoFallback("", "Motion sensor"));
    expect(getProductPhotoFallback("Smart Audio & Intercom", "Smart Curtain Robot")).toBe(getProductPhotoFallback("", "Curtain robot"));
    expect(getProductPhotoFallback("Portable Power Stations", "MECO solar generator with solar panel")).toBe(brandFallbacks.brands.meco["power-station"]);
    expect(getProductPhotoFallback("Smart Switches & Sockets", "4 Gang switch")).not.toBe(getProductPhotoFallback("", "1 Gang switch"));
    expect(getProductPhotoFallback("", "Infini 60A MPPT Charge Controller")).not.toBe(getProductPhotoFallback("", "Infini Hybrid Inverter"));
  });

  it("uses a fitting photo on error, reveals its label and does not loop", () => {
    const container = document.createElement("div");
    container.dataset.productPhotoContainer = "";
    const image = document.createElement("img");
    image.alt = "Felicity battery";
    const note = document.createElement("span");
    note.dataset.productPhotoNote = "";
    note.hidden = true;
    container.append(image, note);
    image.src = "/missing-product.webp";
    const event = { currentTarget: image } as Parameters<typeof handleProductImageError>[0];
    handleProductImageError(event);
    const fallback = getProductPhotoFallback("", image.alt);
    expect(image.getAttribute("src")).toBe(fallback);
    expect(note.hidden).toBe(false);
    handleProductImageError(event);
    expect(image.getAttribute("src")).toBe(fallback);
    image.src = "/another-product.webp";
    image.alt = "Solar panel";
    handleProductImageError(event);
    // An unidentified solar brand must never acquire another manufacturer's photo.
    expect(getProductPhotoFallback("", "Solar panel")).toBe("");
    expect(image.getAttribute("src")).toBe("/another-product.webp");
  });

  it("every new correction preserves the catalogue brand and has a traceable source", async () => {
    expect(Object.keys(corrections).length).toBeGreaterThan(200);
    for (const [original, correction] of Object.entries(corrections)) {
      const products = PRODUCTS.filter(p => p.image_url === original);
      expect(products.length, original).toBeGreaterThan(0);
      for (const product of products) expect(photoBrandKey(product.brand), product.name).toBe(photoBrandKey(correction.brand));
      expect(resolveProductImage(original)).toBe(correction.image);
      expect(correction.sourcePage).toMatch(/^https:\/\//);
      const metadata = await sharp(path.resolve("public" + correction.image)).metadata();
      expect(metadata.width).toBeLessThanOrEqual(correction.width);
      expect(metadata.height).toBeLessThanOrEqual(correction.height);
    }
  });

  it("keeps the VitaBank, Deye modules, complete systems and empty racks distinct", () => {
    const vita = PRODUCTS.find(p => /Vitabank 500/i.test(p.name))!;
    const photo = corrections[vita.image_url as keyof typeof corrections];
    expect(photo.brand).toBe("Luxpower");
    expect(photo.sourcePage).toBe("https://luxpowertek.com/product-history/");
    expect(photo.kind).toBe("exact-model");
    expect(isRepresentativeProductImage(vita.image_url, vita.category, vita.name)).toBe(false);
    const oldItelPhoto = "/products/verified/b771f5f645f01f76.webp";
    expect(resolveProductImage(oldItelPhoto, vita.category, vita.name)).toBe(photo.image);
    expect(resolveProductImage(oldItelPhoto, "Portable Power Stations", "Itel Power Tank")).toBe(oldItelPhoto);
    const deye = PRODUCTS.filter(p => /^Deye BOS-G (?:Pro 5kWh Module|40kWh System|60kWh System)$/.test(p.name));
    expect(deye).toHaveLength(3);
    expect(new Set(deye.map(p => resolveProductImage(p.image_url))).size).toBe(3);
    const module = deye.find(p => /Module$/.test(p.name))!;
    expect(corrections[module.image_url as keyof typeof corrections].form).toBe("battery-module");
    for (const p of deye.filter(p => /System$/.test(p.name))) expect(corrections[p.image_url as keyof typeof corrections].form).toBe("battery-system");
    expect(productPhotoForm("Deye 11-Layer Battery Rack for BOS-A High Voltage System")).toBe("empty-rack");
    expect(productPhotoForm("Deye BOS-G-PDU-2 High Voltage Battery Cluster Controller Box")).toBe("controller-box");
  });

  it("preserves brand and hardware form for missing and failed images", () => {
    expect(getProductPhotoFallback("Portable Power Stations", "Luxpower VitaBank new model")).toBe(brandFallbacks.brands.luxpower["power-station"]);
    expect(getProductPhotoFallback("Batteries", "Deye battery module new model")).toBe(brandFallbacks.brands.deye["battery-module"]);
    expect(getProductPhotoFallback("Batteries", "Deye 9-layer rack new model")).toBe(brandFallbacks.brands.deye["empty-rack"]);
    expect(getProductPhotoFallback("Charge Controllers", "Infini MPPT controller")).toBe(brandFallbacks.brands.infini["charge-controller"]);
    expect(getProductPhotoFallback("Inverters", "An unknown Acme inverter")).toBe("");
    expect(getProductPhotoFallback("Batteries", "Luxpower parallel cable", "Luxpower")).toBe("");
    for (const [original, correction] of Object.entries(corrections)) {
      if (/exact floodlight/.test(correction.reason)) expect(getProductPhotoCaption(original)).toBe("Related Bread street light shown");
    }
  });
});
