import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calculator, Clock, Sparkles } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useSolarPackages } from "@/hooks/useSolarPackages";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import { useLandingContent } from "@/hooks/useLandingContent";
import { SolarPackageCard } from "@/components/packages/SolarPackageCard";
import { PackageFilterBar } from "@/components/packages/PackageFilterBar";
import {
  EMPTY_PACKAGE_FILTERS,
  filterPackages,
  findClosestPackages,
  readPackageFilters,
  writePackageFilters,
  type BatteryTypeFilter,
  type PackageFilterState,
  type TierFilter,
} from "@/lib/packageFilters";
import { resolveCampaignEndsAt, useSharedCountdown } from "@/lib/countdownTicker";
import bgResidential from "@/assets/bg-lumivolt-residential.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";

export const SolarPackages = () => {
  const { packages, loading } = useSolarPackages();
  const { settings: promos } = useSiteSetting("promotions");
  const { content: flashDeal } = useLandingContent("flash_deal");
  const [searchParams, setSearchParams] = useSearchParams();

  const endsAt = resolveCampaignEndsAt((flashDeal as any)?.ends_at);
  const countdown = useSharedCountdown(endsAt);

  const filterState: PackageFilterState = useMemo(
    () => readPackageFilters(searchParams),
    [searchParams],
  );

  const updateFilters = (next: PackageFilterState) => {
    setSearchParams(writePackageFilters(next, searchParams), { replace: true });
  };

  const counts = useMemo(() => {
    const lith = packages.filter((p) => p.battery_type === "lithium");
    return {
      all: packages.length,
      lithium: lith.length,
      tubular: packages.filter((p) => p.battery_type === "tubular").length,
      high_voltage: packages.filter((p) => p.battery_type === "high_voltage").length,
      Essential: lith.filter((p) => p.tier === "Essential").length,
      Core: lith.filter((p) => p.tier === "Core").length,
      Pro: lith.filter((p) => p.tier === "Pro").length,
    };
  }, [packages]);

  const filtered = useMemo(
    () => filterPackages(packages, filterState),
    [packages, filterState],
  );

  const closestFallback = useMemo(
    () => (filtered.length === 0 ? findClosestPackages(packages, filterState, 3) : []),
    [filtered.length, packages, filterState],
  );

  const activeQuickBattery: "all" | BatteryTypeFilter =
    filterState.batteryTypes.length === 1 ? filterState.batteryTypes[0] : "all";
  const activeQuickTier: "all" | TierFilter =
    filterState.tiers.length === 1 ? filterState.tiers[0] : "all";

  const showBfCountdown =
    countdown.active &&
    promos?.show_black_friday_badges !== false &&
    !(flashDeal && (flashDeal as any).is_active === false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Turnkey Solar Power Packages Nigeria - 3kVA, 5kVA, 10kVA Hybrid Systems"
        description="Browse certified turnkey solar packages featuring SRNE, itel & Deye hybrid inverters, LiFePO4 lithium batteries, and Tier-1 panels with 5-year warranty."
        path="/solar-packages"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Solar Packages", path: "/solar-packages" }]),
          serviceJsonLd({
            name: "Tioga Turnkey Solar Power System Installation",
            description:
              "Turnkey hybrid inverter and lithium battery installations for Nigerian homes and commercial offices.",
            path: "/solar-packages",
            serviceType: "Solar system installation and integration",
          }),
        ]}
      />
      <SiteHeader />

      <PageHero
        eyebrow="Turnkey Energy Infrastructure · Lumi"
        title="Guaranteed 24/7 Clean Solar Energy Systems"
        subtitle="Pre-engineered hybrid inverters, high-cycle lithium iron phosphate batteries, and Tier-1 solar panels designed to power your essential appliances with zero flicker."
        backgroundImage={bgResidential}
        backgroundAlt="Modern Nigerian home powered by rooftop solar inverters and battery backup"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/energy-calculator"
            className="inline-flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md"
          >
            <Calculator size={16} /> Free Load Sizing Calculator
          </Link>
          <button
            type="button"
            onClick={() => openLeadForm("solar_packages_hero")}
            className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/[0.1] hover:bg-white/[0.18] backdrop-blur-md px-6 py-3 text-sm font-medium text-white transition-all"
          >
            Request Custom Engineering
          </button>
        </div>
      </PageHero>

      <main className="flex-1 section-padding py-12">
        <div className="section-container">
          <div className="flex flex-col gap-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-2">
                  Engineered Packages
                </p>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
                  Turnkey Solar Configurations
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-xl">
                  Every package shows the exact appliances it can power, inverter load capacity, and overnight battery backup.
                </p>
              </div>

              {showBfCountdown && (
                <div
                  role="timer"
                  aria-live="off"
                  className="inline-flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-md border border-primary/25 bg-card text-xs shadow-xs self-start md:self-auto"
                >
                  <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-primary">
                    <Clock size={13} />
                    Black Friday ends in:
                  </span>
                  <span className="font-mono font-bold text-foreground tabular-nums">
                    {String(countdown.d).padStart(2, "0")}d : {String(countdown.h).padStart(2, "0")}h :{" "}
                    {String(countdown.m).padStart(2, "0")}m :{" "}
                    <span className="text-red-600 dark:text-red-400">
                      {String(countdown.s).padStart(2, "0")}s
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Battery & Tier Quick Tabs (squared rounded-md, NO pills) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/70">
              <div className="w-full overflow-x-auto pb-0.5 scrollbar-none">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
                  {(
                    [
                      { key: "all", label: `All Solar Packages (${counts.all})` },
                      { key: "lithium", label: `Lithium (LiFePO4) (${counts.lithium})` },
                      { key: "tubular", label: `Tubular / Gel (${counts.tubular})` },
                      { key: "high_voltage", label: `High Voltage (40KVA+) (${counts.high_voltage})` },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        updateFilters({
                          ...filterState,
                          batteryTypes: item.key === "all" ? [] : [item.key],
                          tiers: item.key === "lithium" ? filterState.tiers : [],
                        })
                      }
                      className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-md border transition-all shrink-0 ${
                        activeQuickBattery === item.key
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeQuickBattery === "lithium" && (
                <div className="w-full overflow-x-auto pb-0.5 scrollbar-none pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1 hidden sm:inline">
                      Lithium Tier:
                    </span>
                    {(
                      [
                        { key: "all", label: `All Lithium (${counts.lithium})` },
                        { key: "Essential", label: `Essential · 1.5–3kW (${counts.Essential})` },
                        { key: "Core", label: `Core · 4–8kW (${counts.Core})` },
                        { key: "Pro", label: `Pro · 12–24kW & 3-Phase (${counts.Pro})` },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() =>
                          updateFilters({
                            ...filterState,
                            batteryTypes: ["lithium"],
                            tiers: t.key === "all" ? [] : [t.key],
                          })
                        }
                        className={`px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-md border transition-all shrink-0 ${
                          activeQuickTier === t.key
                            ? "bg-foreground text-background border-foreground shadow-xs"
                            : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <PackageFilterBar
            allPackages={packages}
            resultCount={filtered.length}
            state={filterState}
            onChange={updateFilters}
          />

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Loading packages…
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((pkg) => (
                <SolarPackageCard key={pkg.id} pkg={pkg} trackingSource="solar_packages_page" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
                <h3 className="text-lg font-display font-bold text-foreground mb-1.5">
                  No exact match for that filter combination
                </h3>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
                  Here are the 3 closest solar packages to your criteria, or let our engineers size a custom system for free.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => updateFilters({ ...EMPTY_PACKAGE_FILTERS })}
                    className="px-4 py-2 rounded-md border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                  >
                    Clear All Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => openLeadForm("solar_packages_no_match_ai")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-accent-foreground text-xs font-bold hover:brightness-105 transition-all"
                  >
                    <Sparkles size={13} />
                    <span>Get AI Recommendation</span>
                  </button>
                </div>
              </div>

              {closestFallback.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-3">
                    3 Closest Packages
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {closestFallback.map((pkg) => (
                      <SolarPackageCard
                        key={pkg.id}
                        pkg={pkg}
                        trackingSource="solar_packages_closest"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SolarPackages;
