import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroSolar from "@/assets/feature-solar-panel.jpg";
import bgTechMesh from "@/assets/bg-tech-mesh.jpg";
import bgSolarField from "@/assets/bg-solar-field.jpg";
import bgLagosNight from "@/assets/bg-lagos-night.jpg";
import featureApp from "@/assets/feature-smart-app.jpg";
import { Plus, Calculator, Sparkles, CheckCircle2, BarChart3, Wallet, Globe, Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { n: 1, icon: Plus, title: "Add Your Appliances", desc: "List the devices you use daily with their wattage and usage hours.", bg: featureApp },
  { n: 2, icon: Calculator, title: "Calculate Energy", desc: "We compute your total daily and monthly energy consumption instantly.", bg: bgTechMesh },
  { n: 3, icon: Sparkles, title: "Get AI Recommendation", desc: "Our AI analyzes your profile and recommends the optimal solar setup.", bg: bgSolarField },
];

const benefits = [
  { icon: CheckCircle2, title: "Accurate Sizing", desc: "No more guessing. Get precisely sized panels, batteries, and inverters for your needs." },
  { icon: Wallet, title: "Cost Savings", desc: "Avoid overspending on oversized systems or underperforming with undersized ones." },
  { icon: Globe, title: "Africa Optimized", desc: "Calculations factor in African sun hours and climate conditions for accurate results." },
  { icon: BarChart3, title: "Detailed Breakdown", desc: "Receive panel count, battery capacity, inverter size, and estimated cost range." },
];

const youGet = [
  "Recommended panel wattage & count",
  "Battery capacity (kWh) & type",
  "Inverter size recommendation",
  "Estimated cost range in Naira",
  "System category (Starter / Home / Business)",
  "Personalized tips for your setup",
];

const LumiVoltAI = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <PageHero
      eyebrow="LumiVolt AI"
      title="Your AI-powered solar advisor"
      subtitle="Tell us what you power and we'll size the perfect solar system for your home or business in seconds."
      backgroundImage={heroSolar}
      backgroundAlt="Rooftop solar panels under bright sun"
    >
      <Link
        to="/contact"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
      >
        Get a Recommendation <ArrowRight size={16} />
      </Link>
    </PageHero>

    <section className="section-padding">
      <div className="section-container">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">Three Simple Steps</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="text-primary" size={26} />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {s.n}
                </span>
              </div>
              <h3 className="font-display font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-5 sm:p-6 flex items-start gap-3">
          <Lightbulb className="text-accent shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Tip:</span> Africa gets an average of 5 to 7 peak sun hours daily, making solar especially effective. Our AI factors in your location for optimal sizing.
          </p>
        </div>
      </div>
    </section>

    <section className="section-padding bg-muted">
      <div className="section-container">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Benefits</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">Why Use LumiVolt AI?</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Our AI ensures you get the perfect solar system, saving money and maximizing efficiency.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 hover-lift">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <b.icon className="text-primary" size={22} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding">
      <div className="section-container">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)] text-center">
          <Lightbulb className="text-primary mx-auto mb-3" size={28} />
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-6">What You'll Get</h2>
          <ul className="grid gap-3 sm:grid-cols-2 text-left max-w-2xl mx-auto">
            {youGet.map((g) => (
              <li key={g} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={16} />
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
          >
            Start Now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default LumiVoltAI;
