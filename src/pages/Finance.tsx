import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroFinance from "@/assets/feature-tablet-monitor.jpg";
import imgRooftopInstall from "@/assets/bg-rooftop-install.jpg";
import imgLagosApartment from "@/assets/bg-lagos-apartment.jpg";
import imgFamilyHome from "@/assets/feature-solar-roof.jpg";
import imgInstaller from "@/assets/bg-installer.jpg";
import imgBattery from "@/assets/feature-battery.jpg";

import { MessageCircle, FileText, CreditCard, Wrench, Home, ShieldCheck, Check, ArrowRight, Calculator, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";
import { supabase } from "@/integrations/supabase/client";
import { calcPlan, formatNGN, DEFAULT_FINANCE_CONFIG, normalizeFinanceConfig, type FinanceConfig } from "@/lib/financeCalc";

const steps = [
  { n: 1, icon: MessageCircle, title: "Free Consultation", desc: "Talk to our experts about your energy needs and get a personalized assessment." },
  { n: 2, icon: FileText, title: "Custom Quote", desc: "Receive a detailed quote with system specs, pricing breakdown, and projected savings." },
  { n: 3, icon: CreditCard, title: "30% Deposit", desc: "Secure your installation with just 30% upfront. The remaining balance is financed by our bank partner." },
  { n: 4, icon: Wrench, title: "Professional Installation", desc: "Our certified technicians install your system within 2 to 5 working days." },
  { n: 5, icon: Home, title: "Monthly Repayments", desc: "Pick 3, 6, 12 or 24 fixed monthly installments. Zero hidden fees." },
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
  { q: "How is interest calculated?", a: "Interest is set by our bank partner using three loan tiers: 9% (₦1m to ₦5m), 15% (₦5m to ₦7.5m), and 25% (above ₦7.5m). A 2% insurance fee and 1% management fee are added on top." },
  { q: "Which plan length should I choose?", a: "3 and 6 month plans clear faster with lower total cost. 12 and 24 month plans give you the smallest monthly payment. Pick whichever fits your cash flow." },
  { q: "What happens if I miss a payment?", a: "We send a reminder 3 days before each due date. If a payment is missed, our team reaches out to arrange a flexible solution before any penalties apply." },
  { q: "Can I pay off early without penalty?", a: "Yes. You can settle the remaining balance any time at no extra cost." },
  { q: "What is included in the quoted price?", a: "Equipment, VAT, installation, configuration, testing, and a 2-year workmanship warranty. No hidden fees." },
  { q: "How long does approval take?", a: "Decision within 24 hours of submitting your application and documents. Equipment procurement takes 3 to 5 working days." },
];

const Finance = () => {
  const { content: cms } = useLandingContent("page_finance");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };
  const [params] = useSearchParams();
  const itemName = params.get("item");
  const presetAmount = Number(params.get("amount") || 0);
  const presetPackage = params.get("package") || "";

  const [config, setConfig] = useState<FinanceConfig>(DEFAULT_FINANCE_CONFIG);
  const [amount, setAmount] = useState<number>(presetAmount > 0 ? presetAmount : 3000000);

  useEffect(() => { if (presetAmount > 0) setAmount(presetAmount); }, [presetAmount]);

  useEffect(() => {
    (async () => {
      const { data: settings } = await supabase.from("site_settings").select("value").eq("key", "finance").maybeSingle();
      if (settings?.value) setConfig(normalizeFinanceConfig(settings.value as any));
    })();
  }, []);

  const tenures = config.tenures_months?.length ? config.tenures_months : [3, 6, 12, 24];
  const plans = useMemo(() => tenures.map((t) => calcPlan(amount, t, config)), [amount, tenures, config]);
  // primary = lowest total repayment (shortest tenure)
  const primary = plans[0];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Lease-to-Own Solar Financing in Nigeria" description="Own your solar system with 30% down and flexible 3, 6, 12 or 24 month monthly repayments. Bank-partner financing for homes and businesses across Nigeria." path="/finance" />
      <SiteHeader />
      <PageHero
        eyebrow={c.eyebrow || "Tioga Flex Lease-to-Own"}
        title={c.title || "Own your solar system without paying upfront"}
        subtitle={c.subtitle || "Start with 30% deposit, then spread the rest over 3, 6, 12 or 24 fixed monthly payments. Bank-partner financing, professional installation, and insurance included."}
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
            <Link to={`/finance/apply?item=${encodeURIComponent(itemName)}&amount=${presetAmount || amount}&months=${tenures[0]}${presetPackage ? `&package=${presetPackage}` : ""}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              Apply now <ArrowRight size={12} />
            </Link>
          </div>
        </section>
      )}

      {/* CALCULATOR */}
      <section className="section-padding bg-muted/30">
        <div className="section-container max-w-6xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3"><Calculator size={22} /></div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">Flex repayment calculator</h2>
            <p className="mt-3 text-muted-foreground">Enter any project cost to see your deposit, interest tier, and monthly payment across all 4 plan lengths.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6">
            <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">System cost (NGN)</label>
              <input type="number" min={1000000} step={50000} value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="w-full mt-2 rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-xl sm:text-2xl font-display font-bold" />
              <input type="range" min={1000000} max={20000000} step={50000} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full mt-3 accent-primary" />
              <div className="mt-5 space-y-2 text-xs sm:text-sm border-t border-border pt-4">
                <Row label="30% Deposit" value={formatNGN(primary.deposit)} />
                <Row label="Financed (70%)" value={formatNGN(primary.financed)} />
                <Row label={`Interest tier (${(primary.interest_rate * 100).toFixed(0)}%)`} value={formatNGN(primary.interest_amount)} muted />
                <Row label="Insurance (2%)" value={formatNGN(primary.insurance_fee)} muted />
                <Row label="Management (1%)" value={formatNGN(primary.management_fee)} muted />
                <div className="pt-2 border-t border-border">
                  <Row label="Total repayment" value={formatNGN(primary.total_repayment)} bold />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {plans.map((p, i) => {
                const popular = i === plans.length - 1; // longest tenure = smallest monthly
                return (
                  <div key={p.tenure_months} className={`rounded-3xl border p-4 sm:p-5 bg-card relative ${popular ? "border-primary shadow-[var(--shadow-elevated)]" : "border-border"}`}>
                    {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">Lowest monthly</span>}
                    <h3 className="font-display font-bold">{p.tenure_months}-Month Plan</h3>
                    <p className="text-[11px] text-muted-foreground mb-3">{(p.interest_rate * 100).toFixed(0)}% interest · 2% insurance · 1% mgmt</p>
                    <p className="text-xl sm:text-2xl font-display font-bold text-primary tabular-nums break-words">{formatNGN(p.monthly_payment)}</p>
                    <p className="text-[11px] text-muted-foreground mb-3">per month × {p.tenure_months}</p>
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} />Deposit: {formatNGN(p.deposit)}</li>
                      <li className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} />Total: {formatNGN(p.total_repayment)}</li>
                    </ul>
                    <Link to={`/finance/apply?item=${encodeURIComponent(itemName || "Tioga Flex Plan")}&amount=${amount}&months=${p.tenure_months}${presetPackage ? `&package=${presetPackage}` : ""}`}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110">
                      Apply <ArrowRight size={12} />
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

      {/* VISUAL BAND */}
      <section className="section-padding">
        <div className="section-container">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { img: imgFamilyHome, title: "Power your home", desc: "Lease-to-own systems sized for Nigerian family homes." },
              { img: imgLagosApartment, title: "Run your business", desc: "Keep shops, salons and offices open through every outage." },
              { img: imgBattery, title: "Backup that lasts", desc: "Lithium battery banks built for daily cycling, not just outages." },
            ].map((card) => (
              <div key={card.title} className="group relative rounded-3xl overflow-hidden border border-border bg-card hover-lift">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={card.img} alt={card.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg">{card.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-padding bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <img src={imgRooftopInstall} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="section-container max-w-3xl relative">
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
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-card)]">
            <img src={imgInstaller} alt="Certified Tioga installer on rooftop" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-midnight/90 via-midnight/75 to-midnight/40" />
            <div className="relative p-8 sm:p-14 max-w-2xl text-primary-foreground">
              <ShieldCheck className="text-gold mb-4" size={36} />
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3">Your investment is protected</h2>
              <p className="opacity-90 leading-relaxed">
                Every Flex plan includes 2% insurance, professional installation, and ongoing maintenance. Your system is covered for the full repayment period and beyond.
              </p>
            </div>
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
