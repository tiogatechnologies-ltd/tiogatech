import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  DEFAULT_HERO_SLIDES,
  FEATURED_ECOFLOW_SLIDES,
  FEATURED_SRNE_20KW_SLIDE,
} from "@/components/retail/RetailHeroCarousel";

describe("Retail Hero Carousel EcoFlow Slides & HD PNG Assets", () => {
  const expectedProducts = [
    {
      id: "ecoflow-delta-3-air-2000",
      headline: "EcoFlow DELTA 3 AIR 2000",
      image_file: "ecoflow-delta-3-air-2000.png",
      retail_price: 1066000,
      promo_price: 959400,
      specs: ["2000W", "2400W", "1920Wh", "13", "4", "23Kg", "81 Mins"],
    },
    {
      id: "ecoflow-delta-3-max",
      headline: "EcoFlow DELTA 3 Max",
      image_file: "ecoflow-delta-3-max.png",
      retail_price: 1560000,
      promo_price: 1404000,
      specs: ["2400W", "4800W", "2048Wh", "13", "4", "23Kg", "81 Mins"],
    },
    {
      id: "ecoflow-river-3-max-plus",
      headline: "EcoFlow RIVER 3 Max Plus",
      image_file: "ecoflow-river-3-max-plus.png",
      retail_price: 661050,
      promo_price: 594945,
      specs: ["500W", "650W", "858Wh", "9", "wireless", "10Kg", "1.8 Hr"],
    },
    {
      id: "ecoflow-river-3-max",
      headline: "EcoFlow RIVER 3 Max",
      image_file: "ecoflow-river-3-max.png",
      retail_price: 546000,
      promo_price: 491400,
      specs: ["500W", "650W", "572Wh", "8", "8.4Kg", "1-3 Hr"],
    },
    {
      id: "ecoflow-e980",
      headline: "EcoFlow E980",
      image_file: "ecoflow-e980.png",
      retail_price: 586300,
      promo_price: 527670,
      specs: ["500W", "650W", "980Wh", "13", "13Kg", "2 Hr"],
    },
  ];

  it("includes all 5 requested EcoFlow promo slides in FEATURED_ECOFLOW_SLIDES and DEFAULT_HERO_SLIDES", () => {
    expect(FEATURED_ECOFLOW_SLIDES.length).toBe(5);

    for (const exp of expectedProducts) {
      const slide = FEATURED_ECOFLOW_SLIDES.find((s) => s.id === exp.id);
      expect(slide, `Slide ${exp.id} must exist`).toBeDefined();
      expect(slide?.headline).toBe(exp.headline);
      expect(slide?.is_active).toBe(true);
      expect(slide?.discount_pct).toBe(10);
      expect(slide?.price_ngn).toBe(exp.retail_price);
      expect(slide?.promo_price_ngn).toBe(exp.promo_price);
      expect(slide?.image_url).toBe(`/products/ecoflow/${exp.image_file}`);
      expect(slide?.cta_text).toBeTruthy();
      expect(slide?.cta_link).toContain("https://wa.me/2347065942426");

      // Verify specification coverage in subheadline
      for (const spec of exp.specs) {
        expect(slide?.subheadline.toLowerCase()).toContain(spec.toLowerCase());
      }

      // Also ensure slide is included in DEFAULT_HERO_SLIDES
      const inDefault = DEFAULT_HERO_SLIDES.find((s) => s.id === exp.id);
      expect(inDefault).toBeDefined();
    }
  });

  it("each EcoFlow HD PNG image exists on disk, is a valid PNG with alpha transparency, and has a unique SHA256 hash", () => {
    const hashes = new Set<string>();

    for (const exp of expectedProducts) {
      const filePath = path.resolve("public", "products", "ecoflow", exp.image_file);
      expect(fs.existsSync(filePath), `File must exist at ${filePath}`).toBe(true);

      const buf = fs.readFileSync(filePath);
      expect(buf.length).toBeGreaterThan(100000); // High definition (>100KB)

      // Verify PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const signature = buf.subarray(0, 8).toString("hex");
      expect(signature).toBe("89504e470d0a1a0a");

      // Verify color type is RGBA (type 6) with transparency
      const colorType = buf[25];
      expect(colorType).toBe(6);

      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      expect(hashes.has(hash), `Duplicate image detected for ${exp.image_file}`).toBe(false);
      hashes.add(hash);
    }

    expect(hashes.size).toBe(5);
  });

  it("retains the SRNE 20KW flagship slide in DEFAULT_HERO_SLIDES", () => {
    const srne = DEFAULT_HERO_SLIDES.find((s) => s.id === FEATURED_SRNE_20KW_SLIDE.id);
    expect(srne).toBeDefined();
  });
});
