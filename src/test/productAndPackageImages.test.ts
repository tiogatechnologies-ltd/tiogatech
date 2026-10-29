import { masterPriceFor } from "@/lib/retailPricing";
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PRODUCTS, expansionCatalogProducts, blueCarbonProducts, dealerProducts } from "@/data/products";
import { mergeProducts } from "@/lib/mergeProducts";
import { resolveProductImage } from "@/lib/productImages";
import { getSolarPackageImage } from "@/hooks/useSolarPackages";
import { getSmartLockImage } from "@/hooks/useSmartLocks";
import { getDefaultPackageImage } from "@/lib/packageImages";

describe("Product and package asset availability and pricing", () => {
  it("every Deye product in catalog has an existing assigned asset", () => {
    const deyeProducts = PRODUCTS.filter((p) => p.name.toLowerCase().includes("deye"));
    expect(deyeProducts.length).toBeGreaterThanOrEqual(3);

    for (const p of deyeProducts) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url).toMatch(/\.(webp|jpg|png)$/);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Image file should exist on disk in public: ${filePath}`).toBe(true);
    }
  });

  it("mergeProducts preserves assigned asset when DB row has null image_url", () => {
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

  it("missing photos use model aliases or fitting owner-authorized representative photos", () => {
    expect(resolveProductImage(null, "Inverters", "Deye 8kW Hybrid Inverter")).toBe("/products/core/deye-8kw-hybrid.webp");
    expect(resolveProductImage(null, "Batteries", "Itel 5kWh")).toMatch(/battery|fel-bat/);
    expect(resolveProductImage("/products/minisim/old.webp", "Smart Locks", "K209")).toBe("/products/core/stama-k209-face-lock.webp");
  });

  it("all 19 solar package capacities resolve to real hardware images and are 100% unique", () => {
    const images = new Set<string>();
    for (let i = 1; i <= 19; i++) {
      const img = getSolarPackageImage({ package_number: i });
      expect(img).toBeTruthy();
      expect(fs.existsSync(path.resolve("public" + img)), `Solar pkg #${i} image must exist: ${img}`).toBe(true);
      expect(img.startsWith("/products/packages/")).toBe(true);
      images.add(img);
    }
    // Zero duplicate images across the 19 packages
    expect(images.size).toBe(19);
  });

  it("smart lock models and accessories resolve to assigned local assets", () => {
    const models = [
      { name: "Premier-Lux K209", model: "K209", series: "Elite Series", category: "lock" },
      { name: "Premier-Lux S7", model: "S7", series: "Elite Series", category: "lock" },
      { name: "Apex-Lux F27 Wi-Fi", model: "F27", series: "Apex Series", category: "lock" },
      { name: "Apex Custom Israeli T8", model: "T8", series: "Apex Series", category: "lock" },
      { name: "E-Pro D20", model: "D20", series: "Apex Series", category: "lock" },
      { name: "H11", model: "H11", series: "Apex Series", category: "lock" },
      { name: "Wi-Fi SL02", model: "SL02", series: "Pro Series", category: "lock" },
      { name: "Standard-Pro N14 BLE", model: "N14", series: "Pro Series", category: "lock" },
      { name: "N22", model: "N22", series: "Pro Series", category: "lock" },
      { name: "Pro X04", model: "X04", series: "Pro Series", category: "lock" },
      { name: "Basic-Pro B16", model: "B16", series: "Pro Series", category: "lock" },
      { name: "BLE TFS", model: "TFS", series: "Pro Series", category: "lock" },
      { name: "G290 Glass", model: "G290", series: "Base Series", category: "lock" },
      { name: "V80 Gate", model: "V80", series: "Base Series", category: "lock" },
      { name: "KT14 Padlock", model: "KT14", series: "Base Series", category: "lock" },
      { name: "Smart Hotel System", model: "Hotel", series: "Hotel Ecosystem", category: "hotel" },
      { name: "Lock Replacement Battery", model: "BATTERY", series: "Accessories", category: "accessory" },
      { name: "Wireless Remote", model: "REMOTE", series: "Accessories", category: "accessory" },
      { name: "Wi-Fi Gateway", model: "GATEWAY", series: "Accessories", category: "accessory" },
      { name: "RFID Access Card", model: "RFID", series: "Accessories", category: "accessory" },
    ];

    const images = new Set<string>();
    for (const item of models) {
      const img = getSmartLockImage(item);
      expect(img).toBeTruthy();
      expect(fs.existsSync(path.resolve("public" + img)), `Lock ${item.name} image must exist: ${img}`).toBe(true);
      images.add(img);
    }
    expect(images.size).toBe(models.length);
  });

  it("home automation packages resolve to assigned pkg-automation images and are unique", () => {
    const apexImg = getDefaultPackageImage("automation", "Apex");
    const auraImg = getDefaultPackageImage("automation", "Aura");
    const rivieraImg = getDefaultPackageImage("automation", "Riviera");

    expect(apexImg).toBe("/products/core/pkg-automation-apex.webp");
    expect(auraImg).toBe("/products/core/pkg-automation-aura.webp");
    expect(rivieraImg).toBe("/products/core/pkg-automation-riviera.webp");

    expect(fs.existsSync(path.resolve("public" + apexImg))).toBe(true);
    expect(fs.existsSync(path.resolve("public" + auraImg))).toBe(true);
    expect(fs.existsSync(path.resolve("public" + rivieraImg))).toBe(true);

    const set = new Set([apexImg, auraImg, rivieraImg]);
    expect(set.size).toBe(3);
  });

  it("CCTV packages resolve to assigned pkg-cctv images and are unique", () => {
    const cctv4 = getDefaultPackageImage("cctv", "4ch");
    const cctv8 = getDefaultPackageImage("cctv", "8ch");
    const cctvPtz = getDefaultPackageImage("cctv", "ptz");

    expect(cctv4).toBe("/products/core/pkg-cctv-4ch-kit.webp");
    expect(cctv8).toBe("/products/core/pkg-cctv-8ch-kit.webp");
    expect(cctvPtz).toBe("/products/core/pkg-cctv-solar-ptz.webp");

    expect(fs.existsSync(path.resolve("public" + cctv4))).toBe(true);
    expect(fs.existsSync(path.resolve("public" + cctv8))).toBe(true);
    expect(fs.existsSync(path.resolve("public" + cctvPtz))).toBe(true);

    const set = new Set([cctv4, cctv8, cctvPtz]);
    expect(set.size).toBe(3);
  });

  it("all new SRNE inverters, SRNE batteries and solar panels exist with local asset references", () => {
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

  it("all Luxpower inverters and batteries exist with local asset references and current master-sheet prices", () => {
    const luxProducts = PRODUCTS.filter((p) => p.brand === "Luxpower");
    expect(luxProducts.length).toBe(30);

    for (const p of luxProducts) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url).toMatch(/\.png$/);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Luxpower image should exist on disk: ${filePath}`).toBe(true);
      if (masterPriceFor(p) === null) { expect(p.numeric_price).toBeUndefined(); expect(p.price).toBeNull(); }
      else { expect(p.numeric_price).toBeGreaterThan(0); expect(p.price).toMatch(/^₦[\d,]+(?:\.\d{2})?$/); }
      expect(p.compare_at_price).toMatch(/^₦[\d,]+$/);

      // The master sheet sets selling prices; compare-at remains independent.
      const basePrice = parseInt(String(p.compare_at_price).replace(/[^\d]/g, ""), 10);
      const expectedDiscounted = masterPriceFor(p) ?? Math.round(basePrice * 0.80);
      expect(p.numeric_price).toBe(expectedDiscounted);
      expect(p.price).toBe(`₦${expectedDiscounted.toLocaleString()}`);
    }

    const uniqueLuxImages = new Set(luxProducts.map((p) => p.image_url));
    expect(uniqueLuxImages.size).toBe(luxProducts.length);
  });

  it("all 81 Felicity products exist with local asset references and current master-sheet pricing", () => {
    const felicityProducts = PRODUCTS.filter((p) => p.brand === "Felicity");
    expect(felicityProducts.length).toBe(81);

    for (const p of felicityProducts) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url).toMatch(/\.webp$/);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Felicity image should exist on disk: ${filePath}`).toBe(true);
      expect(p.numeric_price).toBeGreaterThan(0);
      expect(p.price).toMatch(/^₦[\d,]+$/);
      expect(p.warranty_years).toBeGreaterThanOrEqual(2);
    }

    const uniqueFelicityImages = new Set(felicityProducts.map((p) => p.image_url));
    expect(uniqueFelicityImages.size).toBe(felicityProducts.length);

  });

  it("all AlpSolarr, Taico, Dawnice, Solis, SolarPro, Infinisolar, and Deye products exist with local asset references", () => {
    const alpSolarr = PRODUCTS.filter((p) => p.brand === "AlpSolarr" && !p.id.startsWith("expansion-"));
    const taico = PRODUCTS.filter((p) => p.brand === "Taico" && !p.id.startsWith("expansion-"));
    const dawnice = PRODUCTS.filter((p) => p.brand === "Dawnice" && !p.id.startsWith("expansion-"));
    const solis = PRODUCTS.filter((p) => p.brand === "Solis" && !p.id.startsWith("expansion-"));
    const solarpro = PRODUCTS.filter((p) => p.brand === "SolarPro" && !p.id.startsWith("expansion-"));
    const infini = PRODUCTS.filter((p) => (p.brand === "Infini" || p.brand === "Infinisolar") && !p.id.startsWith("expansion-"));
    const sungene = PRODUCTS.filter((p) => p.brand === "Sungene" && p.category === "Batteries" && !p.id.startsWith("expansion-"));
    const deye = PRODUCTS.filter((p) => p.brand === "Deye" && !p.id.startsWith("expansion-"));

    expect(alpSolarr.length).toBe(12);
    expect(taico.length).toBe(5);
    expect(dawnice.length).toBe(6);
    expect(solis.length).toBe(7);
    expect(solarpro.length).toBe(10);
    expect(infini.length).toBe(8);
    expect(sungene.length).toBe(2);
    expect(deye.length).toBeGreaterThanOrEqual(15);

    const allNewProducts = [...alpSolarr, ...taico, ...dawnice, ...solis, ...solarpro, ...infini, ...sungene, ...deye];

    for (const p of allNewProducts) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url).toMatch(/\.webp$/);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Image file should exist on disk: ${filePath}`).toBe(true);
      if (masterPriceFor(p) === null) {
        expect(p.numeric_price).toBeUndefined();
        expect(p.price).toBeNull();
      } else {
        expect(p.numeric_price).toBeGreaterThan(0);
        expect(p.price).toMatch(/^₦[\d,]+(?:\.\d{2})?$/);
      }
      expect(p.warranty_years).toBeGreaterThanOrEqual(2);

    }

  });

  it("mergeProducts retains all catalog products without ID collision or erasure", () => {
    const staticList = PRODUCTS.map((p) => ({
      ...p,
      category: p.category,
      brand: p.brand,
    }));
    const merged = mergeProducts(staticList, []);
    const alp = merged.filter((p) => p.brand === "AlpSolarr" && !p.id.startsWith("expansion-"));
    const tai = merged.filter((p) => p.brand === "Taico" && !p.id.startsWith("expansion-"));
    const daw = merged.filter((p) => p.brand === "Dawnice" && !p.id.startsWith("expansion-"));
    const sol = merged.filter((p) => p.brand === "Solis" && !p.id.startsWith("expansion-"));
    const sp = merged.filter((p) => p.brand === "SolarPro" && !p.id.startsWith("expansion-"));
    const inf = merged.filter((p) => (p.brand === "Infini" || p.brand === "Infinisolar") && !p.id.startsWith("expansion-"));
    const sung = merged.filter((p) => p.brand === "Sungene" && p.category === "Batteries" && !p.id.startsWith("expansion-"));

    expect(alp.length).toBe(12);
    expect(tai.length).toBe(5);
    expect(daw.length).toBe(6);
    expect(sol.length).toBe(7);
    expect(sp.length).toBe(10);
    expect(inf.length).toBe(8);
    expect(sung.length).toBe(2);
    expect(merged.length).toBeGreaterThanOrEqual(760);
  });

  it("all 25 Itel products exist in catalog with local asset references and exact retail pricing", () => {
    const itel = PRODUCTS.filter((p) => p.brand === "Itel");
    expect(itel.length).toBe(25);

    const expectedRetailPrices: Record<string, number> = {
      "TG-ITEL-0001": 239800,
      "TG-ITEL-0002": 328900,
      "TG-ITEL-0003": 416900,
      "TG-ITEL-0004": 561000,
      "TG-ITEL-0005": 742500,
      "TG-ITEL-0006": 784300,
      "TG-ITEL-0007": 2442000,
      "TG-ITEL-0008": 2574000,
      "TG-ITEL-0009": 1089000,
      "TG-ITEL-0010": 231000,
      "TG-ITEL-0011": 601700,
      "TG-ITEL-0012": 1001000,
      "TG-ITEL-0013": 995500,
      "TG-ITEL-0014": 1037300,
      "TG-ITEL-0015": 1903000,
      "TG-ITEL-0016": 2244000,
      "TG-ITEL-0017": 7502000,
      "TG-ITEL-0018": 2596000,
      "TG-ITEL-0019": 4653000,
      "TG-ITEL-0020": 308000,
      "TG-ITEL-0021": 1727000,
      "TG-ITEL-0022": 83160,
      "TG-ITEL-0023": 145200,
      "TG-ITEL-0024": 105600,
      "TG-ITEL-0025": 151800,
    };

    for (const p of itel) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.startsWith("/products/itel/")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Itel product image must exist: ${filePath}`).toBe(true);

      const expectedPrice = expectedRetailPrices[p.sku || ""];
      expect(p.numeric_price).toBe(expectedPrice);
    }
  });

  it("all 12 Suness products exist in catalog with local asset references and exact retail pricing", () => {
    const suness = PRODUCTS.filter((p) => p.brand === "Suness");
    expect(suness.length).toBe(12);

    const expectedRetailPrices: Record<string, number> = {
      "TG-SUNESS-0001": 2035000,
      "TG-SUNESS-0002": 1925000,
      "TG-SUNESS-0003": 9900000,
      "TG-SUNESS-0004": 13750000,
      "TG-SUNESS-0005": 2310000,
      "TG-SUNESS-0006": 49500000,
      "TG-SUNESS-0007": 1210000,
      "TG-SUNESS-0008": 2090000,
      "TG-SUNESS-0009": 1980000,
      "TG-SUNESS-0010": 2530000,
      "TG-SUNESS-0011": 2750000,
      "TG-SUNESS-0012": 5060000,
    };


    for (const p of suness) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.startsWith("/products/suness/")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Suness product image must exist: ${filePath}`).toBe(true);

      const expectedPrice = expectedRetailPrices[p.sku || ""];
      expect(p.numeric_price).toBe(expectedPrice);

    }

  });

  it("all 10 SolarPro products exist in catalog with local asset references and current master-sheet pricing where listed", () => {
    const solarpro = PRODUCTS.filter((p) => p.brand === "SolarPro");
    expect(solarpro.length).toBe(10);

    const expectedPrices: Record<string, number> = {
      "SOLARPRO-S6-100W": 260000,
      "SOLARPRO-S7-120W": 260000,
      "SOLARPRO-I6-100W": 253500,
      "SOLARPRO-R1-60W": 162500,
      "SOLARPRO-R3-100W": 253500,
      "SOLARPRO-R4-120W": 279500,
      "SOLARPRO-SP-FL-300W": 65000,
      "SOLARPRO-BAT-15KWH": 2800000,
      "SOLARPRO-ESS-60KWH-HV": 15000000,
      "SOLARPRO-ESS-125KWH-HV": 36000000,
    };


    for (const p of solarpro) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.startsWith("/products/solarpro/")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `SolarPro product image must exist: ${filePath}`).toBe(true);

      const expectedPrice = expectedPrices[p.sku || ""];
      expect(p.numeric_price, `Price check for ${p.name}`).toBe(expectedPrice);

    }

  });

  it("all 10 Sungene and Infini products exist in catalog with local asset references and current master-sheet pricing where listed", () => {
    const sungeneAndInfini = PRODUCTS.filter((p) => (p.brand === "Sungene" || p.brand === "Infini") && !p.id.includes("panel"));
    expect(sungeneAndInfini.length).toBe(10);

    const expectedPrices: Record<string, number> = {
      "SUNGENE-BAT-7.6KWH-24V": 766500,
      "SUNGENE-BAT-15KWH-48V": 1950000,
      "INFINI-BAT-10.2KWH-48V": 1700000,
      "INFINI-BAT-15KWH-48V": 1850000,
      "INFINI-HP800-3.5KVA-24V": 300000,
      "INFINI-HP800-5KVA-24V": 360000,
      "INFINI-MPPT-60A": 165000,
      "INFINI-MPPT-100A": 175000,
      "INFINI-FAN-18-REC": 70000,
      "INFINI-FAN-18-SOLAR-KIT": 80000,
    };


    for (const p of sungeneAndInfini) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.startsWith("/products/infinisolar/")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Infini/Sungene product image must exist: ${filePath}`).toBe(true);

      const expectedPrice = expectedPrices[p.sku || ""];
      expect(p.numeric_price, `Price check for ${p.name}`).toBe(expectedPrice);

    }

  });

  it("all 7 Solis inverters exist in catalog with local asset references and current master-sheet pricing where listed", () => {
    const solis = PRODUCTS.filter((p) => p.brand === "Solis" && !p.id.startsWith("expansion-"));
    expect(solis.length).toBe(7);

    const expectedPrices: Record<string, number> = {
      "SOLIS-S6-EO1P5K-48": 650000,
      "SOLIS-S6-EH1P12K": 2580000,
      "SOLIS-S6-EH1P14K": 2640000,
      "SOLIS-S6-EH1P16K": 2760000,
      "SOLIS-S6-EH1P18K": 2820000,
      "SOLIS-S6-EH3P30K-H": 4592640,
      "SOLIS-S6-EH3P50K-H": 6489600,
    };


    for (const p of solis) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.startsWith("/products/solis/")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Solis product image must exist: ${filePath}`).toBe(true);

      const expectedPrice = expectedPrices[p.sku || ""];
      expect(p.numeric_price, `Price check for ${p.name}`).toBe(expectedPrice);

    }

  });

  it("all 6 new Tier-1 Solar Panels from supplier sheets exist in catalog with local asset references and current master-sheet pricing where listed", () => {
    const newPanels = PRODUCTS.filter((p) => 
      p.category === "Solar Panels" && 
      (p.brand === "Sungene" || p.brand === "JMS" || p.brand === "Yingli")
    );
    expect(newPanels.length).toBe(6);

    const expectedPrices: Record<string, number> = {
      "SUNGENE-PV-330W-MONO": 56700,
      "SUNGENE-PV-650W-MONO": 144000,
      "JMS-PV-550W-MONO": 150150,
      "JMS-PV-630W-MONO": 153300,
      "YINGLI-PV-620W-MONO": 157500,
      "YINGLI-PV-625W-MONO": 158550,
    };


    for (const p of newPanels) {
      expect(p.image_url).toBeTruthy();
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Panel product image must exist: ${filePath}`).toBe(true);

      const expectedPrice = expectedPrices[p.sku || ""];
      expect(p.numeric_price, `Price check for ${p.name}`).toBe(expectedPrice);

    }

  });

  it("all 22 Deye products from official price sheet exist in catalog with local asset references and current master-sheet pricing where listed", () => {
    const deye = PRODUCTS.filter((p) => p.brand === "Deye" && p.sku?.startsWith("DEYE-"));
    expect(deye.length).toBe(22);

    const expectedPrices: Record<string, number> = {
      // Sheet 1: Low Voltage Batteries
      "DEYE-BAT-5K-SE-F5-C": 1116000,
      "DEYE-BAT-10K-SE-G10-2": 2600000,
      "DEYE-BAT-12K-SE-F12-C": 2520000,
      "DEYE-BAT-16K-SE-F16-V": 3510000,

      // Sheet 2: High Voltage Batteries & Racks
      "DEYE-BAT-5K-BOS-G-PRO": 1690000,
      "DEYE-ACC-BOS-G-PDU-2": 1690000,
      "DEYE-BAT-7K-BOS-A": 1920000,
      "DEYE-ACC-BOS-A-PDU-2": 1650000,
      "DEYE-ACC-RACK-9L-BOS-G": 806000,
      "DEYE-ACC-RACK-11L-BOS-A": 600000,

      // Sheet 3: Single Phase Inverters
      "DEYE-INV-6K-OG01": 1170000,
      "DEYE-INV-8K-SG05": 2600000,
      "DEYE-INV-10K-SG02": 3380000,
      "DEYE-INV-12K-SG02": 3640000,
      "DEYE-INV-16K-SG01": 4940000,

      // Sheet 4: Three Phase Inverters
      "DEYE-INV-12K-SG04-3P": 3770000,
      "DEYE-INV-16K-SG05-3P": 4940000,
      "DEYE-INV-20K-SG05-3P": 5980000,

      // Sheet 5: Three Phase High Voltage Inverters
      "DEYE-INV-25K-SG01-HV": 3840000,
      "DEYE-INV-30K-SG02-HV": 7280000,
      "DEYE-INV-50K-SG01-HV": 9880000,
      "DEYE-INV-80K-SG02-HV": 14300000,
    };


    for (const p of deye) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.startsWith("/products/deye/")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Deye product image must exist: ${filePath}`).toBe(true);

      const expectedPrice = expectedPrices[p.sku || ""];
      expect(p.numeric_price, `Price check for ${p.name} (SKU: ${p.sku})`).toBe(expectedPrice);

    }

  });

  it("all 47 Bread Energy products from official price sheet exist in catalog with local asset references and current master-sheet pricing where listed", () => {
    const breadEnergy = PRODUCTS.filter((p) => p.brand === "Bread Energy" && p.sku?.startsWith("BREAD-"));
    expect(breadEnergy.length).toBe(47);

    const expectedPrices: Record<string, number> = {
      // 1. Solar Panels (15 Items)
      "BREAD-PV-280W": 71500,
      "BREAD-PV-200W": 44200,
      "BREAD-PV-450W": 123500,
      "BREAD-PV-465W": 117000,
      "BREAD-PV-475W": 117000,
      "BREAD-PV-485W": 117000,
      "BREAD-PV-495W": 117000,
      "BREAD-PV-505W": 120000,
      "BREAD-PV-515W": 126000,
      "BREAD-PV-585W": 127200,
      "BREAD-PV-600W": 138000,
      "BREAD-PV-615W": 149500,
      "BREAD-PV-625W": 149500,
      "BREAD-PV-660W": 152100,
      "BREAD-PV-680W": 153400,

      // 2. Inverters (5 Items)
      "BREAD-INV-1.5K": 260000,
      "BREAD-INV-3.5K": 344500,
      "BREAD-INV-6.2K": 559000,
      "BREAD-INV-11K": 975000,
      "BREAD-INV-11K-PRO": 1079000,

      // 3. Lithium Batteries (9 Items)
      "BREAD-BAT-5K-25V-RK": 1365000,
      "BREAD-BAT-7K-25V-WM": 1430000,
      "BREAD-BAT-4.8K-48V-WM": 1365000,
      "BREAD-BAT-5K-51V-WM": 1560000,
      "BREAD-BAT-9.6K-RK": 2210000,
      "BREAD-BAT-9.6K-WH": 2340000,
      "BREAD-BAT-10.2K": 2535000,
      "BREAD-BAT-13.4K": 2600000,
      "BREAD-BAT-15.6K": 2860000,

      // 4. All in One ESS (4 Items)
      "BREAD-AIO-6K-5K": 2210000,
      "BREAD-AIO-6K-15K": 3705000,
      "BREAD-AIO-5K-20K": 5460000,
      "BREAD-AIO-12K-20K": 6500000,

      // 5. Solar Floodlights (6 Items)
      "BREAD-FL-60W": 36400,
      "BREAD-FL-100W": 46800,
      "BREAD-FL-200W": 58500,
      "BREAD-FL-300W": 71500,
      "BREAD-FL-500W": 84500,
      "BREAD-FL-1000W": 104000,

      // 6. Solar Street Lights & Accessories (8 Items)
      "BREAD-SL-2LENS": 97500,
      "BREAD-SL-3LENS": 114400,
      "BREAD-SL-4LENS": 130000,
      "BREAD-SL-4LINES": 175500,
      "BREAD-SL-5LINES": 120000,
      "BREAD-SL-8EYES": 195000,
      "BREAD-SL-12EYES": 253500,
      "BREAD-ACC-POLE": 64350,
    };


    for (const p of breadEnergy) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.startsWith("/products/bread-energy/")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Bread Energy product image must exist: ${filePath}`).toBe(true);

      const expectedPrice = expectedPrices[p.sku || ""];
      expect(p.numeric_price, `Price check for ${p.name} (SKU: ${p.sku})`).toBe(expectedPrice);

    }

  });

  it("every Exulted Eagles product has an assigned asset, correct price", () => {
    const exulted = PRODUCTS.filter((p) => p.sku?.startsWith("EXU-") || p.sku?.startsWith("ECO-"));
    expect(exulted.length).toBe(41);

    const expectedPrices: Record<string, number> = {
      // 1. Batteries
      "EXU-BAT-220AH-TUB": 286000,
      "EXU-BAT-230AH-DEBULL": 264000,
      "EXU-BAT-200AH-QUANTA-WC": 429000,
      "EXU-BAT-200AH-QUANTA-REG": 429000,
      "EXU-BAT-BC-5K-FLAT": 1105000,
      "EXU-BAT-BC-5K-SLIM": 1105000,
      "EXU-BAT-BC-10K-BLOCK": 1885000,
      "EXU-BAT-BC-15K-BLOCK": 2145000,
      "EXU-BAT-BC-10K-SMART": 1950000,
      "EXU-BAT-BC-15K-SMART": 2210000,
      "EXU-BAT-FT-5K-48V": 1235000,
      "EXU-BAT-FT-15K-48V": 2470000,

      // 2. Inverters
      "EXU-INV-2.5K-TT": 234000,
      "EXU-INV-5K-TT": 390000,
      "EXU-INV-2K-12V-WM": 195000,
      "EXU-INV-3K-24V-WM": 247000,
      "EXU-INV-4K-24V-WM": 390000,
      "EXU-INV-6K-48V-WM": 520000,
      "EXU-INV-10K-48V-WM": 1105000,
      "EXU-INV-12.5K-48V-PAR": 1235000,
      "EXU-INV-4K-24V-HF": 416000,
      "EXU-INV-6.2K-48V-HF": 456000,
      "EXU-INV-6.2K-48V-HV": 468000,
      "EXU-INV-11K-48V-NP": 975000,
      "EXU-INV-11K-48V-PAR": 1040000,

      // 3. Solar Panels
      "EXU-PV-460W": 110500,
      "EXU-PV-550W": 149500,
      "EXU-PV-620W": 156000,
      "EXU-PV-650W": 162500,

      // 4. Charge Controllers
      "EXU-CC-60A-MPPT": 169000,
      "EXU-CC-100A-MPPT": 247000,

      // 5. Solar Pumps
      "EXU-PUMP-SP600": 468000,
      "EXU-PUMP-SP5000": 2210000,

      // 6. Lights
      "EXU-SL-80W": 195000,
      "EXU-SL-100W": 260000,
      "EXU-SL-SIMPLICITY": 78000,
      "EXU-SL-GARDEN": 78000,

      // 7. Camera & Gate
      "EXU-CAM-4G-DUAL": 84500,
      "EXU-GATE-SLIDING-650": 845000,

      // 8. EcoFlow
      "ECO-RIVER2-256": 341900,
      "ECO-RIVER-288": 234000,
    };


    for (const p of exulted) {
      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.startsWith("/products/exulted/")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Image exists for ${p.name}: ${filePath}`).toBe(true);

      const expected = expectedPrices[p.sku || ""];
      expect(p.numeric_price, `Price for ${p.name} (SKU: ${p.sku})`).toBe(expected);

    }

  });

  it("all 61 expansion products across 13 brands exist in catalog with local asset references, correct specifications,", () => {
    expect(expansionCatalogProducts.length).toBe(61);

    const brandsExpected: Record<string, number> = {
      "EcoFlow": 13,
      "Bread Energy": 9,
      "Dawnice": 9,
      "Taico": 5,
      "MECO": 5,
      "SRNE": 5,
      "Deye": 4,
      "HiNEN": 3,
      "Solis": 2,
      "LuxPower": 2,
      "INFINI": 2,
      "AlpSolarr": 1,
      "Sorotech": 1,
    };

    const brandCounts: Record<string, number> = {};

    for (const p of expansionCatalogProducts) {
      expect(p.id.startsWith("expansion-")).toBe(true);
      expect(p.sku).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.numeric_price).toBeGreaterThan(0);
      expect(p.price).toMatch(/^₦[\d,]+$/);
      expect(p.specifications).toBeTruthy();
      expect(p.warranty_years).toBeGreaterThanOrEqual(1);

      brandCounts[p.brand || ""] = (brandCounts[p.brand || ""] || 0) + 1;

      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.endsWith(".webp")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Expansion image must exist on disk: ${filePath}`).toBe(true);

    }

    expect(brandCounts).toEqual(brandsExpected);

    // Exact +20% price checks across representative expansion items
    const expPriceMap = new Map(expansionCatalogProducts.map((p) => [p.sku, p.numeric_price]));
    expect(expPriceMap.get("PPS-021")).toBe(816000);  // EcoFlow DELTA 2: 680k + 20%
    expect(expPriceMap.get("PPS-023")).toBe(1440000); // EcoFlow DELTA 2 Max: 1.2m + 20%
    expect(expPriceMap.get("PPS-025")).toBe(2400000); // EcoFlow DELTA Pro: 2m + 20%
    expect(expPriceMap.get("BAT-046")).toBe(2160000); // Bread 9.6kWh: 1.8m + 20%
    expect(expPriceMap.get("BAT-043")).toBe(1260000); // Taico 5kWh: 1.05m + 20%
    expect(expPriceMap.get("BAT-036")).toBe(1440000); // Deye 5.1kWh: 1.2m + 20%
    expect(expPriceMap.get("INV-042")).toBe(900000);  // Dawnice 6kW: 750k + 20%
    expect(expPriceMap.get("PPS-001")).toBe(429600);  // MECO 1kWh: 358k + 20%
    expect(expPriceMap.get("BAT-041")).toBe(1222800); // SRNE 5kWh: 1.019m + 20%
    expect(expPriceMap.get("BAT-086")).toBe(2400000); // AlpSolarr 16kWh: 2m + 20%
  });

  it("all 44 Blue Carbon and 14 Dealer products exist in catalog with local asset references, exact specifications,", () => {
    expect(blueCarbonProducts.length).toBe(44);
    expect(dealerProducts.length).toBe(14);

    const testBatch = [...blueCarbonProducts, ...dealerProducts];

    for (const p of testBatch) {
      expect(p.id).toBeTruthy();
      expect(p.sku).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.numeric_price).toBeGreaterThan(0);
      expect(p.price).toMatch(/^₦[\d,]+$/);
      expect(p.specifications).toBeTruthy();
      expect(p.warranty_years).toBeGreaterThanOrEqual(1);

      expect(p.image_url).toBeTruthy();
      expect(p.image_url?.endsWith(".webp")).toBe(true);
      const filePath = path.resolve("public" + p.image_url);
      expect(fs.existsSync(filePath), `Product image must exist on disk: ${filePath}`).toBe(true);

    }


    // Exact +20% price checks across representative Blue Carbon & Dealer items
    const priceMap = new Map(testBatch.map((p) => [p.sku, p.numeric_price]));
    expect(priceMap.get("INV-007")).toBe(180000); // 150k + 20%
    expect(priceMap.get("INV-011")).toBe(216000); // 180k + 20%
    expect(priceMap.get("INV-023")).toBe(360000); // 300k + 20%
    expect(priceMap.get("BAT-121")).toBe(264000); // 220k + 20%
    expect(priceMap.get("PNL-021")).toBe(36000);  // 30k + 20%
    expect(priceMap.get("PNL-022")).toBe(42000);  // 35k + 20%
    expect(priceMap.get("INV-001")).toBe(240000); // 200k + 20%
    expect(priceMap.get("BAT-010")).toBe(1140000); // 950k + 20%
    expect(priceMap.get("AIO-010")).toBe(2700000); // 2.25m + 20%
  });

});
