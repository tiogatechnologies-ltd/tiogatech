import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import {
  ArrowRight, Lock, Sun, Home as HomeIcon,
  Layers, ChevronDown, Flame, Tag, ShieldCheck, Clock, Wrench,
} from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { openLeadForm } from "@/components/SiteHeader";
import bgBundle from "@/assets/hero-smart-home.jpg";
import catSolar from "@/assets/bg-rooftop-install.jpg";
import catLocks from "@/assets/stock-smart-lock.png";
import catAutomation from "@/assets/bg-lagos-apartment.jpg";
import { breadcrumbJsonLd } from "@/lib/seoSchema";

import SolarPackagesSection from "@/components/SolarPackagesSection";
import SmartLocksSection from "@/components/SmartLocksSection";
import HomeAutomationSection from "@/components/HomeAutomationSection";

type CategoryKey = "all" | "solar" | "locks" | "automation";

const CATEGORIES: {
  key: "solar" | "locks" | "automation";
  label: string;
  shortLabel: string;
  icon: typeof Sun;
  desc: string;
  image: string;
  stat: string;
  statLabel: string;
  sectionId: string;
}[] = [
  {
    key: "solar",
    label: "Solar Inverter Systems",
    shortLabel: "Solar",
    icon: Sun,
    desc: "19 pre-engineered packages from 1KVA to 40KVA - sized for real Nigerian load profiles with lithium, tubular, and high-voltage options.",
    image: catSolar,
    stat: "19",
    statLabel: "Packages",
    sectionId: "solar-packages",
  },
  {
    key: "locks",
    label: "Smart Lock Series",
    shortLabel: "Smart Locks",
    icon: Lock,
    desc: "STAMA biometric home locks, Pro & Elite series, hotel access ecosystems, and accessories. All with fingerprint, PIN, card and app control.",
    image: catLocks,
    stat: "20",
    statLabel: "Products",
    sectionId: "smart-locks",
  },
  {
    key: "automation",
    label: "Home Automation",
    shortLabel: "Automation",
    icon: HomeIcon,
    desc: "Three curated tiers - Apex, Aura and Riviera - covering lighting, climate, entertainment and security in a single unified system.",
    image: catAutomation,
    stat: "3",
    statLabel: "Tiers",
    sectionId: "home-automation",
  },
];

const TABS: { key: CategoryKey; label: string; icon: any; count: string }[] = [
  { key: "all", label: "All Packages", icon: Layers, count: "42" },
  { key: "solar", label: "Solar Systems", icon: Sun, count: "19" },
  { key: "locks", label: "Smart Locks", icon: Lock, count: "20" },
  { key: "automation", label: "Home Automation", icon: HomeIcon, count: "3" },
];

const TRUST_STATS = [
  { icon: ShieldCheck, value: "5-yr", label: "Warranty" },
  { icon: Clock, value: "48h", label: "Installation" },
  { icon: Wrench, value: "100+", label: "Installs Done" },
  { icon: Flame, value: "17%", label: "Bundle Savings" },
];

