import { lazy, Suspense, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { ArrowRight, Sparkles, Lock, Sun, Home as HomeIcon, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { openLeadForm } from "@/components/SiteHeader";
import bgBundle from "@/assets/bg-bundle.jpg";
import catSolar from "@/assets/cat-solar.jpg";
import catLocks from "@/assets/cat-locks.jpg";
import catAutomation from "@/assets/cat-automation.jpg";

const SolarPackagesSection = lazy(() => import("@/components/SolarPackagesSection"));
const SmartLocksSection = lazy(() => import("@/components/SmartLocksSection"));
const HomeAutomationSection = lazy(() => import("@/components/HomeAutomationSection"));

type CategoryKey = "solar" | "locks" | "automation";

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof Sun; desc: string; image: string }[] = [
  { key: "solar", label: "Solar Inverter Systems", icon: Sun, desc: "From 1KVA to 30KVA, pre-engineered for Nigerian load profiles.", image: catSolar },
  { key: "locks", label: "Smart Lock Series", icon: Lock, desc: "STAMA biometric home locks and full hotel access ecosystems.", image: catLocks },
  { key: "automation", label: "Home Automation", icon: HomeIcon, desc: "Three curated tiers: Apex, Aura and Riviera.", image: catAutomation },
];

const SectionLoader = () => (
  <div className="section-padding">
    <div className="section-container flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  </div>
);

const Packages = () => {
  const [active, setActive] = useState<CategoryKey | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Packages — Solar, Locks & Automation"
        description="Curated solar packages (1KVA to 30KVA), STAMA smart locks, and Apex/Aura/Riviera home automation bundles. Installable next week."
        path="/packages"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Tioga Packages",
          description: "Curated solar, smart lock and home automation bundles for Nigerian homes and businesses.",
          url: "https://tiogatechnologies.com/packages",
          about: ["Solar inverter systems", "STAMA smart locks", "Home automation bundles"],
        }}
      />
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
                  className={`group relative text-left rounded-3xl border overflow-hidden hover-lift transition-all duration-500 ${
                    isActive
                      ? "border-primary shadow-[var(--shadow-elevated)]"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.label}
                      loading="lazy"
                      width={1024}
                      height={400}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/40 to-midnight/10" />
                    <span className={`absolute top-4 left-4 grid h-11 w-11 place-items-center rounded-xl shadow ${isActive ? "bg-primary text-primary-foreground" : "bg-gold text-midnight"}`}>
                      <Icon size={18} />
                    </span>
                  </div>
                  <div className={`p-6 ${isActive ? "bg-primary/5" : "bg-card"}`}>
                    <h3 className="font-display font-bold text-lg text-foreground no-clip mb-2">{c.label}</h3>
                    <p className="text-sm text-muted-foreground">{c.desc}</p>
                    <span className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold ${isActive ? "text-primary" : "text-foreground/70 group-hover:text-primary"}`}>
                      {isActive ? "Showing below" : "Tap to view packages"} <ArrowRight size={14} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Suspense fallback={<SectionLoader />}>
        {active === "solar" && <SolarPackagesSection />}
        {active === "locks" && <SmartLocksSection />}
        {active === "automation" && <HomeAutomationSection />}
      </Suspense>

      <SiteFooter />
    </div>
  );
};

export default Packages;
