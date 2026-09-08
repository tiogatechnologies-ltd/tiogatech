import { describe, it, expect } from "vitest";
import {
  DEFAULT_HERO_SLIDES,
  DEFAULT_FLASH_DEAL,
  resolveFlashDeal,
} from "../lib/retailPromotionsDefaults";

describe("Retail Promotions Defaults & Resolver", () => {
  it("provides 3 rich default hero slides with active status and real links", () => {
    expect(DEFAULT_HERO_SLIDES.length).toBe(3);
    DEFAULT_HERO_SLIDES.forEach((slide) => {
      expect(slide.is_active).toBe(true);
      expect(slide.headline.length).toBeGreaterThan(10);
      expect(slide.subheadline.length).toBeGreaterThan(20);
      expect(slide.cta_text.length).toBeGreaterThan(0);
      expect(slide.cta_link.startsWith("/")).toBe(true);
      expect(slide.image_url).toBeDefined();
    });
  });

  it("provides an active default flash deal", () => {
    expect(DEFAULT_FLASH_DEAL.is_active).toBe(true);
    expect(DEFAULT_FLASH_DEAL.headline).toBeDefined();
    expect(DEFAULT_FLASH_DEAL.discount_code).toBe("TIOGA2026");
    expect(DEFAULT_FLASH_DEAL.perk_label).toBeDefined();
  });

  it("resolves null/undefined content to the default flash deal", () => {
    const resolved = resolveFlashDeal(null);
    expect(resolved).not.toBeNull();
    expect(resolved?.headline).toBe(DEFAULT_FLASH_DEAL.headline);
    expect(resolved?.discount_code).toBe(DEFAULT_FLASH_DEAL.discount_code);
  });

  it("returns null when admin explicitly disabled flash deal (is_active: false)", () => {
    const resolved = resolveFlashDeal({ is_active: false, headline: "Disabled Promo" });
    expect(resolved).toBeNull();
  });

  it("merges custom admin flash deal properties when active", () => {
    const resolved = resolveFlashDeal({
      is_active: true,
      headline: "Custom Mid-Month Super Sale",
      discount_label: "25% OFF",
      discount_code: "SUPER25",
    });
    expect(resolved).not.toBeNull();
    expect(resolved?.headline).toBe("Custom Mid-Month Super Sale");
    expect(resolved?.discount_label).toBe("25% OFF");
    expect(resolved?.discount_code).toBe("SUPER25");
    expect(resolved?.perk_label).toBe(DEFAULT_FLASH_DEAL.perk_label);
  });
});