const Packages = () => {
  const [active, setActive] = useState<CategoryKey>("all");
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToSection = (key: CategoryKey, attempts = 0) => {
    const id =
      key === "solar"
        ? "solar-packages"
        : key === "locks"
        ? "smart-locks"
        : key === "automation"
        ? "home-automation"
        : "all-packages";

    window.setTimeout(() => {
      const el = document.getElementById(id) ?? sectionRefs.current[key];
      if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (attempts < 8) scrollToSection(key, attempts + 1);
    }, attempts === 0 ? 80 : 200);
  };

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    const category = searchParams.get("category") as CategoryKey | null;
    const packageId = searchParams.get("id") || searchParams.get("package");

    let next: CategoryKey = "all";
    if (category && (category === "solar" || category === "locks" || category === "automation" || category === "all")) {
      next = category;
    } else if (hash === "smart-locks") {
      next = "locks";
    } else if (hash === "home-automation") {
      next = "automation";
    } else if (hash === "solar-packages" || packageId) {
      next = "solar";
    }

    setActive(next);
    if (next !== "all" || packageId) {
      scrollToSection(next);
      if (packageId) {
        window.setTimeout(
          () => document.getElementById(`pkg-${packageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
          400
        );
      }
    }
  }, [location.hash, searchParams]);

  const handleCategoryClick = (key: CategoryKey) => {
    const next = active === key ? "all" : key;
    setActive(next);
    scrollToSection(next);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="All Packages - Solar, Smart Locks & Home Automation | Tioga Technologies"
        description="Browse all Tioga packages: 19 solar inverter systems (1KVA–40KVA), 20 STAMA smart lock products, and 3 home automation tiers. Bundle pricing up to 17% off. Installation in 48 hours."
        path="/packages"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Packages", path: "/packages" }]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Tioga Technologies - All Packages",
            description: "Curated solar, smart lock and home automation bundles for Nigerian homes and businesses.",
            url: "https://tiogatechnologies.com/packages",
            about: ["Solar inverter systems", "STAMA smart locks", "Home automation bundles"],
          },
        ]}
      />
      <SiteHeader />

      {/* Hero */}
      <PageHero
        eyebrow="All Packages"
        title="Everything you need. One page."
        subtitle="Solar power systems, smart security locks, and intelligent home automation - all pre-engineered, bundled, and installable next week."
        backgroundImage={bgBundle}
        backgroundAlt="Tioga Technologies curated product bundles"
      >
        <button
          onClick={() => openLeadForm("packages_hero")}
          className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 backdrop-blur-xl border border-accent/60 border-t-white/50 px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(245,158,11,0.35)]"
        >
          Get AI Recommendation
        </button>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
        >
          Talk to an Expert <ArrowRight size={16} />
        </Link>
      </PageHero>

      {/* Trust stats bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="section-container py-3 sm:py-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          {TRUST_STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-primary-foreground/15 shrink-0">
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-lg font-display font-bold leading-none">{value}</p>
                <p className="text-[10px] sm:text-[11px] text-primary-foreground/80 leading-tight mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promo banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="section-container py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-semibold min-w-0">
            <Flame size={14} className="shrink-0 text-amber-700" />
            <span className="truncate">Mid-Month Deals - Up to 17% Off</span>
            <span className="text-xs opacity-80 hidden sm:inline">Pre-engineered systems priced below individual component retail.</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0 ml-auto sm:ml-0">
            <Tag size={12} />
            <span>Code:</span>
            <span className="font-mono bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">TIOGA2026</span>
          </div>
        </div>
      </div>

      {/* Sticky category tab bar */}
      <div className="sticky top-[60px] z-30 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="section-container">
          <div className="flex items-center gap-1.5 sm:gap-2 py-2 overflow-x-auto scrollbar-hide no-scrollbar snap-x snap-mandatory">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleCategoryClick(t.key)}
                  className={`snap-start inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                  {t.key !== "all" && (
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}
                    />
                  )}
                </button>
              );
            })}
            <div className="ml-auto shrink-0 hidden sm:block">
              <button
                onClick={() => openLeadForm("packages_tabs")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-accent text-accent-foreground hover:brightness-110 transition-all"
              >
                AI Pick
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category cards */}
      <section id="categories" className="section-padding bg-muted/30 scroll-mt-24">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">
              3 Categories · 42 Packages
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
              What are you shopping for?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Choose a category to filter, or browse the complete lineup below.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 sm:grid-cols-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = active === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => handleCategoryClick(c.key)}
                  className={`group relative text-left rounded-3xl border overflow-hidden hover-lift transition-all duration-500 ${
                    isActive
                      ? "border-primary shadow-[var(--shadow-elevated)] ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-36 sm:h-44 overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.label}
                      loading="lazy"
                      width={1024}
                      height={400}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Icon + count badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className={`grid h-10 w-10 place-items-center rounded-xl shadow ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-gold text-midnight"
                      }`}>
                        <Icon size={18} />
                      </span>
                      <span className="text-[10px] font-bold bg-midnight/70 backdrop-blur-xl backdrop-saturate-150 border border-white/20 border-t-white/40 text-white px-2.5 py-1 rounded-full shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.2)]">
                        {c.stat} {c.statLabel}
                      </span>
                    </div>

                    {isActive && (
                      <div className="absolute top-4 right-4">
                        <span className="text-[10px] font-bold bg-primary/90 backdrop-blur-xl backdrop-saturate-150 border border-white/25 border-t-white/40 text-primary-foreground px-2.5 py-1 rounded-full shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
                          ▼ Filtered
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className={`p-4 sm:p-5 ${isActive ? "bg-primary/5" : "bg-card"}`}>
                    <h3 className="font-display font-bold text-lg text-foreground no-clip mb-1.5">{c.label}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{c.desc}</p>
                    <span className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${
                      isActive ? "text-primary" : "text-foreground/70 group-hover:text-primary"
                    }`}>
                      {isActive ? "Filtered to this category · Tap to show all" : "View category packages"} <ArrowRight size={14} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Package sections */}
      <div id="all-packages">
        {(active === "all" || active === "solar") && (
          <div ref={(el) => { sectionRefs.current["solar"] = el; }}>
            <SolarPackagesSection />
          </div>
        )}
        {(active === "all" || active === "locks") && (
          <div ref={(el) => { sectionRefs.current["locks"] = el; }}>
            <SmartLocksSection />
          </div>
        )}
        {(active === "all" || active === "automation") && (
          <div ref={(el) => { sectionRefs.current["automation"] = el; }}>
            <HomeAutomationSection />
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <section className="section-padding">
        <div className="section-container">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-[var(--shadow-card)]">
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-3 no-clip">
              Not sure which package fits?
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Answer 3 quick questions and our LumiVolt AI will recommend the perfect solar, security or automation bundle for your space and budget.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => openLeadForm("packages_bottom_cta")}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
              >
                Get AI Recommendation
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-all"
              >
                Talk to an Expert <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Packages;
