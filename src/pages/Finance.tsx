import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroFinance from "@/assets/feature-smart-app.jpg";
import { MessageCircle, FileText, CreditCard, Wrench, Home, ShieldCheck, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { n: 1, icon: MessageCircle, title: "Free Consultation", desc: "Talk to our experts about your energy needs and get a personalized assessment of your property." },
  { n: 2, icon: FileText, title: "Custom Quote", desc: "Receive a detailed quote with system specs, pricing breakdown, and projected savings." },
  { n: 3, icon: CreditCard, title: "30% Deposit", desc: "Secure your installation with just 30% upfront. The remaining balance is split into easy installments." },
  { n: 4, icon: Wrench, title: "Professional Installation", desc: "Our certified technicians install your system with minimal disruption. Typically completed in 1 to 3 days." },
  { n: 5, icon: Home, title: "Balance Payments", desc: "Pay the remaining 70% in flexible monthly installments that fit your budget. Zero hidden fees." },
];

const plans = [
  { name: "3-Month Plan", rate: "23.3%", period: "/month", note: "of total system cost × 3 months", features: ["Zero interest", "3 equal payments", "Fastest payoff", "Ideal for small systems"], popular: false },
  { name: "6-Month Plan", rate: "11.7%", period: "/month", note: "of total system cost × 6 months", features: ["Low interest rate", "6 equal payments", "Most popular", "Great for homes"], popular: true },
  { name: "12-Month Plan", rate: "5.8%", period: "/month", note: "of total system cost × 12 months", features: ["Affordable payments", "12 equal payments", "Maximum flexibility", "Best for large systems"], popular: false },
];

const faqs = [
  { q: "What happens if I miss a payment?", a: "We send a reminder 3 days before each due date. If a payment is missed, our team reaches out to arrange a flexible solution before any penalties apply." },
  { q: "Is there a credit check required?", a: "No formal credit check. We assess affordability through a brief consultation to ensure plan fits your budget." },
  { q: "Can I pay off early without penalty?", a: "Yes. You can settle the remaining balance any time at no extra cost." },
  { q: "What's included in the quoted price?", a: "Equipment, installation, configuration, testing, and a 2-year workmanship warranty. No hidden fees." },
  { q: "Do you offer financing for businesses?", a: "Yes. We offer extended commercial plans for SMEs, schools, and offices. Contact us for a custom quote." },
];

const Finance = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <PageHero
      eyebrow="Finance"
      title="Flexible payment plans that work for you"
      subtitle="Start your energy journey with just 30% down. Spread the rest over 3, 6, or 12 months with zero hidden fees."
      backgroundImage={heroFinance}
      backgroundAlt="Smart home control app on phone"
    />

    <section className="section-padding">
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

    <section className="section-padding bg-muted">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">Choose Your Plan</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">All plans start with 30% upfront. Pick the installment schedule that works for you.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 bg-card hover-lift ${p.popular ? "border-primary shadow-[var(--shadow-elevated)]" : "border-border"}`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/30">
                  Most Popular
                </span>
              )}
              <h3 className="font-display font-bold text-foreground text-lg mb-3">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-display font-bold text-primary">{p.rate}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-5">{p.note}</p>
              <ul className="space-y-2.5 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="text-primary mt-0.5 shrink-0" size={16} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={`w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${p.popular ? "bg-primary text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20" : "border border-border text-foreground hover:bg-muted"}`}
              >
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding">
      <div className="section-container">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-[var(--shadow-card)]">
          <ShieldCheck className="text-primary mx-auto mb-4" size={36} />
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-3">Your Investment is Protected</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every system comes with a comprehensive warranty, professional installation certificate, and ongoing maintenance support. Your solar investment is safe with Tioga Technologies.
          </p>
        </div>
      </div>
    </section>

    <section className="section-padding bg-muted">
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

    <section className="section-padding">
      <div className="section-container text-center">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight mb-3">Ready to Go Solar?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-7">Start with a free consultation and see how affordable clean energy can be.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/?lead=1"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
          >
            Get a Free Quote <ArrowRight size={16} />
          </Link>
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

export default Finance;
