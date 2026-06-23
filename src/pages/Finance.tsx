import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroFinance from "@/assets/feature-tablet-monitor.jpg";
import { MessageCircle, FileText, CreditCard, Wrench, Home, ShieldCheck, Check, ArrowRight, Calculator, Sparkles, Zap } from "lucide-react";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";
import { supabase } from "@/integrations/supabase/client";
import { calcPlan, formatNGN, DEFAULT_FINANCE_CONFIG, type FinanceConfig } from "@/lib/financeCalc";

const steps = [
  { n: 1, icon: MessageCircle, title: "Free Consultation", desc: "Talk to our experts about your energy needs and get a personalized assessment." },
  { n: 2, icon: FileText, title: "Custom Quote", desc: "Receive a detailed quote with system specs, pricing breakdown, and projected savings." },
  { n: 3, icon: CreditCard, title: "30% Deposit", desc: "Secure your installation with just 30% upfront. The remaining balance is financed by our bank partner." },
  { n: 4, icon: Wrench, title: "Professional Installation", desc: "Our certified technicians install your system within 2 to 5 working days." },
  { n: 5, icon: Home, title: "Monthly Repayments", desc: "Spread the balance over 12 or 24 fixed monthly installments. Zero hidden fees." },
];

const eligibility = [
  "Valid government-issued ID (NIN, voter's card, driver's license, or passport)",
  "Verifiable Nigerian address (utility bill, rental agreement, or LGA letter)",
  "Recent bank statements (last 3 months)",
  "Employment letter or registered business / income verification",
  "BVN / NIN verification",
  "Guarantor information (where applicable)",
];

const faqs = [
  { q: "How is interest calculated?", a: "Interest is set by our bank partner using three loan tiers: 9% (₦1m–₦5m), 15% (₦5m–₦7.5m), and 25% (above ₦7.5m). A 2% insurance fee and 1% management fee are added on top." },
  { q: "What happens if I miss a payment?", a: "We send a reminder 3 days before each due date. If a payment is missed, our team reaches out to arrange a flexible solution before any penalties apply." },
  { q: "Can I pay off early without penalty?", a: "Yes. You can settle the remaining balance any time at no extra cost." },
  { q: "What is included in the quoted price?", a: "Equipment, VAT, installation, configuration, testing, and a 2-year workmanship warranty. No hidden fees." },
  { q: "How long does approval take?", a: "Decision within 24 hours of submitting your application + documents. Equipment procurement takes 3-5 working days." },
];

const FLAGSHIP_NUMBERS = [20, 21];

