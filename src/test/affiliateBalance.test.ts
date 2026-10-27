import { describe, expect, it } from "vitest";
import { computeBalance, escapeLike } from "../../supabase/functions/_shared/affiliate";

const orders = [
  { total: 600000, payment_status: "paid" },
  { total: 400000, payment_status: "paid" },
  { total: 900000, payment_status: "pending" },
  { total: 500000, payment_status: "refunded" },
];

describe("affiliate balance", () => {
  it("uses recorded commissions even after the affiliate's current rate changes", () => {
    const historical = [{ total: 100000, payment_status: "paid", affiliate_commission_amount: 10000 }];
    expect(computeBalance(5, historical, [], []).earned).toBe(10000);
    expect(computeBalance(20, historical, [], []).earned).toBe(10000);
    expect(computeBalance(20, [{ ...historical[0], affiliate_commission_amount: 0 }], [], []).earned).toBe(0);
  });
  it("earns commission only on paid orders", () => {
    const b = computeBalance(10, orders, [], []);
    expect(b.revenue).toBe(1_000_000);
    expect(b.earned).toBe(100_000);
    expect(b.available).toBe(100_000);
  });

  it("stops counting a refunded order", () => {
    expect(computeBalance(10, [{ total: 500000, payment_status: "refunded" }], [], []).earned).toBe(0);
  });

  it("deducts paid, approved and pending payouts but not rejected ones", () => {
    for (const status of ["paid", "approved", "pending"]) {
      expect(computeBalance(10, orders, [{ amount: 30000, status }], []).available).toBe(70_000);
    }
    expect(computeBalance(10, orders, [{ amount: 30000, status: "rejected" }], []).available).toBe(100_000);
  });

  it("deducts open payout requests", () => {
    const b = computeBalance(10, orders, [{ amount: 30000, status: "paid" }], [{ amount: 50000, status: "pending" }]);
    expect(b.available).toBe(20_000);
    expect(b.inProgress).toBe(50_000);
  });

  it("never goes negative", () => {
    expect(computeBalance(10, orders, [{ amount: 300000, status: "paid" }], []).available).toBe(0);
  });
});

describe("escapeLike", () => {
  it("treats % and _ in an email literally", () => {
    expect(escapeLike("a_b%c")).toBe("a\\_b\\%c");
    expect(escapeLike("john@gmail.com")).toBe("john@gmail.com");
  });
});
