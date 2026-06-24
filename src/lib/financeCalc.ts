// Lease-to-Own finance calculator. Single source of truth used by the Finance
// page, FinanceApply form, and the approve-finance edge function (mirrored).

export interface InterestTier {
  min: number;
  max: number | null;
  rate: number;
}

export interface FinanceConfig {
  deposit_pct: number;
  insurance_pct: number;
  management_pct: number;
  tenures_months: number[];
  interest_tiers: InterestTier[];
  vat_pct: number;
  install_pct: number;
}

export const DEFAULT_FINANCE_CONFIG: FinanceConfig = {
  deposit_pct: 0.30,
  insurance_pct: 0.02,
  management_pct: 0.01,
  tenures_months: [3, 6, 12, 24],
  interest_tiers: [
    { min: 1_000_000, max: 5_000_000, rate: 0.09 },
    { min: 5_000_001, max: 7_500_000, rate: 0.15 },
    { min: 7_500_001, max: null, rate: 0.25 },
  ],
  vat_pct: 0.075,
  install_pct: 0.10,
};

export const lookupInterest = (cost: number, cfg: FinanceConfig = DEFAULT_FINANCE_CONFIG): InterestTier => {
  for (const t of cfg.interest_tiers) {
    if (cost >= t.min && (t.max === null || cost <= t.max)) return t;
  }
  return cfg.interest_tiers[cfg.interest_tiers.length - 1];
};

export interface PlanBreakdown {
  total: number;
  deposit: number;
  financed: number;
  interest_rate: number;
  interest_amount: number;
  insurance_fee: number;
  management_fee: number;
  total_repayment: number;
  tenure_months: number;
  monthly_payment: number;
}

export const calcPlan = (
  totalCost: number,
  tenureMonths: number,
  cfg: FinanceConfig = DEFAULT_FINANCE_CONFIG,
): PlanBreakdown => {
  const total = Math.max(0, Math.round(totalCost));
  const deposit = Math.round(total * cfg.deposit_pct);
  const financed = total - deposit;
  const tier = lookupInterest(total, cfg);
  const interest_amount = Math.round(financed * tier.rate);
  const insurance_fee = Math.round(financed * cfg.insurance_pct);
  const management_fee = Math.round(financed * cfg.management_pct);
  const total_repayment = financed + interest_amount + insurance_fee + management_fee;
  const monthly_payment = Math.round(total_repayment / Math.max(1, tenureMonths));
  return {
    total,
    deposit,
    financed,
    interest_rate: tier.rate,
    interest_amount,
    insurance_fee,
    management_fee,
    total_repayment,
    tenure_months: tenureMonths,
    monthly_payment,
  };
};

export const formatNGN = (n: number) =>
  `₦${Math.round(n || 0).toLocaleString("en-NG")}`;
