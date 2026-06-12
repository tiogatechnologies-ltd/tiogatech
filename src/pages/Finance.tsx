import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroFinance from "@/assets/feature-tablet-monitor.jpg";
import { MessageCircle, FileText, CreditCard, Wrench, Home, ShieldCheck, Check, ArrowRight, Calculator, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";

const steps = [
  { n: 1, icon: MessageCircle, title: "Free Consultation", desc: "Talk to our experts about your energy needs and get a personalized assessment of your property." },
  { n: 2, icon: FileText, title: "Custom Quote", desc: "Receive a detailed quote with system specs, pricing breakdown, and projected savings." },
  { n: 3, icon: CreditCard, title: "30% Deposit", desc: "Secure your installation with just 30% upfront. The remaining balance is split into easy installments." },
  { n: 4, icon: Wrench, title: "Professional Installation", desc: "Our certified technicians install your system with minimal disruption. Typically completed in 1 to 3 days." },
  { n: 5, icon: Home, title: "Balance Payments", desc: "Pay the remaining 70% in flexible monthly installments that fit your budget. Zero hidden fees." },
];

// Plan rates: monthly = remaining 70% × (1 + interest) / months
const PLANS = [
  { id: "3m", name: "3-Month Plan", months: 3, interest: 0, popular: false, features: ["Zero interest", "3 equal payments", "Fastest payoff"] },
  { id: "6m", name: "6-Month Plan", months: 6, interest: 0.05, popular: true, features: ["5% interest", "6 equal payments", "Most popular"] },
  { id: "12m", name: "12-Month Plan", months: 12, interest: 0.12, popular: false, features: ["12% interest", "12 equal payments", "Maximum flexibility"] },
];

const eligibility = [
  "Valid government-issued ID (NIN, voter's card, driver's license, or passport)",
  "Verifiable Nigerian address (utility bill, rental agreement, or LGA letter)",
  "Proof of employment OR registered business / recurring income",
  "Active Nigerian bank account in your name",
];

const faqs = [
  { q: "What happens if I miss a payment?", a: "We send a reminder 3 days before each due date. If a payment is missed, our team reaches out to arrange a flexible solution before any penalties apply." },
  { q: "Is there a credit check required?", a: "No formal credit check. We assess affordability through a brief consultation to ensure plan fits your budget." },
  { q: "Can I pay off early without penalty?", a: "Yes. You can settle the remaining balance any time at no extra cost." },
  { q: "What is included in the quoted price?", a: "Equipment, installation, configuration, testing, and a 2-year workmanship warranty. No hidden fees." },
  { q: "Do you offer financing for businesses?", a: "Yes. We offer extended commercial plans for SMEs, schools, and offices. Contact us for a custom quote." },
];

const formatNGN = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const Finance = () => {
  const { content: cms } = useLandingContent("page_finance");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };
  const [params] = useSearchParams();
  const itemName = params.get("item");
  const presetAmount = Number(params.get("amount") || 0);

  const [amount, setAmount] = useState<number>(presetAmount > 0 ? presetAmount : 1000000);

  useEffect(() => {
    if (presetAmount > 0) setAmount(presetAmount);
  }, [presetAmount]);

  const deposit = useMemo(() => Math.round(amount * 0.3), [amount]);
  const remaining = amount - deposit;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Solar Financing in Nigeria" description="Flexible 3, 6 or 12-month payment plans for solar, smart locks and home automation. Start with just 30% down — zero hidden fees." path="/finance" />
      <SiteHeader />
      <PageHero
        eyebrow={c.eyebrow || "Finance"}
        title={c.title || "Flexible payment plans that work for you"}
        subtitle={c.subtitle || "Start your energy journey with just 30% down. Spread the rest over 3, 6, or 12 months with zero hidden fees."}
        backgroundImage={heroFinance}
        backgroundAlt="Smart home control app on phone"
      />

      {itemName && (
        <section className="bg-accent/10 border-y border-accent/20">
          <div className="section-container py-4 flex items-center gap-3 flex-wrap">
            <Sparkles className="text-accent-foreground shrink-0" size={18} />
            <p className="text-sm text-foreground flex-1 min-w-0">
              Setting up flexible payment for <strong className="font-semibold">{itemName}</strong>
              {presetAmount > 0 && <> at <strong className="font-semibold">{formatNGN(presetAmount)}</strong></>}.
            </p>
            <button onClick={() => openLeadForm(`finance_${itemName}`)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              Apply now <ArrowRight size={12} />
            </button>
          </div>
        </section>
      )}

      {/* CALCULATOR */}
      <section className="section-padding">
        <div className="section-container max-w-5xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3"><Calculator size={22} /></div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">Payment Plan Calculator</h2>
            <p className="mt-3 text-muted-foreground">Enter your total system cost to see exactly what you'll pay.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
            <div className="rounded-3xl border border-border bg-card p-6">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">System cost (NGN)</label>
              <input
                type="number"
                min={100000}
                step={10000}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="w-full mt-2 rounded-xl border border-border bg-background px-4 py-3 text-2xl font-display font-bold text-foreground"
              />
              <input
                type="range"
                min={100000}
                max={20000000}
                step={50000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full mt-3 accent-primary"
              />
              <div className="mt-5 space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between"><span className="text-muted-foreground">30% Deposit</span><span className="font-semibold text-foreground">{formatNGN(deposit)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remaining balance</span><span className="font-semibold text-foreground">{formatNGN(remaining)}</span></div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {PLANS.map((p) => {
                const total = remaining * (1 + p.interest);
                const monthly = total / p.months;
                return (
                  <div key={p.id} className={`rounded-3xl border p-5 bg-card relative ${p.popular ? "border-primary shadow-[var(--shadow-elevated)]" : "border-border"}`}>
                    {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">Most Popular</span>}
                    <h3 className="font-display font-bold text-foreground">{p.name}</h3>
                    <p className="text-[11px] text-muted-foreground mb-3">{p.interest === 0 ? "Zero interest" : `${(p.interest * 100).toFixed(0)}% interest`}</p>
                    <p className="text-3xl font-display font-bold text-primary tabular-nums">{formatNGN(monthly)}</p>
                    <p className="text-[11px] text-muted-foreground mb-3">per month × {p.months}</p>
                    <ul className="space-y-1 text-xs text-foreground">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5"><Check className="text-primary mt-0.5 shrink-0" size={12} /><span>{f}</span></li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-8">
            <button onClick={() => openLeadForm("finance_calculator")} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20">
              Apply for this plan <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-padding bg-muted/30">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Five simple steps from consultation to powering your home.</p>
          </div>
          <ol className="relative border-l border-border ml-3 space-y-8">
            {steps.map((s) => (
              <li key={s.n} className="pl-8 relative">
                <span className="absolute -left-[19px] top-0 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
                  <s.icon className="text-primary" size={18} />
                </span>
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Step {s.n}</p>
                <h3 className="text-lg font-display font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="section-padding">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2 text-center">Eligibility</h2>
          <p className="text-muted-foreground text-center mb-8">Have these ready and your application moves fast.</p>
          <ul className="space-y-3">
            {eligibility.map((e) => (
              <li key={e} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                <Check className="text-primary mt-0.5 shrink-0" size={18} />
                <span className="text-foreground">{e}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TRUST */}
      <section className="section-padding bg-muted/30">
        <div className="section-container">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-[var(--shadow-card)]">
            <ShieldCheck className="text-primary mx-auto mb-4" size={36} />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-3">Your Investment is Protected</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every system comes with a comprehensive warranty, professional installation certificate, and ongoing maintenance support. Your investment is safe with Tioga Technologies.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight text-center mb-10">Financing FAQ</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-[var(--shadow-card)]">
                <summary className="flex justify-between items-center cursor-pointer list-none text-foreground font-display font-semibold">
                  {f.q}
                  <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/30">
        <div className="section-container text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight mb-3">Ready to Go Solar?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-7">Start with a free consultation and see how affordable clean energy can be.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => openLeadForm("page_cta")}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
            >
              Get a Free Quote <ArrowRight size={16} />
            </button>
            <Link
              to="/lumivolt"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all"
            >
              Calculate Your Needs
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Finance;
