import { describe, it, expect } from "vitest";
import { calcPlan, DEFAULT_FINANCE_CONFIG } from "@/lib/financeCalc";
import { getDefaultPackageImage } from "@/lib/packageImages";
import { getSolarPackageImage } from "@/hooks/useSolarPackages";

describe("Finance Page & Easy Flex Connection Context", () => {
  it("computes accurate monthly breakdowns across all 4 tenures for a specific product", () => {
    const productPrice = 2_400_000; // e.g. 5kVA Solar Inverter System
    const tenures = [3, 6, 12, 24];

    const plans = tenures.map((m) => calcPlan(productPrice, m, DEFAULT_FINANCE_CONFIG));

    expect(plans).toHaveLength(4);

    for (const plan of plans) {
      // 30% upfront deposit
      expect(plan.deposit).toBe(720_000);
      // 70% financed
      expect(plan.financed).toBe(1_680_000);
      // Monthly payment is positive
      expect(plan.monthly_payment).toBeGreaterThan(0);
      // Total repayment = monthly_payment * tenure_months
      expect(plan.total_repayment).toBeCloseTo(plan.monthly_payment * plan.tenure_months, -1);
      // Base interest tier is 9% for ₦2.4M (1M - 5M bracket)
      expect(plan.base_interest_rate).toBe(0.09);
    }

    const plan3 = plans.find((p) => p.tenure_months === 3)!;
    const plan6 = plans.find((p) => p.tenure_months === 6)!;
    const plan12 = plans.find((p) => p.tenure_months === 12)!;
    const plan24 = plans.find((p) => p.tenure_months === 24)!;

    // Interest rate scales with tenure (tenure / 12)
    expect(plan3.interest_rate).toBeCloseTo(0.0225);
    expect(plan6.interest_rate).toBeCloseTo(0.045);
    expect(plan12.interest_rate).toBeCloseTo(0.09);
    expect(plan24.interest_rate).toBeCloseTo(0.18);

    // 3-month plan clears faster with lower total repayment
    expect(plan3.total_repayment).toBeLessThan(plan6.total_repayment);
    expect(plan6.total_repayment).toBeLessThan(plan12.total_repayment);
    expect(plan12.total_repayment).toBeLessThan(plan24.total_repayment);
  });

  it("correctly identifies interest tiers for different product price brackets", () => {
    // ₦2.5M -> 9%
    const planLow = calcPlan(2_500_000, 12, DEFAULT_FINANCE_CONFIG);
    expect(planLow.interest_rate).toBe(0.09);

    // ₦6M -> 15%
    const planMid = calcPlan(6_000_000, 12, DEFAULT_FINANCE_CONFIG);
    expect(planMid.interest_rate).toBe(0.15);

    // ₦12M -> 25%
    const planHigh = calcPlan(12_000_000, 12, DEFAULT_FINANCE_CONFIG);
    expect(planHigh.interest_rate).toBe(0.25);
  });

  it("resolves default fallback images for various categories when image URL is omitted", () => {
    // Solar package image resolution
    const solarImg1 = getSolarPackageImage({ package_number: 1 });
    expect(solarImg1).toBe("/products/packages/pkg-solar-1.webp");

    const solarImg2 = getSolarPackageImage({ package_number: 5 });
    expect(solarImg2).toBe("/products/packages/pkg-solar-5.webp");

    // Smart lock image resolution
    const lockImg = getDefaultPackageImage("lock", "stama-k209");
    expect(lockImg).toContain("k209");

    // CCTV image resolution
    const cctvImg = getDefaultPackageImage("cctv", "8ch");
    expect(cctvImg).toContain("8ch");

    // Automation image resolution
    const autoImg = getDefaultPackageImage("automation", "apex");
    expect(autoImg).toContain("apex");
  });

  it("serializes and deserializes Easy Flex finance link parameters accurately", () => {
    const itemName = "5kVA Popular Hybrid System";
    const amount = 3_250_000;
    const months = 12;
    const image = "/products/packages/pkg-solar-2.webp";
    const id = "solar-pkg-2";
    const type = "package";

    const params = new URLSearchParams();
    params.set("item", itemName);
    params.set("amount", String(amount));
    params.set("months", String(months));
    params.set("image", image);
    params.set("id", id);
    params.set("type", type);

    const queryString = params.toString();
    const parsed = new URLSearchParams(queryString);

    expect(parsed.get("item")).toBe(itemName);
    expect(Number(parsed.get("amount"))).toBe(amount);
    expect(Number(parsed.get("months"))).toBe(months);
    expect(parsed.get("image")).toBe(image);
    expect(parsed.get("id")).toBe(id);
    expect(parsed.get("type")).toBe(type);
  });
});
