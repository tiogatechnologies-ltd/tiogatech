import { describe, it, expect } from "vitest";
import {
  calcPlan,
  lookupInterest,
  normalizeFinanceConfig,
  formatNGN,
  DEFAULT_FINANCE_CONFIG,
} from "@/lib/financeCalc";

describe("Lease-to-Own Finance Calculator", () => {
  it("uses default configuration correctly", () => {
    const config = normalizeFinanceConfig();
    expect(config.deposit_pct).toBe(0.3);
    expect(config.tenures_months).toEqual([3, 6, 12, 24]);
  });

  it("calculates interest tiers based on product cost", () => {
    const lowTier = lookupInterest(2_000_000, DEFAULT_FINANCE_CONFIG);
    expect(lowTier.rate).toBe(0.09);

    const midTier = lookupInterest(6_000_000, DEFAULT_FINANCE_CONFIG);
    expect(midTier.rate).toBe(0.15);

    const highTier = lookupInterest(10_000_000, DEFAULT_FINANCE_CONFIG);
    expect(highTier.rate).toBe(0.25);
  });

  it("calculates accurate monthly installment payments and deposit", () => {
    const total = 5_000_000;
    const months = 6;
    const plan = calcPlan(total, months, DEFAULT_FINANCE_CONFIG);

    expect(plan.total).toBe(5_000_000);
    expect(plan.tenure_months).toBe(6);
    expect(plan.deposit).toBe(1_500_000); // 30% deposit
    expect(plan.financed).toBe(3_500_000);
    expect(plan.monthly_payment).toBeGreaterThan(0);
    expect(plan.total_repayment).toBeGreaterThan(plan.financed);
  });

  it("formats Nigerian Naira correctly", () => {
    expect(formatNGN(1500000)).toBe("₦1,500,000");
    expect(formatNGN(0)).toBe("₦0");
  });

  it("handles boundary values and edge cases gracefully", () => {
    const zeroPlan = calcPlan(0, 6, DEFAULT_FINANCE_CONFIG);
    expect(zeroPlan.deposit).toBe(0);
    expect(zeroPlan.monthly_payment).toBe(0);
  });
});
