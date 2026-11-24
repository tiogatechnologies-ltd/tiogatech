import type { SolarPackage } from "@/hooks/useSolarPackages";
import { canRun, inferPackageLoadKw, type HeavyLoadKey } from "@/lib/packageAppliances";

export type BatteryTypeFilter = "lithium" | "tubular" | "high_voltage";
export type TierFilter = "Essential" | "Core" | "Pro";
export type CapacityBucket = "le2" | "3to5" | "6to10" | "12plus";
export type PropertyTypeFilter = "flat" | "duplex" | "shop" | "office";
export type PackageSortOption = "recommended" | "price-asc" | "price-desc" | "capacity-asc";

export interface PackageFilterState {
  search: string;
  batteryTypes: BatteryTypeFilter[];
  tiers: TierFilter[];
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  capacityBuckets: CapacityBucket[];
  mustPower: HeavyLoadKey[];
  propertyTypes: PropertyTypeFilter[];
  sort: PackageSortOption;
}

export const EMPTY_PACKAGE_FILTERS: PackageFilterState = {
  search: "",
  batteryTypes: [],
  tiers: [],
  brands: [],
  minPrice: null,
  maxPrice: null,
  capacityBuckets: [],
  mustPower: [],
  propertyTypes: [],
  sort: "recommended",
};

export interface BudgetPreset {
  id: string;
  label: string;
  min: number | null;
  max: number | null;
}

export const BUDGET_PRESETS: BudgetPreset[] = [
  { id: "under-1m", label: "Under ₦1M", min: null, max: 1_000_000 },
  { id: "1m-2m", label: "₦1M – ₦2M", min: 1_000_000, max: 2_000_000 },
  { id: "2m-5m", label: "₦2M – ₦5M", min: 2_000_000, max: 5_000_000 },
  { id: "5m-10m", label: "₦5M – ₦10M", min: 5_000_000, max: 10_000_000 },
  { id: "10m-plus", label: "₦10M+", min: 10_000_000, max: null },
];

export const CAPACITY_BUCKET_OPTIONS: Array<{ key: CapacityBucket; label: string }> = [
  { key: "le2", label: "≤ 2 kW" },
  { key: "3to5", label: "3 – 5 kW" },
  { key: "6to10", label: "6 – 10 kW" },
  { key: "12plus", label: "12 kW+" },
];

export const MUST_POWER_OPTIONS: Array<{ key: HeavyLoadKey; label: string }> = [
  { key: "ac_1_5hp", label: "1.5HP AC" },
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Deep Freezer" },
  { key: "water_pump", label: "Pumping Machine" },
  { key: "washing_machine", label: "Washing Machine" },
];

export const PROPERTY_TYPE_OPTIONS: Array<{ key: PropertyTypeFilter; label: string }> = [
  { key: "flat", label: "Flat / Apartment" },
  { key: "duplex", label: "Duplex / House" },
  { key: "shop", label: "Shop / Kiosk" },
  { key: "office", label: "Office / Commercial" },
];

export function inferPackageBrand(pkg: SolarPackage): string {
  if (pkg.brand) return pkg.brand;
  const inv = `${pkg.inverter || ""} ${pkg.battery || ""}`.toLowerCase();
  if (inv.includes("srne")) return "SRNE";
  if (inv.includes("itel")) return "itel";
  if (inv.includes("deye")) return "Deye";
  if (inv.includes("felicity")) return "Felicity";
  if (inv.includes("growatt")) return "Growatt";
  if (inv.includes("luxpower")) return "Luxpower";
  if (inv.includes("luminous")) return "Luminous";
  if (inv.includes("hybrid")) return "Tioga Hybrid";
  return "Tioga Solar";
}

function matchesCapacityBucket(kw: number, bucket: CapacityBucket): boolean {
  switch (bucket) {
    case "le2":
      return kw <= 2.5;
    case "3to5":
      return kw > 2.5 && kw <= 5.5;
    case "6to10":
      return kw > 5.5 && kw <= 10.5;
    case "12plus":
      return kw > 10.5;
  }
}

