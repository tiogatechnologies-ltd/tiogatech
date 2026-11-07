import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PRODUCTS } from "../data/products";
import { lifesmartProducts } from "../data/lifesmartProducts";
import { hdlProducts } from "../data/hdlProducts";
import { MINISIM_PRODUCTS } from "../data/minisimProducts";

describe("Smart Home OEM Master Catalog Integration", () => {
  it("contains all 109 LifeSmart products with authentic images and valid pricing", () => {
    expect(lifesmartProducts).toHaveLength(109);
    for (const p of lifesmartProducts) {
      expect(p.brand).toBe("LifeSmart");
      expect(p.numeric_price).toBeGreaterThan(0);
      expect(p.price).toMatch(/^₦[\d,]+$/);
      expect(p.image_url).toMatch(/^\/products\/lifesmart\/ls-\d{3}\.webp$/);
      expect(p.features.length).toBeGreaterThan(0);
      expect(p.specifications).toBeDefined();

      const diskPath = path.join(process.cwd(), "public", p.image_url!.replace(/^\//, ""));
      expect(fs.existsSync(diskPath)).toBe(true);
      const stat = fs.statSync(diskPath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });

  it("contains all 236 HDL Automation products with authentic images and valid pricing", () => {
    expect(hdlProducts).toHaveLength(236);
    for (const p of hdlProducts) {
      expect(p.brand).toBe("HDL");
      expect(p.numeric_price).toBeGreaterThan(0);
      expect(p.price).toMatch(/^₦[\d,]+$/);
      expect(p.image_url).toMatch(/^\/products\/hdl\/hd-\d{3}\.webp$/);
      expect(p.features.length).toBeGreaterThan(0);
      expect(p.specifications).toBeDefined();

      const diskPath = path.join(process.cwd(), "public", p.image_url!.replace(/^\//, ""));
      expect(fs.existsSync(diskPath)).toBe(true);
      const stat = fs.statSync(diskPath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });

  it("contains all 585 Minisim Smart Home products with authentic images and valid pricing", () => {
    expect(MINISIM_PRODUCTS).toHaveLength(585);
    for (const p of MINISIM_PRODUCTS) {
      expect(p.numeric_price).toBeGreaterThan(0);
      expect(p.price).toMatch(/^₦[\d,]+$/);
      expect(p.image_url).toMatch(/^\/products\/items\/product-\d{4}\.webp$/);

      const diskPath = path.join(process.cwd(), "public", p.image_url!.replace(/^\//, ""));
      expect(fs.existsSync(diskPath)).toBe(true);
      const stat = fs.statSync(diskPath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });

  it("merges all 930 smart home products into the unified PRODUCTS catalog without duplicate IDs", () => {
    const smartHomeOEMProducts = PRODUCTS.filter(
      (p) => p.brand === "LifeSmart" || p.brand === "HDL" || p.id.startsWith("b0000000-")
    );
    expect(smartHomeOEMProducts).toHaveLength(930);

    const allIds = new Set(PRODUCTS.map((p) => p.id));
    expect(allIds.size).toBe(PRODUCTS.length);
  });
});
