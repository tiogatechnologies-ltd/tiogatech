import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SolarPackagesSection from "@/components/SolarPackagesSection";
import SmartLocksSection from "@/components/SmartLocksSection";
import HomeAutomationSection from "@/components/HomeAutomationSection";
import { ArrowRight, Sparkles, Zap, Lock, Sun, Home as HomeIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { openLeadForm } from "@/components/SiteHeader";
import bgBundle from "@/assets/bg-bundle.jpg";

type CategoryKey = "solar" | "locks" | "automation";

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof Sun; desc: string }[] = [
  { key: "solar", label: "Solar Inverter Systems", icon: Sun, desc: "From 1KVA to 30KVA — pre-engineered for Nigerian load profiles." },
  { key: "locks", label: "Smart Lock Series", icon: Lock, desc: "STAMA biometric home locks and full hotel access ecosystems." },
  { key: "automation", label: "Home Automation", icon: HomeIcon, desc: "Three curated tiers: Ascentia, Sprout and Ibiza." },
];

const Packages = () => {
  const [active, setActive] = useState<CategoryKey | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <PageHero
        eyebrow="Packages"
        title="Curated bundles. No guesswork."
        subtitle="Hand-picked combinations of solar, smart and security gear for the most common Nigerian homes and businesses. Every package is installable next week."
        backgroundImage={bgBundle}
        backgroundAlt="Curated solar and smart home product bundles"
      >
        <button
          onClick={() => openLeadForm("packages_hero")}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
        >
          <Sparkles size={16} /> Get AI Recommendation
        </button>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/15 transition-all"
        >
          Talk to an Expert <ArrowRight size={16} />
        </Link>
      </PageHero>

      {/* Category selector */}
      <section className="section-padding bg-muted/30">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">
              Choose a category
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
              What are you shopping for?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Pick a category to view its full package lineup.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = active === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActive(isActive ? null : c.key)}
                  className={`group relative text-left rounded-3xl border p-6 transition-all duration-500 hover-lift ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-[var(--shadow-elevated)]"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl shadow ${isActive ? "bg-primary text-primary-foreground" : "bg-gold text-midnight"}`}>
                      <Icon size={18} />
                    </span>
                    <h3 className="font-display font-bold text-lg text-foreground no-clip">{c.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                  <span className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold ${isActive ? "text-primary" : "text-foreground/70 group-hover:text-primary"}`}>
                    {isActive ? "Showing below" : "Tap to view packages"} <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {active === "solar" && <SolarPackagesSection />}
      {active === "locks" && <SmartLocksSection />}
      {active === "automation" && <HomeAutomationSection />}

      <SiteFooter />
    </div>
  );
};

export default Packages;