function matchesPropertyType(pkg: SolarPackage, prop: PropertyTypeFilter): boolean {
  const text = `${pkg.best_for || ""} ${pkg.tagline || ""} ${pkg.appliances || ""}`.toLowerCase();
  const kw = inferPackageLoadKw(pkg);
  switch (prop) {
    case "flat":
      return /flat|studio|apartment|1-bed|2-bed|3-bed|bedroom/i.test(text) || (kw >= 1 && kw <= 5);
    case "duplex":
      return /duplex|house|home|family|4-bed|5-bed|villa/i.test(text) || (kw >= 5 && kw <= 15);
    case "shop":
      return /shop|kiosk|salon|store|barber|clinic|small business/i.test(text) || (kw >= 1 && kw <= 6);
    case "office":
      return /office|school|hotel|factory|commercial|business|three-phase|3-phase/i.test(text) || kw >= 8;
  }
}

export function countActivePackageFilters(state: PackageFilterState): number {
  let count = 0;
  if (state.search.trim()) count += 1;
  count += state.batteryTypes.length;
  count += state.tiers.length;
  count += state.brands.length;
  if (state.minPrice != null || state.maxPrice != null) count += 1;
  count += state.capacityBuckets.length;
  count += state.mustPower.length;
  count += state.propertyTypes.length;
  return count;
}

export function filterPackages(
  packages: SolarPackage[],
  state: PackageFilterState,
): SolarPackage[] {
  const q = state.search.trim().toLowerCase();

  const matched = packages.filter((pkg) => {
    // 1. Text search (capacity, brand, inverter, appliances, tier, code)
    if (q) {
      const hay = [
        pkg.name,
        pkg.code,
        pkg.tier,
        inferPackageBrand(pkg),
        pkg.inverter,
        pkg.battery,
        pkg.solar_panels,
        pkg.appliances,
        pkg.best_for,
        pkg.tagline,
        pkg.largest_load_kw ? `${pkg.largest_load_kw}kw` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      if (!terms.every((t) => hay.includes(t))) return false;
    }

    // 2. Battery type
    if (state.batteryTypes.length > 0 && !state.batteryTypes.includes(pkg.battery_type)) {
      return false;
    }

    // 3. Tier (applies mainly to lithium packages, non-lithium excluded when tier specifically selected)
    if (state.tiers.length > 0) {
      if (!pkg.tier || !state.tiers.includes(pkg.tier)) return false;
    }

    // 4. Brand
    if (state.brands.length > 0) {
      const b = inferPackageBrand(pkg);
      if (!state.brands.includes(b)) return false;
    }

    // 5. Price range
    if (state.minPrice != null && pkg.total_price < state.minPrice) return false;
    if (state.maxPrice != null && pkg.total_price > state.maxPrice) return false;

    // 6. Capacity buckets (OR within capacity)
    if (state.capacityBuckets.length > 0) {
      const kw = inferPackageLoadKw(pkg);
      if (!state.capacityBuckets.some((b) => matchesCapacityBucket(kw, b))) return false;
    }

    // 7. Must be able to power (AND across selected heavy loads — status must be "yes")
    if (state.mustPower.length > 0) {
      for (const loadKey of state.mustPower) {
        const res = canRun(pkg, loadKey);
        if (res.status !== "yes") return false;
      }
    }

    // 8. Property type (OR within property types)
    if (state.propertyTypes.length > 0) {
      if (!state.propertyTypes.some((prop) => matchesPropertyType(pkg, prop))) return false;
    }

    return true;
  });

  // Sort
  const sorted = [...matched];
  switch (state.sort) {
    case "price-asc":
      sorted.sort((a, b) => a.total_price - b.total_price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.total_price - a.total_price);
      break;
    case "capacity-asc":
      sorted.sort((a, b) => inferPackageLoadKw(a) - inferPackageLoadKw(b));
      break;
    case "recommended":
    default:
      sorted.sort((a, b) => (a.sort_order ?? a.package_number) - (b.sort_order ?? b.package_number));
      break;
  }
  return sorted;
}

/**
 * When a filter combination yields 0 exact matches, ranks all packages by how
 * closely they satisfy the shopper's budget, battery type, and must-power criteria.
 */
export function findClosestPackages(
  packages: SolarPackage[],
  state: PackageFilterState,
  limit = 3,
): SolarPackage[] {
  if (!packages.length) return [];

  const targetBudget =
    state.minPrice != null && state.maxPrice != null
      ? (state.minPrice + state.maxPrice) / 2
      : state.maxPrice ?? state.minPrice ?? null;

  const scored = packages.map((pkg) => {
    let penalty = 0;

    if (state.batteryTypes.length > 0 && !state.batteryTypes.includes(pkg.battery_type)) {
      penalty += 30;
    }
    if (state.brands.length > 0 && !state.brands.includes(inferPackageBrand(pkg))) {
      penalty += 15;
    }
    if (state.mustPower.length > 0) {
      for (const key of state.mustPower) {
        const res = canRun(pkg, key);
        if (res.status === "limited") penalty += 15;
        else if (res.status === "no") penalty += 45;
      }
    }
    if (targetBudget != null && targetBudget > 0) {
      const ratioDiff = Math.abs(pkg.total_price - targetBudget) / targetBudget;
      penalty += Math.min(50, ratioDiff * 25);
    }
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      const hay = `${pkg.name || ""} ${pkg.inverter} ${pkg.appliances}`.toLowerCase();
      if (!hay.includes(q)) penalty += 10;
    }
    return { pkg, penalty };
  });

  scored.sort((a, b) => a.penalty - b.penalty || a.pkg.total_price - b.pkg.total_price);
  return scored.slice(0, limit).map((s) => s.pkg);
}

