import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import decisions from "../../docs/image-audit-2026-10-28/image-decisions.json";
import overrides from "@/data/retailImageOverrides.json";
import { PRODUCTS } from "@/data/products";
import { handleProductImageError, PRODUCT_PHOTO_PENDING, resolveProductImage } from "@/lib/productImages";

describe("Retail image audit safeguards", () => {
  it("applies reviewed replacements and withdrawals consistently", () => {
    for (const [original, image] of Object.entries(overrides)) {
      expect(resolveProductImage(original)).toBe(image);
      expect(fs.existsSync(path.resolve("public" + image)), image).toBe(true);
    }
    expect(resolveProductImage("/products/items/product-0047.webp")).toBe(PRODUCT_PHOTO_PENDING);
    expect(resolveProductImage("/products/blue-carbon/inv-001-bc-1.5kva-12v-hybrid.webp")).toBe(PRODUCT_PHOTO_PENDING);
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

  it("all catalogue image results exist, including the explicitly labelled pending state", () => {
    for (const p of PRODUCTS) {
      const image = resolveProductImage(p.image_url, p.category, p.name);
      expect(fs.existsSync(path.resolve("public" + image)), p.name).toBe(true);
    }
  });

  it("broken images use the neutral pending state without substituting another product", () => {
    const image = document.createElement("img");
    image.src = "/missing-product.webp";
    const event = { currentTarget: image } as Parameters<typeof handleProductImageError>[0];
    handleProductImageError(event);
    expect(image.getAttribute("src")).toBe(PRODUCT_PHOTO_PENDING);
    handleProductImageError(event);
    expect(image.getAttribute("src")).toBe(PRODUCT_PHOTO_PENDING);
  });
});
