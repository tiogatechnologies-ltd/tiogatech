import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import master from "@/data/retailMasterPrices.json";
import { applyMasterPrice, formatRetailPrice, masterPriceFor, normalizePriceName, parseRetailPrice, refreshRetailCartItem, upgradeLegacyWishlistIds } from "@/lib/retailPricing";
import { mergeProducts } from "@/lib/mergeProducts";
import { CATALOG_PRICES, CATALOG_QUOTE_ONLY_NAMES } from "../../supabase/functions/_shared/catalog-prices";
import { buildDbPriceMap, normName } from "../../supabase/functions/_shared/pricing";

describe("master sheet selling price reconciliation", () => {
  it("covers every source row and keeps all price-less rows explicit", () => {
    expect(Object.keys(master.prices)).toHaveLength(440);
    expect(Object.values(master.prices).filter(price => price === null)).toHaveLength(15);
    for (const sourceId of Object.values(master.aliases)) expect(master.prices).toHaveProperty(sourceId);
  });

  it("matches every reviewed listing in labels, numbers and payment validation", () => {
    for (const product of PRODUCTS) {
      const expected = masterPriceFor(product);
      if (expected === undefined) continue;
      if (expected === null) {
        expect(product.price, product.name).toBeNull();
        expect(product.numeric_price, product.name).toBeUndefined();
        expect(CATALOG_QUOTE_ONLY_NAMES).toContain(normName(product.name));
        expect(CATALOG_PRICES[normName(product.name)]).toBeUndefined();
      } else {
        expect(product.numeric_price, product.name).toBe(expected);
        expect(parseRetailPrice(product.price), product.name).toBe(expected);
        expect(CATALOG_PRICES[normName(product.name)], product.name).toBe(expected);
      }
    }
  });

  it("overrides stale database prices for exact models while preserving crossed-out prices", () => {
    const base = PRODUCTS.find(p => p.name.includes("AlpSolarr Pulse S3"))!;
    const merged = mergeProducts([base], [{ ...base, price: "₦864,000", numeric_price: 864000, compare_at_price: "₦900,000" }]);
    expect(merged[0]).toMatchObject({ price: "₦754,000", numeric_price: 754000, compare_at_price: "₦900,000" });
  });

  it("does not assign the 8kW Pulse S4 price to the 5kW Mini", () => {
    const mini = PRODUCTS.find(p => p.name.includes("Pulse S4 Mini"))!;
    expect(masterPriceFor(mini)).toBeUndefined();
    expect(mini.numeric_price).toBe(636000);
    expect(master.aliases[normalizePriceName(mini.name) as keyof typeof master.aliases]).toBeUndefined();
  });

  it("preserves kobo through labels, cart restoration and server parsing", () => {
    const product = PRODUCTS.find(p => p.name.includes("(EOS02B-24)"))!;
    expect(product.numeric_price).toBe(548601.3);
    expect(formatRetailPrice(548601.3)).toBe("₦548,601.30");
    const cart = refreshRetailCartItem({ id: "saved", refId: product.id, name: product.name, type: "product", price: "₦756,000", numericPrice: 756000, quantity: 3 });
    expect(cart).toMatchObject({ numericPrice: 548601.3, price: "₦548,601.30", quantity: 3 });
    expect(buildDbPriceMap({ products: [{ name: product.name, price: product.price }] })[normName(product.name)]).toBe(548601.3);
  });

  it("requires quotes only where the sheet has no price and excludes them from cached checkout", () => {
    for (const product of PRODUCTS.filter(p => masterPriceFor(p) === null)) {
      expect(refreshRetailCartItem({ id: "saved", refId: product.id, name: product.name, type: "product", price: "₦1", numericPrice: 1 })).toBeNull();
    }
    const packageItem = { id: "package:1", refId: "1", name: "Solar Package", type: "package", price: "₦1", numericPrice: 1 };
    expect(refreshRetailCartItem(packageItem)).toBe(packageItem);
  });

  it("uses the matching Deye Nigeria supplier rows for the 50kW and 80kW models", () => {
    for (const [id, sourceId, price] of [["deye-inv-sun-50k-sg01hp3", "INV-136", 9880000], ["deye-inv-sun-80k-sg02hp3", "INV-142", 14300000]] as const) {
      const product = PRODUCTS.find(p => p.id === id)!;
      expect(product.numeric_price).toBe(price);
      expect(parseRetailPrice(product.price)).toBe(price);
      expect(master.prices[sourceId]).toBe(price);
      expect(CATALOG_PRICES[normName(product.name)]).toBe(price);
      expect(CATALOG_QUOTE_ONLY_NAMES).not.toContain(normName(product.name));
      expect(refreshRetailCartItem({ id: `product:${id}`, refId: id, name: product.name, type: "product", price: null, numericPrice: null })?.numericPrice).toBe(price);
    }
    const fifty = PRODUCTS.find(p => p.id === "deye-inv-sun-50k-sg01hp3")!;
    expect(masterPriceFor({ ...fifty, specifications: { SKU: "INV-135" } })).toBe(7500000);
  });

  it("keeps all catalogue identifiers distinct, including legacy Luxpower cart lines", () => {
    expect(new Set(PRODUCTS.map(p => p.id)).size).toBe(PRODUCTS.length);
    const p = PRODUCTS.find(p => p.name.startsWith("Luxpower Geta 1.5kW"))!;
    const restored = refreshRetailCartItem({ id: "product:a0000000-0000-0000-0000-000000000101", refId: "a0000000-0000-0000-0000-000000000101", name: p.name, type: "product", price: "₦220,800", numericPrice: 220800 });
    expect(restored?.refId).toBe(p.id);
    expect(restored?.numericPrice).toBe(286000);
    expect(upgradeLegacyWishlistIds(["a0000000-0000-0000-0000-000000000101", "a0000000-0000-0000-0000-000000000102"])).toEqual([p.id, "a0000000-0000-0000-0000-000000000102"]);
    expect(applyMasterPrice({ id: "other", name: "Unlisted unrelated item", price: "₦100", numeric_price: 100 }).numeric_price).toBe(100);
  });
});