/**
 * Reads filter state from URLSearchParams so filtered package links are shareable.
 */
export function readPackageFilters(params: URLSearchParams): PackageFilterState {
  const split = (key: string) =>
    (params.get(key) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const num = (key: string) => {
    const raw = params.get(key);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const sortRaw = params.get("sort");
  const sort: PackageSortOption =
    sortRaw === "price-asc" || sortRaw === "price-desc" || sortRaw === "capacity-asc"
      ? sortRaw
      : "recommended";

  return {
    search: params.get("q") || "",
    batteryTypes: split("bat").filter((v): v is BatteryTypeFilter =>
      v === "lithium" || v === "tubular" || v === "high_voltage",
    ),
    tiers: split("tier").filter((v): v is TierFilter =>
      v === "Essential" || v === "Core" || v === "Pro",
    ),
    brands: split("brand"),
    minPrice: num("min"),
    maxPrice: num("max"),
    capacityBuckets: split("cap").filter((v): v is CapacityBucket =>
      v === "le2" || v === "3to5" || v === "6to10" || v === "12plus",
    ),
    mustPower: split("power") as HeavyLoadKey[],
    propertyTypes: split("prop").filter((v): v is PropertyTypeFilter =>
      v === "flat" || v === "duplex" || v === "shop" || v === "office",
    ),
    sort,
  };
}

/**
 * Serializes filter state into URLSearchParams (preserving unrelated params like `category`).
 */
export function writePackageFilters(
  state: PackageFilterState,
  baseParams?: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(baseParams ? baseParams.toString() : "");
  const managedKeys = ["q", "bat", "tier", "brand", "min", "max", "cap", "power", "prop", "sort"];
  for (const k of managedKeys) next.delete(k);

  if (state.search.trim()) next.set("q", state.search.trim());
  if (state.batteryTypes.length) next.set("bat", state.batteryTypes.join(","));
  if (state.tiers.length) next.set("tier", state.tiers.join(","));
  if (state.brands.length) next.set("brand", state.brands.join(","));
  if (state.minPrice != null) next.set("min", String(Math.round(state.minPrice)));
  if (state.maxPrice != null) next.set("max", String(Math.round(state.maxPrice)));
  if (state.capacityBuckets.length) next.set("cap", state.capacityBuckets.join(","));
  if (state.mustPower.length) next.set("power", state.mustPower.join(","));
  if (state.propertyTypes.length) next.set("prop", state.propertyTypes.join(","));
  if (state.sort !== "recommended") next.set("sort", state.sort);

  return next;
}
