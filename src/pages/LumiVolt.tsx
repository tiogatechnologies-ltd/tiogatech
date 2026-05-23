import { useState } from "react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import bgResidential from "@/assets/bg-lumivolt-residential.jpg";
import bgRooftop from "@/assets/bg-lumivolt-rooftop.jpg";
import bgSolarField from "@/assets/bg-solar-field.jpg";
import bgSolarAerial from "@/assets/bg-solar-aerial.jpg";
import bgPanelClose from "@/assets/bg-panel-closeup.jpg";
import featureSolar from "@/assets/feature-solar-panel.jpg";
import featureSolarRoof from "@/assets/feature-solar-roof.jpg";
import featureBattery from "@/assets/feature-battery.jpg";
import featureApp from "@/assets/feature-energy-app.jpg";
import bgTechMesh from "@/assets/bg-grid-particles.jpg";
import { Sun, BatteryCharging, Home, Calculator, Sparkles, CheckCircle2, Wallet, Globe, BarChart3, Lightbulb, ArrowRight, Plus, Download, Coins, TrendingUp, Building2, Users2, Briefcase, Wrench, Shield, Smartphone, Cpu, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import WattsCalculator from "@/components/lead-form/WattsCalculator";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";
import type { SelectedAppliance } from "@/data/applianceWatts";

const pillars = [
  { icon: Sun, title: "Rooftop Solar", desc: "Tier-1 panels sized for your roof and daily load, engineered for Nigerian sun hours." },
  { icon: BatteryCharging, title: "Battery Backup", desc: "Lithium storage that powers your essentials through the longest grid blackouts." },
  { icon: Home, title: "Whole-Home Energy", desc: "Hybrid inverters that switch between solar, battery and grid in milliseconds." },
];

const steps = [
  { n: 1, icon: Plus, title: "Add Your Appliances", desc: "List the devices you use daily with their wattage and usage hours.", bg: featureApp },
  { n: 2, icon: Calculator, title: "Calculate Energy", desc: "We compute your total daily and monthly energy consumption instantly.", bg: bgTechMesh },
  { n: 3, icon: Sparkles, title: "Get a System", desc: "Our team designs the perfect solar setup, fully installed and warrantied.", bg: bgSolarField },
];

const benefits = [
  { icon: CheckCircle2, title: "Accurate Sizing", desc: "Precisely sized panels, batteries, and inverters for your real load." },
  { icon: Wallet, title: "Cost Savings", desc: "Avoid overspending on oversized systems, or underperforming with undersized ones." },
  { icon: Globe, title: "Built for Nigeria", desc: "Tuned for 5 to 7 peak sun hours and the realities of the local grid." },
  { icon: BarChart3, title: "Detailed Breakdown", desc: "Receive panel count, battery capacity, inverter size, and estimated cost range." },
];

const youGet = [
  "Recommended panel wattage and count",
  "Battery capacity (kWh) and chemistry",
  "Inverter size recommendation",
  "Estimated cost range in Naira",
  "System category (Starter / Home / Business)",
  "Personalized tips for your setup",
];

const LumiVolt = () => {
  const [appliances, setAppliances] = useState<SelectedAppliance[]>([]);
  const { content: cms } = useLandingContent("page_lumivolt");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };
  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="LumiVolt — Residential Solar by Tioga" description="Rooftop solar, lithium battery backup and hybrid inverters engineered for Nigerian homes. Beat the blackout with LumiVolt by Tioga Technologies." path="/lumivolt" />
      <SiteHeader />

      <PageHero
        eyebrow={c.eyebrow || "A Tioga Sub-brand · Residential"}
        title={c.title || "LumiVolt — clean, reliable solar for your home"}
        subtitle={c.subtitle || "Off-grid, hybrid and grid-tie solar systems engineered for Nigerian homes. Sized accurately, installed cleanly, monitored 24/7."}
        backgroundImage={bgResidential}
        backgroundAlt="Modern Nigerian home with rooftop solar at golden hour"
      >
        <Link
          to="/coming-soon"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 ios-press shadow-md shadow-primary/20"
        >
          <Download size={16} /> Download App
        </Link>
      </PageHero>

      {/* Project Overview */}
      <section className="section-padding">
        <div className="section-container grid gap-8 lg:grid-cols-2 items-center max-w-6xl">
          <div className="relative rounded-3xl overflow-hidden border border-border aspect-[4/3] order-2 lg:order-1">
            <img src={bgRooftop} alt="LumiVolt rooftop solar install" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Project Overview</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip mb-4">
              A tokenized renewable energy platform
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Virtual solar ownership, climate fintech and PAYG energy automation in one platform. Built for Nigerian homes, renters and SMEs.
            </p>
          </div>
        </div>
      </section>

      {/* Core Goal & Impact */}
      <section className="section-padding bg-muted">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Impact</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
              Real returns, real savings
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3 max-w-5xl mx-auto">
            {[
              { icon: Wallet, stat: "30%", label: "Lower bills" },
              { icon: TrendingUp, stat: "12-18%", label: "Annual ROI" },
              { icon: Coins, stat: "$14B", label: "Market opportunity" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-6 ios-card text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gold/15 flex items-center justify-center mb-3">
                  <s.icon className="text-gold" size={22} />
                </div>
                <p className="text-3xl sm:text-4xl font-display font-bold text-primary mb-1">{s.stat}</p>
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="section-padding">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
              Energy in Nigeria is broken
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Building2, title: "Renters & SMEs", desc: "Diesel costs eat margins. No rooftop, no solar access." },
              { icon: Home, title: "Estates", desc: "Heavy capex, fragmented billing, slow support." },
              { icon: Shield, title: "Operators", desc: "No auditable settlements or fraud-resistant reconciliation." },
              { icon: Wrench, title: "Installers", desc: "Limited inventory financing and verified channels." },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-card p-6 ios-card">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <p.icon className="text-primary" size={20} />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual showcase strip */}
      <section className="section-padding bg-muted">
        <div className="section-container grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl">
          {[
            { src: featureSolarRoof, label: "Rooftop installs" },
            { src: featureBattery, label: "Lithium backup" },
            { src: bgPanelClose, label: "Tier-1 panels" },
            { src: bgSolarAerial, label: "Estate scale" },
          ].map((img) => (
            <div key={img.label} className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-border hover-lift">
              <img src={img.src} alt={img.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/30 to-transparent" />
              <p className="absolute bottom-3 left-4 right-4 text-sm font-semibold text-primary-foreground">{img.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Target Audience */}
      <section className="section-padding">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Built For</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
              Who uses LumiVolt
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              { icon: Users2, label: "Urban renters & SMEs" },
              { icon: Home, label: "Homeowners" },
              { icon: Sun, label: "Verified solar vendors" },
              { icon: Briefcase, label: "NGOs & financiers" },
            ].map((a) => (
              <div key={a.label} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                  <a.icon className="text-gold" size={18} />
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">{a.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="section-padding bg-muted">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Platform</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
              What LumiVolt does
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="text-primary" size={22} />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">Core features</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Portable energy credits",
                  "PAYG smart-device automation",
                  "Unified web & mobile app",
                  "Climate fintech wallet",
                ].map((cap) => (
                  <li key={cap} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={16} />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
                  <Cpu className="text-gold" size={22} />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">MVP validates</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Marketplace with BNPL / BOOT / PAYG",
                  "SaaS dashboard with IoT integrations",
                  "Solar reservation & energy credits",
                  "AI-powered underwriting",
                ].map((mvp) => (
                  <li key={mvp} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Zap className="text-gold mt-0.5 shrink-0" size={16} />
                    <span>{mvp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* Pillars */}
      <section className="section-padding">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">What LumiVolt Powers</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">A complete residential energy stack</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-card p-6 ios-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <p.icon className="text-primary" size={22} />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-muted">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">Three Simple Steps</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="group relative rounded-2xl overflow-hidden border border-border min-h-[260px] ios-card">
                <img src={s.bg} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/75 to-midnight/40" />
                <div className="relative h-full p-6 flex flex-col justify-end text-primary-foreground">
                  <div className="relative w-14 h-14 rounded-2xl bg-gold text-midnight flex items-center justify-center shadow-lg mb-4">
                    <s.icon size={24} />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-midnight text-gold text-xs font-bold flex items-center justify-center border border-gold/40">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1.5 no-clip">{s.title}</h3>
                  <p className="text-sm text-primary-foreground/80 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Benefits</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">Why homeowners pick LumiVolt</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 ios-card">
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

      {/* Watts Calculator */}
      <section className="relative section-padding overflow-hidden">
        <img src={bgSolarField} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="relative section-container">
          <div className="text-center mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Try It Now</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">Calculate your power needs</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Add your appliances below to instantly see your total wattage and the recommended inverter size.
            </p>
          </div>
          <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <WattsCalculator selectedAppliances={appliances} onChange={setAppliances} />
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-3">Ready for a personalized solar recommendation?</p>
              <Link
                to="#" onClick={(e) => { e.preventDefault(); openLeadForm("page_cta"); }}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-midnight hover:brightness-110 ios-press shadow-md shadow-gold/30"
              >
                <Sparkles size={15} /> Get AI Recommendation <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* You Get */}
      <section className="section-padding">
        <div className="section-container">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)] text-center">
            <Lightbulb className="text-primary mx-auto mb-3" size={28} />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-6">What is in your LumiVolt design</h2>
            <ul className="grid gap-3 sm:grid-cols-2 text-left max-w-2xl mx-auto">
              {youGet.map((g) => (
                <li key={g} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/coming-soon"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 ios-press shadow-md shadow-primary/20"
            >
              <Download size={16} /> Download App
            </Link>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Looking for smart locks, lighting and home automation? Visit{" "}
            <Link to="/voltai" className="text-primary font-semibold hover:underline">VoltAi</Link>, our smart automation sub-brand.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default LumiVolt;
