import { useEffect, useRef, useState } from "react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import {
  ArrowRight,
  Lock,
  Sun,
  Home as HomeIcon,
  Layers,
  ShieldCheck,
  Clock,
  Wrench,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import bgBundle from "@/assets/hero-smart-home.jpg";
import { breadcrumbJsonLd } from "@/lib/seoSchema";

import SolarPackagesSection from "@/components/SolarPackagesSection";
import SmartLocksSection from "@/components/SmartLocksSection";
import HomeAutomationSection from "@/components/HomeAutomationSection";

type CategoryKey = "all" | "solar" | "locks" | "automation";

const CATEGORIES: {
  key: "solar" | "locks" | "automation";
  eyebrow: string;
  label: string;
  shortLabel: string;
  icon: typeof Sun;
  desc: string;
  highlights: string[];
  image: string;
  stat: string;
  statLabel: string;
  sectionId: string;
}[] = [
  {
    key: "solar",
    eyebrow: "SRNE · ITEL · SUNGENE · DEYE",
    label: "Solar Inverter Systems",
    shortLabel: "Solar",
    icon: Sun,
    desc: "23 pre-engineered packages from 1.5kW to 40kVA · including 12 matched SRNE & itel Lithium systems (Essential, Core & Pro), tubular, and high-voltage options.",
    highlights: ["12 Lithium Packages (Essential, Core, Pro)", "8 Tubular & 3 High-Voltage Systems", "Up to 25-Yr Panel & 5-Yr Battery Warranty"],
    image: "/products/packages/lithium-c4.webp",
    stat: "23",
    statLabel: "Packages",
    sectionId: "solar-packages",
  },
  {
    key: "locks",
    eyebrow: "3D FACE ID · BIOMETRIC · HOTEL",
    label: "Smart Lock Series",
    shortLabel: "Smart Locks",
    icon: Lock,
    desc: "Biometric home & office locks across Base, Pro, Apex and Elite series, plus centralized hotel access ecosystems and accessories.",
    highlights: ["3D Face Recognition & Video Intercom", "Fingerprint, PIN, RFID & Mobile App", "Free Installation for Smart Lock Products"],
    image: "/products/categories/cat-smart-locks.png",
    stat: "20",
    statLabel: "Products",
    sectionId: "smart-locks",
  },
  {
    key: "automation",
    eyebrow: "APEX · AURA · RIVIERA ECOSYSTEMS",
    label: "Home Automation",
    shortLabel: "Automation",
    icon: HomeIcon,
    desc: "Three curated whole-home tiers · Apex, Aura and Riviera · integrating smart touch panels, lighting, motorized curtains, climate and perimeter CCTV.",
    highlights: ["In-Wall Multi-Touch Control Panels", "Motorized Curtains & Scene Lighting", "Voice, App & Local Zigbee Automation"],
    image: "/products/core/pkg-automation-aura.webp",
    stat: "3",
    statLabel: "Tiers",
    sectionId: "home-automation",
  },
];

const TABS: { key: CategoryKey; label: string; icon: any; count: string }[] = [
  { key: "all", label: "All Packages", icon: Layers, count: "46" },
  { key: "solar", label: "Solar Systems", icon: Sun, count: "23" },
  { key: "locks", label: "Smart Locks", icon: Lock, count: "20" },
  { key: "automation", label: "Home Automation", icon: HomeIcon, count: "3" },
];

const TRUST_STATS = [
  { icon: ShieldCheck, value: "Up to 5-Yr", label: "Hardware Warranty" },
  { icon: Clock, value: "48–72h", label: "Engineer Dispatch" },
  { icon: Wrench, value: "100% Matched", label: "Same-Brand Stack" },
  { icon: CheckCircle2, value: "Nationwide", label: "Survey & Installation" },
];

