import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Loader2, Sparkles } from "lucide-react";
import { useSolarPackages } from "@/hooks/useSolarPackages";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import { useLandingContent } from "@/hooks/useLandingContent";
import { openLeadForm } from "@/components/SiteHeader";
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

const SolarPackagesSection = () => {
  const { packages, loading } = useSolarPackages();
  const { settings: promos } = useSiteSetting("promotions");
  const { content: flashDeal } = useLandingContent("flash_deal");
  const [searchParams, setSearchParams] = useSearchParams();

  const endsAt = resolveCampaignEndsAt((flashDeal as any)?.ends_at);
  const countdown = useSharedCountdown(endsAt);

  // URL-synced filter state (defaults to Lithium when no battery filter or other filter is set)
  const filterState: PackageFilterState = useMemo(() => {
    const parsed = readPackageFilters(searchParams);
    return parsed;
  }, [searchParams]);

  const updateFilters = (next: PackageFilterState) => {
    const serialized = writePackageFilters(next, searchParams);
    setSearchParams(serialized, { replace: true });
  };

  // Support deep-linking ?id=... or ?package=...
  useEffect(() => {
    const target = searchParams.get("id") || searchParams.get("package");
    if (!target || !packages.length) return;
    const found = packages.find(
      (p) =>
        String(p.package_number) === target ||
        p.id === target ||
        `pkg-${p.package_number}` === target,
    );
    if (found) {
      window.setTimeout(
        () =>
          document
            .getElementById(`pkg-${found.package_number}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        120,
      );
    }
  }, [packages, searchParams]);

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

  // Active single-battery quick tab helper
  const activeQuickBattery: "all" | BatteryTypeFilter =
    filterState.batteryTypes.length === 1 ? filterState.batteryTypes[0] : "all";
  const activeQuickTier: "all" | TierFilter =
    filterState.tiers.length === 1 ? filterState.tiers[0] : "all";

  const selectBatteryTab = (key: "all" | BatteryTypeFilter) => {
    updateFilters({
      ...filterState,
      batteryTypes: key === "all" ? [] : [key],
      tiers: key === "lithium" ? filterState.tiers : [],
    });
  };

  const selectTierTab = (tier: "all" | TierFilter) => {
    updateFilters({
      ...filterState,
      batteryTypes: ["lithium"],
      tiers: tier === "all" ? [] : [tier],
    });
  };

  if (loading) {
    return (
      <section id="solar-packages" data-no-reveal className="section-padding bg-muted/30 scroll-mt-24">
        <div className="section-container flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (packages.length === 0) return null;

  const showBfCountdown =
    countdown.active &&
    promos?.show_black_friday_badges !== false &&
    !(flashDeal && (flashDeal as any).is_active === false);

  return (
    <section id="solar-packages" data-no-reveal className="section-padding bg-muted/30 scroll-mt-32">
      <div className="section-container">
        <div className="text-center mb-7">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-2">
            Solar Inverter Systems
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
            Pre-engineered solar packages
          </h2>
          <p className="mt-2.5 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            From 1KVA homes to 40KVA commercial systems. Every package shows exactly what appliances it powers, night backup hours, and transparent equipment pricing.
          </p>

          {/* Compact Honest Black Friday Countdown Strip (WS5) */}
          {showBfCountdown && (
            <div
              role="timer"
              aria-live="off"
              className="mt-4 inline-flex flex-wrap items-center justify-center gap-2.5 px-3.5 py-2 rounded-md border border-primary/25 bg-card text-xs shadow-xs"
            >
              <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-primary">
                <Clock size={13} />
                Black Friday Package Deals end in:
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

        {/* Quick Battery Type & Lithium Tier Tabs (squared rounded-md, NO pills) */}
        <div className="mb-4 flex flex-col items-stretch sm:items-center gap-2">
          <div className="w-full overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center sm:justify-center gap-1.5 sm:gap-2 min-w-max">
              {(
                [
                  { key: "all", label: `All Solar (${counts.all})` },
                  { key: "lithium", label: `Lithium (LiFePO4) (${counts.lithium})` },
                  { key: "tubular", label: `Tubular / Gel (${counts.tubular})` },
                  { key: "high_voltage", label: `High Voltage (40KVA+) (${counts.high_voltage})` },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => selectBatteryTab(item.key)}
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
            <div className="w-full overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center sm:justify-center gap-1.5 sm:gap-2 min-w-max">
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
                    onClick={() => selectTierTab(t.key)}
                    className={`px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-md border transition-all shrink-0 ${
                      activeQuickTier === t.key
                        ? "bg-foreground text-background border-foreground shadow-xs"
                        : "bg-card/80 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WS4: Energystack-inspired Filter Toolbar + Slide-over Filter Drawer */}
        <PackageFilterBar
          allPackages={packages}
          resultCount={filtered.length}
          state={filterState}
          onChange={updateFilters}
        />

        {/* Results Grid OR Empty State with 3 Closest Fallback */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4">
            {filtered.map((p) => (
              <SolarPackageCard key={p.id} pkg={p} trackingSource="solar_package" />
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
                  onClick={() => openLeadForm("packages_no_match_ai")}
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
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {closestFallback.map((p) => (
                    <SolarPackageCard key={p.id} pkg={p} trackingSource="solar_package_closest" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SolarPackagesSection;
