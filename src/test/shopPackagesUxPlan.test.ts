import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { isShopRoute, isProductDetailRoute } from "@/lib/shopRoutes";
import { getCountdownParts, resolveCampaignEndsAt, BLACK_FRIDAY_END_ISO } from "@/lib/countdownTicker";
import { parseAppliances, canRun, inferPackageLoadKw } from "@/lib/packageAppliances";
import {
  EMPTY_PACKAGE_FILTERS,
  filterPackages,
  findClosestPackages,
  readPackageFilters,
  writePackageFilters,
} from "@/lib/packageFilters";
import {
  clearPendingProducts,
  getPendingProducts,
  recordPendingProduct,
  removePendingProduct,
  syncPendingWithCart,
  updatePendingProductQty,
  PENDING_PRODUCTS_TTL_MS,
} from "@/lib/pendingProducts";
import { resolveRealCompareAt } from "@/lib/promoDisplay";
import { OFFICIAL_LITHIUM_PACKAGES } from "@/hooks/useSolarPackages";

describe("Shop & Packages UX Plan (WS1–WS7 + Foundations)", () => {
  describe("F2 - Shop Route Guard (shop site only)", () => {
    it("matches only retail, catalog, and product routes and excludes checkout/marketing/admin", () => {
      expect(isShopRoute("/retail")).toBe(true);
      expect(isShopRoute("/retail/smart-locks")).toBe(true);
      expect(isShopRoute("/catalog")).toBe(true);
      expect(isShopRoute("/product/deye-5kw-hybrid")).toBe(true);

      expect(isShopRoute("/checkout")).toBe(false);
      expect(isShopRoute("/checkout/success")).toBe(false);
      expect(isShopRoute("/")).toBe(false);
      expect(isShopRoute("/packages")).toBe(false);
      expect(isShopRoute("/admin/retail-promotions")).toBe(false);

      expect(isProductDetailRoute("/product/deye-5kw")).toBe(true);
      expect(isProductDetailRoute("/retail")).toBe(false);
    });
  });

  describe("F3 & WS5 - Honest Countdown Ticker & Real Compare-At", () => {
    it("returns active remaining parts before ends_at and expired (no reset!) once passed or blank", () => {
      const duringSale = Date.parse("2026-11-23T20:00:00+01:00");
      const active = getCountdownParts(BLACK_FRIDAY_END_ISO, duringSale);
      expect(active.active).toBe(true);
      expect(active.expired).toBe(false);
      expect(active.d).toBe(6);

      const afterSale = Date.parse("2026-11-30T00:00:01+01:00");
      const expired = getCountdownParts(BLACK_FRIDAY_END_ISO, afterSale);
      expect(expired.active).toBe(false);
      expect(expired.expired).toBe(true);
      expect(expired.d).toBe(0);
      expect(expired.h).toBe(0);

      // Missing or invalid ends_at NEVER invents a rolling weekly reset
      expect(getCountdownParts(null, duringSale).active).toBe(false);
      expect(getCountdownParts("", duringSale).active).toBe(false);
      expect(getCountdownParts("not-a-date", duringSale).active).toBe(false);

      // Stale pre-Black-Friday DB timestamp (e.g. Sept 2026) resolves to BF2026 end during Nov 23–29,
      // and expires cleanly on Nov 30 with zero weekly reset
      expect(resolveCampaignEndsAt("2026-09-18T19:13:17.340Z", duringSale)).toBe(BLACK_FRIDAY_END_ISO);
      expect(resolveCampaignEndsAt("2026-09-18T19:13:17.340Z", afterSale)).toBeNull();
    });

    it("resolveRealCompareAt ignores randomized fallback when no genuine compare_at or policy exists", () => {
      const opts = { show_compare_at_price: true, default_markup_pct: 30, randomize_fallback_pct: true };
      expect(resolveRealCompareAt(500_000, null, opts, "random-id", "UnconfiguredBrand")).toBeNull();
      expect(resolveRealCompareAt(500_000, 650_000, opts, "real-id", "UnconfiguredBrand")).toBe(650_000);
      expect(
        resolveRealCompareAt(
          500_000,
          null,
          { ...opts, brand_overrides: { SRNE: { discount_pct: 20 } } },
          "brand-id",
          "SRNE",
        ),
      ).toBe(625_000);
    });
  });

  describe("WS1 - Footer WebP asset budget", () => {
    it("exists in public/footer-bg.webp and stays <= 80 KB", () => {
      const p = path.resolve("public", "footer-bg.webp");
      expect(fs.existsSync(p)).toBe(true);
      const stat = fs.statSync(p);
      expect(stat.size).toBeGreaterThan(5_000);
      expect(stat.size).toBeLessThanOrEqual(80 * 1024);
    });
  });

  describe("WS3 - Appliance Parser & Heavy-Load Capability Rules", () => {
    it("parses quantities, multiplier notation, and wattage cleanly", () => {
      const parsed = parseAppliances(
        "12 LED bulbs, 3 fans, 2 TVs, 1 fridge, 2 × 1HP inverter ACs (daytime), 1 borehole pump",
      );
      expect(parsed.length).toBe(6);
      expect(parsed[0]).toMatchObject({ qty: 12, key: "bulb" });
      expect(parsed[3]).toMatchObject({ qty: 1, key: "fridge" });
      expect(parsed[4]).toMatchObject({ qty: 2, key: "ac_1hp" });
      expect(parsed[5]).toMatchObject({ qty: 1, key: "borehole_pump" });
    });

    it("evaluates heavy loads conservatively across Essential, Core, and Pro systems", () => {
      const e1 = OFFICIAL_LITHIUM_PACKAGES.find((p) => p.code === "E1")!; // 1.5kW
      const c1 = OFFICIAL_LITHIUM_PACKAGES.find((p) => p.code === "C1")!; // 4kW
      const p4 = OFFICIAL_LITHIUM_PACKAGES.find((p) => p.code === "P4")!; // 12kW

      expect(canRun(e1, "ac_1_5hp").status).toBe("no");
      expect(canRun(e1, "water_pump").status).toBe("no");
      expect(canRun(c1, "fridge").status).toBe("yes");
      expect(canRun(c1, "water_pump").status).toBe("yes");
      expect(canRun(p4, "ac_1_5hp").status).toBe("yes");
      expect(canRun(p4, "borehole_pump").status).toBe("yes");
    });

    it("infers load kW from inverter text on tubular/high-voltage packages without largest_load_kw", () => {
      expect(inferPackageLoadKw({ inverter: "Hybrid 2.5KVA/3.5KVA (24V)" })).toBe(2);
      expect(inferPackageLoadKw({ inverter: "40KVA Three Phase Industrial" })).toBe(32);
    });
  });

  describe("WS4 - Package Filters, Closest Fallback & URL Round-Trip", () => {
    it("filters by brand, budget, mustPower, and returns 3 closest on impossible combination", () => {
      const srneOnly = filterPackages(OFFICIAL_LITHIUM_PACKAGES, {
        ...EMPTY_PACKAGE_FILTERS,
        brands: ["SRNE"],
      });
      expect(srneOnly.length).toBeGreaterThan(0);
      expect(srneOnly.every((p) => p.brand === "SRNE")).toBe(true);

      const mustRunAc = filterPackages(OFFICIAL_LITHIUM_PACKAGES, {
        ...EMPTY_PACKAGE_FILTERS,
        mustPower: ["ac_1_5hp"],
      });
      expect(mustRunAc.length).toBeGreaterThan(0);
      expect(mustRunAc.every((p) => canRun(p, "ac_1_5hp").status === "yes")).toBe(true);

      const impossible = filterPackages(OFFICIAL_LITHIUM_PACKAGES, {
        ...EMPTY_PACKAGE_FILTERS,
        maxPrice: 500_000,
        mustPower: ["ac_1_5hp"],
      });
      expect(impossible.length).toBe(0);
      const closest = findClosestPackages(OFFICIAL_LITHIUM_PACKAGES, {
        ...EMPTY_PACKAGE_FILTERS,
        maxPrice: 500_000,
        mustPower: ["ac_1_5hp"],
      });
      expect(closest.length).toBe(3);
    });

    it("round-trips package filter state cleanly through URLSearchParams", () => {
      const state = {
        ...EMPTY_PACKAGE_FILTERS,
        search: "5kW",
        batteryTypes: ["lithium" as const],
        brands: ["SRNE", "itel"],
        minPrice: 1_000_000,
        maxPrice: 5_000_000,
        mustPower: ["fridge" as const, "water_pump" as const],
        sort: "price-asc" as const,
      };
      const params = writePackageFilters(state, new URLSearchParams("category=solar"));
      expect(params.get("category")).toBe("solar");
      const restored = readPackageFilters(params);
      expect(restored).toEqual(state);
    });
  });

  describe("WS7 - Pending Viewed-but-Uncarted Product Store", () => {
    beforeEach(() => {
      clearPendingProducts();
    });

    it("dedupes, caps at 3 newest, updates qty, expires after 7 days, and removes on cart sync", () => {
      const baseNow = Date.parse("2026-11-23T12:00:00Z");
      for (let i = 1; i <= 4; i++) {
        recordPendingProduct({
          id: `product:p${i}`,
          refId: `p${i}`,
          type: "product",
          slug: `/product/p${i}`,
          name: `Product ${i}`,
          image: `/img/${i}.png`,
          priceLabel: `₦${(i * 100_000).toLocaleString("en-NG")}`,
          numericPrice: i * 100_000,
          viewed_at: baseNow + i * 1000,
        });
      }

      const stored = getPendingProducts(baseNow + 5000);
      expect(stored.length).toBe(3);
      expect(stored.map((p) => p.refId)).toEqual(["p4", "p3", "p2"]);

      // Re-viewing p2 moves it to the top and preserves qty
      updatePendingProductQty("p2", 3);
      recordPendingProduct({
        id: "product:p2",
        refId: "p2",
        type: "product",
        slug: "/product/p2",
        name: "Product 2",
        image: "/img/2.png",
        priceLabel: "₦200,000",
        numericPrice: 200_000,
        viewed_at: baseNow + 10_000,
      });
      const afterRevisit = getPendingProducts(baseNow + 11_000);
      expect(afterRevisit[0].refId).toBe("p2");
      expect(afterRevisit[0].qty).toBe(3);

      // Adding p2 to cart removes it everywhere
      syncPendingWithCart(["product:p2", "p2"]);
      expect(getPendingProducts(baseNow + 12_000).map((p) => p.refId)).toEqual(["p4", "p3"]);

      // Dismissing p4 removes it
      removePendingProduct("p4");
      expect(getPendingProducts(baseNow + 12_000).map((p) => p.refId)).toEqual(["p3"]);

      // After 7 days, p3 expires
      expect(getPendingProducts(baseNow + PENDING_PRODUCTS_TTL_MS + 60_000)).toEqual([]);
    });
  });
});
