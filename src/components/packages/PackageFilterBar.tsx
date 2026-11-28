import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";
import type { SolarPackage } from "@/hooks/useSolarPackages";
import {
  BUDGET_PRESETS,
  CAPACITY_BUCKET_OPTIONS,
  EMPTY_PACKAGE_FILTERS,
  MUST_POWER_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  countActivePackageFilters,
  inferPackageBrand,
  type BatteryTypeFilter,
  type CapacityBucket,
  type PackageFilterState,
  type PackageSortOption,
  type PropertyTypeFilter,
  type TierFilter,
} from "@/lib/packageFilters";
import type { HeavyLoadKey } from "@/lib/packageAppliances";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";

interface PackageFilterBarProps {
  allPackages: SolarPackage[];
  resultCount: number;
  state: PackageFilterState;
  onChange: (next: PackageFilterState) => void;
}

const fmtShortNaira = (n: number) => {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₦${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
};

const SORT_LABELS: Record<PackageSortOption, string> = {
  recommended: "Recommended",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "capacity-asc": "Capacity ↑",
};

/**
 * WS4 - Energystack-inspired Package Filter Toolbar + Slide-over Filter Drawer.
 * - Desktop: right-side Sheet panel.
 * - Mobile: bottom Drawer sheet.
 * - Strict house rule: squared `rounded-md` buttons and labels (zero pill badges).
 */
export const PackageFilterBar = ({
  allPackages,
  resultCount,
  state,
  onChange,
}: PackageFilterBarProps) => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [budgetPopoverOpen, setBudgetPopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);

  const activeCount = countActivePackageFilters(state);

  const facets = useMemo(() => {
    const brandMap = new Map<string, number>();
    const batteryCounts: Record<BatteryTypeFilter, number> = {
      lithium: 0,
      tubular: 0,
      high_voltage: 0,
    };
    const tierCounts: Record<TierFilter, number> = {
      Essential: 0,
      Core: 0,
      Pro: 0,
    };
    let minP = Infinity;
    let maxP = 0;

    for (const p of allPackages) {
      const brand = inferPackageBrand(p);
      brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
      batteryCounts[p.battery_type] = (batteryCounts[p.battery_type] || 0) + 1;
      if (p.tier) tierCounts[p.tier] = (tierCounts[p.tier] || 0) + 1;
      if (p.total_price > 0) {
        if (p.total_price < minP) minP = p.total_price;
        if (p.total_price > maxP) maxP = p.total_price;
      }
    }

    const brands = Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const sliderMin = Number.isFinite(minP) ? Math.floor(minP / 100_000) * 100_000 : 0;
    const sliderMax = maxP > 0 ? Math.ceil(maxP / 500_000) * 500_000 : 25_000_000;

    return { brands, batteryCounts, tierCounts, sliderMin, sliderMax };
  }, [allPackages]);

  const toggleItem = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const resetAll = () => onChange({ ...EMPTY_PACKAGE_FILTERS });

  const budgetButtonLabel = useMemo(() => {
    if (state.minPrice == null && state.maxPrice == null) return "Budget";
    const preset = BUDGET_PRESETS.find(
      (p) => p.min === state.minPrice && p.max === state.maxPrice,
    );
    if (preset) return `Budget: ${preset.label}`;
    const minStr = state.minPrice != null ? fmtShortNaira(state.minPrice) : "₦0";
    const maxStr = state.maxPrice != null ? fmtShortNaira(state.maxPrice) : "Any";
    return `Range: ${minStr} – ${maxStr}`;
  }, [state.minPrice, state.maxPrice]);

  const brandButtonLabel =
    state.brands.length === 0
      ? "Brand"
      : state.brands.length === 1
        ? `Brand: ${state.brands[0]}`
        : `Brand (${state.brands.length})`;

  const sliderValues: [number, number] = [
    state.minPrice ?? facets.sliderMin,
    state.maxPrice ?? facets.sliderMax,
  ];

  const visibleBrands = showAllBrands ? facets.brands : facets.brands.slice(0, 4);

  const filterPanelBody = (
    <div className="flex flex-col h-full">
      {/* Header matching Energystack reference */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="inline-flex items-center gap-1.5 text-sm font-display font-bold text-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Filter</span>
        </button>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </span>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="text-xs font-bold text-primary hover:underline"
        >
          Done
        </button>
      </div>

      {/* Scrollable Filter Sections */}
      <div data-lenis-prevent className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Price Range Slider + Presets */}
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-3">
            Price Range
          </p>
          <div className="flex items-center justify-between text-xs font-bold text-foreground tabular-nums mb-3">
            <span>{fmtShortNaira(sliderValues[0])}</span>
            <span>{sliderValues[1] >= facets.sliderMax ? `${fmtShortNaira(facets.sliderMax)}+` : fmtShortNaira(sliderValues[1])}</span>
          </div>
          <Slider
            min={facets.sliderMin}
            max={facets.sliderMax}
            step={100_000}
            value={sliderValues}
            onValueChange={(val) => {
              const [lo, hi] = val;
              onChange({
                ...state,
                minPrice: lo <= facets.sliderMin ? null : lo,
                maxPrice: hi >= facets.sliderMax ? null : hi,
              });
            }}
            className="mb-3"
          />
          <div className="flex flex-wrap gap-1.5">
            {BUDGET_PRESETS.map((preset) => {
              const selected = state.minPrice === preset.min && state.maxPrice === preset.max;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      minPrice: selected ? null : preset.min,
                      maxPrice: selected ? null : preset.max,
                    })
                  }
                  className={`px-2.5 py-1.5 rounded-md border text-[11px] font-semibold transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Battery Type */}
        <div className="pt-4 border-t border-border/70">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
            Battery Type
          </p>
          <div className="space-y-2">
            {(
              [
                { key: "lithium", label: "Lithium (LiFePO4)" },
                { key: "tubular", label: "Tubular / Gel" },
                { key: "high_voltage", label: "High Voltage (40KVA+)" },
              ] as Array<{ key: BatteryTypeFilter; label: string }>
            ).map((opt) => {
              const checked = state.batteryTypes.includes(opt.key);
              return (
                <label
                  key={opt.key}
                  className="flex items-center justify-between gap-2 cursor-pointer text-sm text-foreground hover:text-primary"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onChange({
                          ...state,
                          batteryTypes: toggleItem(state.batteryTypes, opt.key),
                        })
                      }
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {facets.batteryCounts[opt.key] || 0}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Tier */}
        <div className="pt-4 border-t border-border/70">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
            Package Tier
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["Essential", "Core", "Pro"] as TierFilter[]).map((tier) => {
              const active = state.tiers.includes(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() =>
                    onChange({ ...state, tiers: toggleItem(state.tiers, tier) })
                  }
                  className={`px-2.5 py-2 rounded-md border text-xs font-semibold text-center transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted/60"
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand */}
        <div className="pt-4 border-t border-border/70">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
            Brands
          </p>
          <div className="space-y-2">
            {visibleBrands.map((b) => {
              const checked = state.brands.includes(b.name);
              return (
                <label
                  key={b.name}
                  className="flex items-center justify-between gap-2 cursor-pointer text-foreground hover:text-primary"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onChange({ ...state, brands: toggleItem(state.brands, b.name) })
                      }
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-xs font-medium">{b.name}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {b.count}
                  </span>
                </label>
              );
            })}
          </div>
          {facets.brands.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllBrands((v) => !v)}
              className="mt-2.5 text-xs font-semibold text-primary hover:underline"
            >
              {showAllBrands ? "Show fewer brands" : `+ ${facets.brands.length - 4} more`}
            </button>
          )}
        </div>

        {/* Capacity */}
        <div className="pt-4 border-t border-border/70">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
            Inverter Capacity
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CAPACITY_BUCKET_OPTIONS.map((opt) => {
              const active = state.capacityBuckets.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      capacityBuckets: toggleItem<CapacityBucket>(state.capacityBuckets, opt.key),
                    })
                  }
                  className={`px-3 py-2 rounded-md border text-xs font-semibold text-left transition-colors flex items-center justify-between ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span>{opt.label}</span>
                  {active && <Check size={13} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Must Be Able To Power (WS3 + WS4 integration) */}
        <div className="pt-4 border-t border-border/70">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
            Must Be Able to Power
          </p>
          <p className="text-[11px] text-muted-foreground mb-2.5">
            Only show systems sized safely for these appliances.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MUST_POWER_OPTIONS.map((opt) => {
              const active = state.mustPower.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      mustPower: toggleItem<HeavyLoadKey>(state.mustPower, opt.key),
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted/60"
                  }`}
                >
                  {active && <Check size={12} />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Property Type */}
        <div className="pt-4 border-t border-border/70">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
            Property Type
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_TYPE_OPTIONS.map((opt) => {
              const active = state.propertyTypes.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      propertyTypes: toggleItem<PropertyTypeFilter>(state.propertyTypes, opt.key),
                    })
                  }
                  className={`px-3 py-2 rounded-md border text-xs font-semibold text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted/60"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: Reset + Show N packages */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-t border-border bg-card shrink-0">
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="flex-1 py-2.5 px-4 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all"
        >
          Show {resultCount} {resultCount === 1 ? "package" : "packages"}
        </button>
      </div>
    </div>
  );

  return (
    <div
      data-testid="package-filter-bar"
      className="mb-6 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs space-y-3"
    >
      {/* Row 1: Count on left, Search input on right (Energystack reference) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground tabular-nums">
          {resultCount === 0
            ? `Showing 0 of ${allPackages.length} packages`
            : `Showing 1 – ${resultCount} of ${allPackages.length} packages`}
        </p>

        <div className="relative w-full sm:w-72 md:w-80">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="search"
            value={state.search}
            onChange={(e) => onChange({ ...state, search: e.target.value })}
            placeholder="Search capacity, e.g. 3kVA, 5kW, SRNE"
            aria-label="Search solar packages"
            className="w-full h-9 pl-9 pr-8 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {state.search && (
            <button
              type="button"
              onClick={() => onChange({ ...state, search: "" })}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Squared outlined filter buttons [Filter] [Brand ▾] [Budget ▾] [Sort ▾] + Reset */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Main Filter Trigger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          data-testid="package-filter-drawer-trigger"
          className={`relative inline-flex items-center gap-2 h-9 px-3 rounded-md border text-xs font-semibold transition-colors ${
            activeCount > 0
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-foreground hover:bg-muted/60"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm bg-primary text-primary-foreground text-[10px] font-bold tabular-nums">
              {activeCount}
            </span>
          )}
        </button>

        {/* Brand Dropdown */}
        <Popover open={brandPopoverOpen} onOpenChange={setBrandPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-semibold transition-colors ${
                state.brands.length > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted/60"
              }`}
            >
              <span>{brandButtonLabel}</span>
              <ChevronDown size={13} className="opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-3 rounded-lg">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
              Filter by Brand
            </p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {facets.brands.map((b) => {
                const checked = state.brands.includes(b.name);
                return (
                  <label
                    key={b.name}
                    className="flex items-center justify-between gap-2 py-1 px-1.5 rounded-md hover:bg-muted/60 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onChange({ ...state, brands: toggleItem(state.brands, b.name) })
                        }
                        className="h-3.5 w-3.5 rounded border-border accent-primary"
                      />
                      <span className="text-xs font-medium text-foreground">{b.name}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {b.count}
                    </span>
                  </label>
                );
              })}
            </div>
            {state.brands.length > 0 && (
              <button
                type="button"
                onClick={() => onChange({ ...state, brands: [] })}
                className="mt-2 pt-2 border-t border-border w-full text-left text-[11px] font-semibold text-primary hover:underline"
              >
                Clear brand filter
              </button>
            )}
          </PopoverContent>
        </Popover>

        {/* Budget Dropdown */}
        <Popover open={budgetPopoverOpen} onOpenChange={setBudgetPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-semibold transition-colors ${
                state.minPrice != null || state.maxPrice != null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted/60"
              }`}
            >
              <span>{budgetButtonLabel}</span>
              <ChevronDown size={13} className="opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3 rounded-lg">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
              Budget Range
            </p>
            <div className="grid grid-cols-1 gap-1">
              {BUDGET_PRESETS.map((preset) => {
                const active = state.minPrice === preset.min && state.maxPrice === preset.max;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        ...state,
                        minPrice: active ? null : preset.min,
                        maxPrice: active ? null : preset.max,
                      });
                      setBudgetPopoverOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {active && <Check size={13} />}
                  </button>
                );
              })}
            </div>
            {(state.minPrice != null || state.maxPrice != null) && (
              <button
                type="button"
                onClick={() => {
                  onChange({ ...state, minPrice: null, maxPrice: null });
                  setBudgetPopoverOpen(false);
                }}
                className="mt-2 pt-2 border-t border-border w-full text-left text-[11px] font-semibold text-primary hover:underline"
              >
                Any budget
              </button>
            )}
          </PopoverContent>
        </Popover>

        {/* Sort Dropdown */}
        <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              <span className="text-muted-foreground font-normal">Sort:</span>
              <span>{SORT_LABELS[state.sort]}</span>
              <ChevronDown size={13} className="opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1.5 rounded-lg">
            {(Object.keys(SORT_LABELS) as PackageSortOption[]).map((key) => {
              const active = state.sort === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange({ ...state, sort: key });
                    setSortPopoverOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground hover:bg-muted font-medium"
                  }`}
                >
                  <span>{SORT_LABELS[key]}</span>
                  {active && <Check size={13} />}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        {/* Quick "Must power" inline shortcuts on desktop */}
        <div className="hidden lg:flex items-center gap-1.5 pl-1 border-l border-border">
          {(["ac_1_5hp", "fridge", "water_pump"] as HeavyLoadKey[]).map((key) => {
            const label =
              key === "ac_1_5hp" ? "Runs 1.5HP AC" : key === "fridge" ? "Runs Fridge" : "Runs Pump";
            const active = state.mustPower.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  onChange({
                    ...state,
                    mustPower: toggleItem<HeavyLoadKey>(state.mustPower, key),
                  })
                }
                className={`h-9 px-2.5 rounded-md border text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Reset link when filters active */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="ml-auto inline-flex items-center gap-1 h-9 px-2.5 rounded-md text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset ({activeCount})</span>
          </button>
        )}
      </div>

      {/* Slide-over Filter Panel (Sheet on desktop, Drawer on mobile) */}
      {isMobile ? (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="h-[88vh] p-0 flex flex-col">
            <DrawerTitle className="sr-only">Filter Solar Packages</DrawerTitle>
            {filterPanelBody}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="right" className="w-[380px] sm:max-w-[400px] p-0 flex flex-col [&>button]:hidden">
            <SheetTitle className="sr-only">Filter Solar Packages</SheetTitle>
            {filterPanelBody}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default PackageFilterBar;