const Finance = () => {
  const { content: cms } = useLandingContent("page_finance");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };
  const [params] = useSearchParams();
  const itemName = params.get("item");
  const presetAmount = Number(params.get("amount") || 0);
  const presetPackage = params.get("package") || "";

  const [config, setConfig] = useState<FinanceConfig>(DEFAULT_FINANCE_CONFIG);
  const [packages, setPackages] = useState<any[]>([]);
  const [amount, setAmount] = useState<number>(presetAmount > 0 ? presetAmount : 8185403);
  const [selectedPkg, setSelectedPkg] = useState<string>(presetPackage);

  useEffect(() => {
    if (presetAmount > 0) setAmount(presetAmount);
  }, [presetAmount]);

  useEffect(() => {
    (async () => {
      const { data: settings } = await supabase.from("site_settings").select("value").eq("key", "finance").maybeSingle();
      if (settings?.value) setConfig({ ...DEFAULT_FINANCE_CONFIG, ...(settings.value as any) });
      const { data: pkgs } = await supabase.from("solar_packages").select("*").in("package_number", FLAGSHIP_NUMBERS).eq("is_active", true).order("package_number");
      setPackages(pkgs || []);
    })();
  }, []);

  const tenures = config.tenures_months?.length ? config.tenures_months : [12, 24];
  const plans = useMemo(() => tenures.map((t) => calcPlan(amount, t, config)), [amount, tenures, config]);
  const primary = plans[0];

  const choosePackage = (p: any) => {
    setSelectedPkg(`pkg-${p.package_number}`);
    setAmount(Number(p.total_price));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Lease-to-Own Solar Financing in Nigeria" description="Own your solar system with 30% down and flexible 12 or 24 month monthly repayments. Bank-partner financing for homes and businesses across Nigeria." path="/finance" />
      <SiteHeader />
      <PageHero
        eyebrow={c.eyebrow || "Tioga Flex Lease-to-Own"}
        title={c.title || "Own your solar system without paying upfront"}
        subtitle={c.subtitle || "Start with 30% deposit, then spread the rest over 12 or 24 fixed monthly payments. Bank-partner financing, professional installation, and insurance included."}
        backgroundImage={heroFinance}
        backgroundAlt="Solar panels powering a Nigerian home"
      />

      {itemName && (
        <section className="bg-accent/10 border-y border-accent/20">
          <div className="section-container py-4 flex items-center gap-3 flex-wrap">
            <Sparkles className="text-accent-foreground shrink-0" size={18} />
            <p className="text-sm text-foreground flex-1 min-w-0">
              Setting up Flex Lease-to-Own for <strong>{itemName}</strong>
              {presetAmount > 0 && <> at <strong>{formatNGN(presetAmount)}</strong></>}.
            </p>
            <Link to={`/finance/apply?item=${encodeURIComponent(itemName)}&amount=${presetAmount || amount}&months=${tenures[0]}${selectedPkg ? `&package=${selectedPkg}` : ""}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              Apply now <ArrowRight size={12} />
            </Link>
          </div>
        </section>
      )}

      {/* FLAGSHIP PACKAGES */}
      {packages.length > 0 && (
        <section className="section-padding">
          <div className="section-container">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3"><Zap size={22} /></div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">Flagship Flex packages</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Two engineering-approved systems ready for instant Lease-to-Own approval. Choose one to auto-fill the calculator.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {packages.map((p) => {
                const breakdown = calcPlan(Number(p.total_price), tenures[0], config);
                const isSel = selectedPkg === `pkg-${p.package_number}`;
                return (
                  <button key={p.id} onClick={() => choosePackage(p)} className={`text-left rounded-3xl border p-6 transition-all ${isSel ? "border-primary shadow-[var(--shadow-elevated)] bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}>
                    {p.badge && <span className="inline-flex text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-accent text-accent-foreground mb-3">{p.badge}</span>}
                    <h3 className="font-display text-xl font-bold">{p.tagline}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{p.appliances}</p>
                    <ul className="mt-4 space-y-1.5 text-xs text-foreground">
                      <li className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} />{p.inverter}</li>
                      <li className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} />{p.battery}</li>
                      <li className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} />{p.solar_panels}</li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-border flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Total project cost</p>
                        <p className="font-display text-xl font-bold">{formatNGN(p.total_price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">From</p>
                        <p className="font-display text-lg font-bold text-primary">{formatNGN(breakdown.monthly_payment)}<span className="text-[11px] font-normal text-muted-foreground">/mo</span></p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CALCULATOR */}
      <section className="section-padding bg-muted/30">
        <div className="section-container max-w-5xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3"><Calculator size={22} /></div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">Flex repayment calculator</h2>
            <p className="mt-3 text-muted-foreground">Enter any project cost to see your deposit, interest tier, and monthly payment.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
            <div className="rounded-3xl border border-border bg-card p-6">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">System cost (NGN)</label>
              <input type="number" min={1000000} step={50000} value={amount}
                onChange={(e) => { setAmount(Math.max(0, Number(e.target.value))); setSelectedPkg(""); }}
                className="w-full mt-2 rounded-xl border border-border bg-background px-4 py-3 text-2xl font-display font-bold" />
              <input type="range" min={1000000} max={20000000} step={50000} value={amount}
                onChange={(e) => { setAmount(Number(e.target.value)); setSelectedPkg(""); }}
                className="w-full mt-3 accent-primary" />
              <div className="mt-5 space-y-2 text-sm border-t border-border pt-4">
                <Row label="30% Deposit" value={formatNGN(primary.deposit)} />
                <Row label="Financed (70%)" value={formatNGN(primary.financed)} />
                <Row label={`Interest (${(primary.interest_rate * 100).toFixed(0)}%)`} value={formatNGN(primary.interest_amount)} muted />
                <Row label="Insurance (2%)" value={formatNGN(primary.insurance_fee)} muted />
                <Row label="Management (1%)" value={formatNGN(primary.management_fee)} muted />
                <div className="pt-2 border-t border-border">
                  <Row label="Total repayment" value={formatNGN(primary.total_repayment)} bold />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {plans.map((p, i) => {
                const popular = i === 0;
                return (
                  <div key={p.tenure_months} className={`rounded-3xl border p-5 bg-card relative ${popular ? "border-primary shadow-[var(--shadow-elevated)]" : "border-border"}`}>
                    {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">Lowest total</span>}
                    <h3 className="font-display font-bold">{p.tenure_months}-Month Plan</h3>
                    <p className="text-[11px] text-muted-foreground mb-3">{(p.interest_rate * 100).toFixed(0)}% interest tier · 2% insurance · 1% mgmt</p>
                    <p className="text-3xl font-display font-bold text-primary tabular-nums">{formatNGN(p.monthly_payment)}</p>
                    <p className="text-[11px] text-muted-foreground mb-3">per month × {p.tenure_months}</p>
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} />Deposit: {formatNGN(p.deposit)}</li>
                      <li className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} />Total repayment: {formatNGN(p.total_repayment)}</li>
                      <li className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} />Insurance + warranty included</li>
                    </ul>
                    <Link to={`/finance/apply?item=${encodeURIComponent(itemName || "Tioga Flex Plan")}&amount=${amount}&months=${p.tenure_months}${selectedPkg ? `&package=${selectedPkg}` : ""}`}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110">
                      Apply for {p.tenure_months} months <ArrowRight size={12} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => openLeadForm("finance_calculator")} className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted">
              Talk to an expert
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-padding">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">Five simple steps from consultation to switching on.</p>
          </div>
          <ol className="relative border-l border-border ml-3 space-y-8">
            {steps.map((s) => (
              <li key={s.n} className="pl-8 relative">
                <span className="absolute -left-[19px] top-0 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
                  <s.icon className="text-primary" size={18} />
                </span>
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Step {s.n}</p>
                <h3 className="text-lg font-display font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="section-padding bg-muted/30">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl font-display font-bold mb-2 text-center">Eligibility</h2>
          <p className="text-muted-foreground text-center mb-8">Have these ready and your application moves fast.</p>
          <ul className="space-y-3">
            {eligibility.map((e) => (
              <li key={e} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                <Check className="text-primary mt-0.5 shrink-0" size={18} />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TRUST */}
      <section className="section-padding">
        <div className="section-container">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-[var(--shadow-card)]">
            <ShieldCheck className="text-primary mx-auto mb-4" size={36} />
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3">Your investment is protected</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every Flex package includes 2% insurance, professional installation, and ongoing maintenance support. Your system is covered for the full repayment period.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-muted/30">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-center mb-10">Flex Lease-to-Own FAQ</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-[var(--shadow-card)]">
                <summary className="flex justify-between items-center cursor-pointer list-none font-display font-semibold">
                  {f.q}<span className="ml-4 text-muted-foreground transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-3">Ready to own your power?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-7">Start with a free assessment, then apply for Flex Lease-to-Own in under 5 minutes.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/solar-assessment" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20">
              Get an AI assessment <ArrowRight size={16} />
            </Link>
            <button onClick={() => openLeadForm("page_cta")} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted">
              Free consultation
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

const Row = ({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) => (
  <div className="flex justify-between">
    <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
    <span className={`${bold ? "font-display text-base font-bold" : "font-semibold"}`}>{value}</span>
  </div>
);

export default Finance;
