import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PRODUCTS } from "@/data/products";
import { mergeProducts } from "@/lib/mergeProducts";
import { resolveProductImage } from "@/lib/productImages";
import { getSolarPackageImage } from "@/hooks/useSolarPackages";
import { getSmartLockImage } from "@/hooks/useSmartLocks";
import { getDefaultPackageImage } from "@/lib/packageImages";

describe("Product and Package Real Images", () => {
  it("every Deye product in catalog has an authentic, existing image", () => {
    const deyeProducts = PRODUCTS.filter((p) => p.name.toLowerCase().includes("deye"));
    expect(deyeProducts.length).toBeGreaterThanOrEqual(3);

    for (const p of deyeProducts) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url).toMatch(/\.(webp|jpg|png)$/);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Image file should exist on disk in public: ${filePath}`).toBe(true);
    }
  });

  it("mergeProducts preserves authentic image when DB row has null image_url", () => {
    const dbRowsWithNullImages = [
      {
        id: "11111111-1111-1111-1111-111111111001",
        name: "Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)",
        category: "solar",
        image_url: null,
      },
      {
        id: "11111111-1111-1111-1111-111111111002",
        name: "Deye 8kW Hybrid Inverter (SUN-8K-SG01LP1-EU)",
        category: "solar",
        image_url: null,
      },
    ];

    const merged = mergeProducts(PRODUCTS, dbRowsWithNullImages as any);
    const deye5k = merged.find((p) => p.name.includes("Deye 5kW"));
    const deye8k = merged.find((p) => p.name.includes("Deye 8kW"));

    expect(deye5k?.image_url).toBe("/products/core/deye-5kw-hybrid.webp");
    expect(deye8k?.image_url).toBe("/products/core/deye-8kw-hybrid.webp");
  });

  it("resolveProductImage provides authentic fallbacks for Deye inverters", () => {
    const resolved5k = resolveProductImage(null, "solar", "Deye 5kW Hybrid Inverter");
    const resolved8k = resolveProductImage(null, "solar", "Deye 8kW Hybrid Inverter");
    const resolved12k = resolveProductImage(null, "solar", "Deye 12kW Three-Phase Hybrid Inverter");

    expect(resolved5k).toBe("/products/core/deye-5kw-hybrid.webp");
    expect(resolved8k).toBe("/products/core/deye-8kw-hybrid.webp");
    expect(resolved12k).toBe("/products/core/deye-12kw-three-phase.webp");

    expect(fs.existsSync(path.resolve("public" + resolved5k))).toBe(true);
    expect(fs.existsSync(path.resolve("public" + resolved8k))).toBe(true);
    expect(fs.existsSync(path.resolve("public" + resolved12k))).toBe(true);
  });

  it("all 19 solar package capacities resolve to real hardware images", () => {
    for (let i = 1; i <= 19; i++) {
      const img = getSolarPackageImage({ package_number: i });
      expect(img).toBeTruthy();
      expect(fs.existsSync(path.resolve("public" + img)), `Solar pkg #${i} image must exist: ${img}`).toBe(true);
      expect(img.startsWith("/products/core/")).toBe(true);
    }
  });

  it("smart lock models resolve to authentic hardware images", () => {
    const models = [
      { name: "Premier-Lux K209", model: "K209", series: "Elite Series", category: "lock" },
      { name: "Premier-Lux S7", model: "S7", series: "Elite Series", category: "lock" },
      { name: "E-Pro D20", model: "D20", series: "Apex Series", category: "lock" },
      { name: "H11", model: "H11", series: "Apex Series", category: "lock" },
      { name: "Wi-Fi SL02", model: "SL02", series: "Pro Series", category: "lock" },
      { name: "BLE TFS", model: "TFS", series: "Pro Series", category: "lock" },
      { name: "N22", model: "N22", series: "Pro Series", category: "lock" },
      { name: "G290 Glass", model: "G290", series: "Base Series", category: "lock" },
      { name: "V80 Gate", model: "V80", series: "Base Series", category: "lock" },
      { name: "KT14 Padlock", model: "KT14", series: "Base Series", category: "lock" },
      { name: "STAMA Hotel System", model: "Hotel", series: "Hotel Ecosystem", category: "hotel" },
    ];

    for (const item of models) {
      const img = getSmartLockImage(item);
      expect(img).toBeTruthy();
      expect(fs.existsSync(path.resolve("public" + img)), `Lock ${item.name} image must exist: ${img}`).toBe(true);
    }
  });

  it("home automation packages resolve to authentic pkg-automation images", () => {
    const apexImg = getDefaultPackageImage("automation", "Apex");
    const auraImg = getDefaultPackageImage("automation", "Aura");
    const rivieraImg = getDefaultPackageImage("automation", "Riviera");

    expect(apexImg).toBe("/products/core/pkg-automation-apex.webp");
    expect(auraImg).toBe("/products/core/pkg-automation-aura.webp");
    expect(rivieraImg).toBe("/products/core/pkg-automation-riviera.webp");

    expect(fs.existsSync(path.resolve("public" + apexImg))).toBe(true);
    expect(fs.existsSync(path.resolve("public" + auraImg))).toBe(true);
    expect(fs.existsSync(path.resolve("public" + rivieraImg))).toBe(true);
  });

  it("all new SRNE inverters, SRNE batteries and solar panels exist with authentic photos on disk", () => {
    const srneProducts = PRODUCTS.filter((p) => p.brand === "SRNE");
    expect(srneProducts.length).toBeGreaterThanOrEqual(17);

    for (const p of srneProducts) {
      expect(p.image_url).toBeTruthy();
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `SRNE image should exist on disk: ${filePath}`).toBe(true);
      expect(p.numeric_price).toBeGreaterThan(0);
    }

    const newPanels = PRODUCTS.filter((p) => ["Longi", "JA Solar", "Jinko"].includes(p.brand || "") && ["610W", "620W", "630W", "725W"].some(w => p.name.includes(w)));
    expect(newPanels.length).toBe(4);

    for (const p of newPanels) {
      expect(p.image_url).toBeTruthy();
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Panel image should exist on disk: ${filePath}`).toBe(true);
      expect(p.numeric_price).toBeGreaterThan(0);
    }
  });
});

