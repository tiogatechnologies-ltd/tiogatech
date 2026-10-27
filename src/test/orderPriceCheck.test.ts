import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import {
  buildDbPriceMap,
  buildStaticPriceMap,
  checkOrderPrice,
  maxDiscountFor,
  normName,
  parseItemsSummary,
} from "../../supabase/functions/_shared/pricing";
import { CATALOG_PRICES } from "../../supabase/functions/_shared/catalog-prices";

// Builds the line Checkout writes into orders.items_summary.
const line = (n: number, name: string, qty: number, priceLabel?: string | null) =>
  `${n}. ${name}${qty > 1 ? ` x${qty}` : ""}${priceLabel ? ` (${priceLabel})` : ""}`;

describe("catalog price file", () => {
  it("is up to date with the storefront catalog (run `npm run catalog:prices` if this fails)", () => {
    expect(CATALOG_PRICES).toEqual(buildStaticPriceMap(PRODUCTS));
  });

  it("recognises every product exactly as Checkout names it, at any quantity", () => {
    const unresolved: string[] = [];
    const wrong: string[] = [];
    for (const p of PRODUCTS) {
      if (!p.numeric_price) continue;
      for (const qty of [1, 3]) {
        const res = checkOrderPrice({
          summary: line(1, p.name, qty, p.price),
          total: p.numeric_price * qty,
          prices: CATALOG_PRICES,
        });
        if (res.unresolved.length) unresolved.push(p.name);
        else if (res.status !== "ok") wrong.push(`${p.name} x${qty}: ${res.status}`);
      }
    }
    expect(unresolved).toEqual([]);
    expect(wrong).toEqual([]);
  });
});

describe("parseItemsSummary", () => {
  it("reads name and quantity and ignores the buyer's own price label", () => {
    const items = parseItemsSummary(
      [
        "1. Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU) x2 (₦2,220,000)",
        "2. Felicity Solar Battery",
        "3. Smart Switch x10 (₦1)",
      ].join("\n"),
    );
    expect(items.map(({ name, qty }) => ({ name, qty }))).toEqual([
      { name: "Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)", qty: 2 },
      { name: "Felicity Solar Battery", qty: 1 },
      { name: "Smart Switch", qty: 10 },
    ]);
  });

  it("treats an empty summary as no items", () => {
    expect(parseItemsSummary("")).toEqual([]);
    expect(parseItemsSummary(null)).toEqual([]);
  });
});

describe("checkOrderPrice", () => {
  const deye = PRODUCTS.find((p) => p.name.startsWith("Deye 5kW Hybrid Inverter"))!;
  const price = deye.numeric_price!;
  const summary = line(1, deye.name, 1, deye.price);

  it("blocks a total far below the cost of the items", () => {
    const res = checkOrderPrice({ summary, total: 1000, prices: CATALOG_PRICES });
    expect(res.status).toBe("underpaid");
    expect(res.expected).toBe(price);
  });

  it("accepts the right total, and a total that includes shipping", () => {
    expect(checkOrderPrice({ summary, total: price, prices: CATALOG_PRICES }).status).toBe("ok");
    expect(checkOrderPrice({ summary, total: price + 15000, prices: CATALOG_PRICES }).status).toBe("ok");
  });

  it("lets a valid discount code lower the total, but only by what the code allows", () => {
    const tenPercent = { type: "percent", value: 10 };
    expect(checkOrderPrice({ summary, total: Math.round(price * 0.9), prices: CATALOG_PRICES, discount: tenPercent }).status).toBe("ok");
    expect(checkOrderPrice({ summary, total: Math.round(price * 0.5), prices: CATALOG_PRICES, discount: tenPercent }).status).toBe("underpaid");
    expect(checkOrderPrice({ summary, total: Math.round(price * 0.9), prices: CATALOG_PRICES, discount: null }).status).toBe("underpaid");
  });

  it("caps a fixed discount at its value", () => {
    expect(maxDiscountFor(100000, { type: "fixed", value: 5000 })).toBe(5000);
    expect(maxDiscountFor(100000, { type: "percent", value: 15 })).toBe(15000);
    expect(maxDiscountFor(100000, { type: "percent", value: 500 })).toBe(100000);
    expect(maxDiscountFor(100000, undefined)).toBe(0);
  });

  it("flags items it does not recognise instead of pricing them at zero", () => {
    const res = checkOrderPrice({ summary: line(1, "Totally Made Up Item", 1, "₦1"), total: 1, prices: CATALOG_PRICES });
    expect(res.status).toBe("unresolved");
    expect(res.unresolved).toEqual(["Totally Made Up Item"]);
  });

  it("still blocks an underpaid order that mixes a real item with an unknown one", () => {
    const mixed = [line(1, deye.name, 1), line(2, "Totally Made Up Item", 1)].join("\n");
    expect(checkOrderPrice({ summary: mixed, total: 1000, prices: CATALOG_PRICES }).status).toBe("underpaid");
  });
});

describe("database-only items", () => {
  const prices = buildDbPriceMap({
    solar: [{ package_number: 1, inverter: "Hybrid 3.5KVA 24V (Transformer-Based)", total_price: 4828800 }],
    locks: [
      { name: "Elite Series A — Premier-Lux K209", price: 342000 },
      { name: "Pro Series — X04", price: 192000 },
    ],
    automation: [{ name: "Apex", price: 5880000 }],
    cctv: [{ name: "4-Channel Smart AI CCTV Kit", price: 576000 }],
    products: [{ name: "Longi 550W Hi-MO 5 Tier-1 Mono PERC Solar Panel", price: "₦174,000" }],
  });

  it("matches names the way the storefront adds them to the cart", () => {
    const cases: [string, number][] = [
      ["Solar Package #1 - Hybrid 3.5KVA 24V (Transformer-Based)", 4828800],
      ["Elite Series A - Premier-Lux K209", 342000], // storefront shows the em dash as a hyphen
      ["Apex - Home Automation", 5880000],
      ["Apex Home Automation Package", 5880000],
      ["4-Channel Smart AI CCTV Kit", 576000],
      ["Longi 550W Hi-MO 5 Tier-1 Mono PERC Solar Panel", 174000],
    ];
    for (const [name, expected] of cases) {
      expect(prices[normName(name)], name).toBe(expected);
    }
  });

  it("does not mistake a model code like X04 for a quantity", () => {
    const ok = checkOrderPrice({ summary: line(1, "Pro Series - X04", 1, "₦192,000"), total: 192000, prices });
    expect(ok.status).toBe("ok");
    expect(ok.expected).toBe(192000);
    const three = checkOrderPrice({ summary: line(1, "Pro Series - X04", 3), total: 576000, prices });
    expect(three.status).toBe("ok");
    expect(three.expected).toBe(576000);
    expect(checkOrderPrice({ summary: line(1, "Pro Series - X04", 3), total: 1000, prices }).status).toBe("underpaid");
  });

  it("blocks underpaying a package", () => {
    const res = checkOrderPrice({
      summary: line(1, "Solar Package #1 - Hybrid 3.5KVA 24V (Transformer-Based)", 1, "₦1"),
      total: 5000,
      prices,
    });
    expect(res.status).toBe("underpaid");
  });
});