const Packages = () => {
  const [active, setActive] = useState<CategoryKey>("all");
  const [showFloatingFilter, setShowFloatingFilter] = useState(true);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Hide the top sticky filter bar when scrolling down; show it immediately when scrolling back up
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY < 260) {
        setShowFloatingFilter(true);
      } else if (delta > 10) {
        setShowFloatingFilter(false);
      } else if (delta < -8) {
        setShowFloatingFilter(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (key: CategoryKey, attempts = 0) => {
    const id =
      key === "solar"
        ? "solar-packages"
        : key === "locks"
        ? "smart-locks"
        : key === "automation"
        ? "home-automation"
        : "categories";

    window.setTimeout(() => {
      const el = document.getElementById(id) ?? sectionRefs.current[key];
      if (el) {
        const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 116;
        window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
        return;
      }
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
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="All Packages - Solar, Smart Locks & Home Automation | Tioga Technologies"
        description="Browse all Tioga packages: 23 solar inverter systems (Essential, Core & Pro Lithium, Tubular, and High-Voltage), 20 smart lock products, and 3 home automation tiers."
        path="/packages"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Packages", path: "/packages" }]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Tioga Technologies - All Packages",
            description: "Curated solar, smart lock and home automation bundles for Nigerian homes and businesses.",
            url: "https://www.tiogatechnologies.com/packages",
            about: ["Solar inverter systems", "Smart locks", "Home automation bundles"],
          },
        ]}
      />
      <SiteHeader />

      {/* Hero */}
      <PageHero
        eyebrow="Engineered Turnkey Bundles"
        title="Everything you need. Pre-engineered."
        subtitle="Matched solar power systems, biometric smart locks, and whole-home automation packages · built from real hardware with transparent component pricing."
        backgroundImage={bgBundle}
        backgroundAlt="Tioga Technologies curated product bundles"
      >
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <button
            onClick={() => openLeadForm("packages_hero")}
            className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 backdrop-blur-xl border border-accent/60 border-t-white/50 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(245,158,11,0.35)]"
          >
            <Sparkles size={15} /> Get AI Recommendation
          </button>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
          >
            Talk to an Engineer <ArrowRight size={15} />
          </Link>
        </div>
      </PageHero>

      {/* Clean Value Props Strip */}
      <div className="border-b border-border bg-card">
        <div className="section-container py-3 sm:py-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {TRUST_STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Icon size={16} className="sm:w-[19px] sm:h-[19px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-base font-display font-bold text-foreground leading-tight truncate">{value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5 truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Auto-Hiding Sticky Category Filter Bar (hides on scroll down, reappears on scroll up) */}
      <div
        className={`sticky top-[62px] sm:top-[84px] z-30 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm transition-all duration-300 ${
          showFloatingFilter
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="section-container">
          <div className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-3 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleCategoryClick(t.key)}
                  className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 border transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={13} className="shrink-0" />
                  <span>{t.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
            <div className="ml-auto shrink-0 pl-1">
              <button
                onClick={() => openLeadForm("packages_tabs")}
                className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold bg-accent text-accent-foreground hover:brightness-110 transition-all shadow-sm"
              >
                <Sparkles size={12} /> AI Pick
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Package Lines Showcase */}
      <section id="categories" className="section-padding bg-background scroll-mt-24">
        <div className="section-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
                Explore Engineered Package Lines
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-muted-foreground max-w-2xl">
                Select a package line below to filter directly to Solar Inverter Systems, Biometric Smart Locks, or Whole-Home Automation Tiers.
              </p>
            </div>
            {active !== "all" && (
              <button
                type="button"
                onClick={() => setActive("all")}
                className="self-start md:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all"
              >
                Show All Packages
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = active === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => handleCategoryClick(c.key)}
                  className={`group relative text-left rounded-2xl sm:rounded-3xl border bg-card overflow-hidden flex flex-col transition-all duration-300 ${
                    isActive
                      ? "border-primary shadow-xl ring-2 ring-primary/25"
                      : "border-border shadow-[var(--shadow-card)] hover:shadow-xl hover:border-primary/40"
                  }`}
                >
                  {/* Real Product Composite Studio Visual */}
                  <div className="relative aspect-[16/9] sm:aspect-[16/10] w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 border-b border-border/60 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.label}
                      loading="lazy"
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-sm"
                    />

                    {/* Top-left Icon + Count Pill */}
                    <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 flex items-center gap-1.5 sm:gap-2">
                      <span
                        className={`grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl shadow-sm transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "bg-zinc-900 text-white"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-extrabold bg-zinc-900/90 text-white px-2.5 sm:px-3 py-1 rounded-full shadow-sm">
                        {c.stat} {c.statLabel}
                      </span>
                    </div>

                    {isActive && (
                      <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 sm:px-3 py-1 rounded-full shadow-sm">
                          Active Filter
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-6 flex flex-col flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary mb-1">
                      {c.eyebrow}
                    </p>
                    <h3 className="font-display font-bold text-base sm:text-xl text-foreground group-hover:text-primary transition-colors mb-1.5 sm:mb-2">
                      {c.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3.5 sm:mb-4">
                      {c.desc}
                    </p>

                    <div className="space-y-1.5 mb-4 sm:mb-5">
                      {c.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-2 text-xs text-foreground/85 font-medium">
                          <CheckCircle2 size={13} className="text-primary shrink-0" />
                          <span className="truncate">{h}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                        }`}
                      >
                        {isActive ? "Showing this category · Tap to show all" : `Browse ${c.stat} ${c.statLabel}`}
                      </span>
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        <ArrowRight size={14} />
                      </span>
                    </div>
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
              Not sure which package fits your load or floor plan?
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Answer 3 quick questions and our Lumi AI or engineering team will size the right solar, smart lock, or automation package for your home or business.
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
