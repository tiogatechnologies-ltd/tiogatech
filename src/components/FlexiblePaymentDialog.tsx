import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wallet, ArrowRight, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calcPlan, formatNGN, DEFAULT_FINANCE_CONFIG, normalizeFinanceConfig, type FinanceConfig } from "@/lib/financeCalc";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemName?: string;
  itemType?: string;
  itemId?: string;
  price?: number | null;
}

const eligibility = [
  "Valid government-issued ID (NIN, voter's card, driver's license, or passport)",
  "Verifiable Nigerian address (utility bill, rental agreement, or LGA letter)",
  "Recent bank statements (last 3 months)",
  "Employment letter or registered business / income verification",
  "BVN / NIN verification",
  "Guarantor information (where applicable)",
];

const FlexiblePaymentDialog = ({ open, onOpenChange, itemName, price }: Props) => {
  const [config, setConfig] = useState<FinanceConfig>(DEFAULT_FINANCE_CONFIG);
  const [amount, setAmount] = useState<number>(price && price >= 1_000_000 ? price : 1_500_000);
  const [months, setMonths] = useState<number>(12);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "finance").maybeSingle();
      if (data?.value) setConfig(normalizeFinanceConfig(data.value as any));
    })();
  }, []);

  useEffect(() => {
    if (open && price && price >= 1_000_000) setAmount(price);
  }, [open, price]);

  const tenures = config.tenures_months?.length ? config.tenures_months : [3, 6, 12, 24];
  const plan = useMemo(() => calcPlan(amount, months, config), [amount, months, config]);
  const applyHref = `/finance/apply?item=${encodeURIComponent(itemName || "Easy Flex")}&amount=${amount}&months=${months}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center mb-2"><Wallet size={20} /></div>
          <DialogTitle className="font-display text-xl">Easy Flex — pay over time</DialogTitle>
          <DialogDescription>
            Start with 30% deposit, then spread the rest over 3, 6, 12 or 24 months. Adjust the amount below to see your plan.
          </DialogDescription>
        </DialogHeader>

        {itemName && (
          <p className="text-xs text-muted-foreground -mt-2">For <strong className="text-foreground">{itemName}</strong></p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">System cost (NGN)</label>
            <input
              type="number" min={1_000_000} step={50_000} value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2.5 text-lg font-display font-bold"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {tenures.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`p-2 rounded-xl border text-xs font-semibold ${months === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
              >
                {m} mo
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">30% deposit</span><span className="font-semibold">{formatNGN(plan.deposit)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Interest ({(plan.interest_rate * 100).toFixed(0)}%)</span><span>{formatNGN(plan.interest_amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Insurance (2%) + Mgmt (1%)</span><span>{formatNGN(plan.insurance_fee + plan.management_fee)}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-border font-display text-base font-bold"><span>Monthly × {months}</span><span className="text-primary">{formatNGN(plan.monthly_payment)}</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Interest tiers</p>
          <ul className="text-xs space-y-1">
            <li className="flex justify-between"><span>₦1M – ₦5M</span><span className="font-semibold">9% + 2% ins + 1% mgmt</span></li>
            <li className="flex justify-between"><span>₦5M – ₦7.5M</span><span className="font-semibold">15% + 2% ins + 1% mgmt</span></li>
            <li className="flex justify-between"><span>Above ₦7.5M</span><span className="font-semibold">25% + 2% ins + 1% mgmt</span></li>
          </ul>
        </div>

        <details className="group rounded-xl border border-border bg-card p-3">
          <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold">
            <span>Eligibility requirements</span>
            <ChevronDown size={16} className="text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {eligibility.map((e) => (
              <li key={e} className="flex gap-2"><span className="text-primary">•</span>{e}</li>
            ))}
          </ul>
        </details>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Link
            to={applyHref}
            onClick={() => onOpenChange(false)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            Apply now <ArrowRight size={14} />
          </Link>
          <Link
            to="/finance"
            onClick={() => onOpenChange(false)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Visit full Finance page
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlexiblePaymentDialog;
