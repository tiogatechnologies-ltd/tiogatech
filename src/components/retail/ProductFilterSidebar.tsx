import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, SlidersHorizontal, RotateCcw, Check, Search } from "lucide-react";

interface FilterState {
  category: string | null;
  brands: string[];
  capacities: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
  tier: string | null;
}

interface FilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: string[];
  brands: string[];
  brandCounts?: Record<string, number>;
  capacities: string[];
  maxPrice: number;
  totalResults: number;
  onReset: () => void;
}

const formatNGN = (n: number) => {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
};

export const ProductFilterSidebar = ({
  filters,
  onChange,
  categories,
  brands,
  brandCounts,
  capacities,
  maxPrice,
  totalResults,
  onReset,
}: FilterProps) => {
  const [brandSearch, setBrandSearch] = useState("");

  const displayBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase().trim();
    return brands.filter((b) => b.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onChange({ ...filters, brands: next });
  };

  const toggleCapacity = (cap: string) => {
    const next = filters.capacities.includes(cap)
      ? filters.capacities.filter((c) => c !== cap)
      : [...filters.capacities, cap];
    onChange({ ...filters, capacities: next });
  };

  const isFiltered =
    Boolean(filters.category) ||
    filters.brands.length > 0 ||
    filters.capacities.length > 0 ||
    filters.inStockOnly ||
    filters.tier !== null ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice;

  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-primary" />
          <span className="font-display font-bold text-foreground">Filters</span>
          <Badge variant="secondary" className="text-xs px-2 py-0">
            {totalResults} Items
          </Badge>
        </div>
        {isFiltered && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2.5">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Category</h4>
        <div className="space-y-1">
          <button
            onClick={() => onChange({ ...filters, category: null })}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filters.category === null
                ? "bg-primary/10 text-primary font-bold"
                : "text-foreground hover:bg-muted"
            }`}
          >
            All Hardware ({categories.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange({ ...filters, category: filters.category === cat ? null : cat })}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                filters.category === cat
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span>{cat}</span>
              {filters.category === cat && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Price Range</h4>
          <span className="text-xs font-mono font-bold text-foreground">
            {formatNGN(filters.priceRange[0])} – {formatNGN(filters.priceRange[1])}
          </span>
        </div>
        <Slider
          min={0}
          max={maxPrice}
          step={50_000}
          value={filters.priceRange}
          onValueChange={(val) => onChange({ ...filters, priceRange: val as [number, number] })}
          className="my-3"
        />
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Brand / Manufacturer
            </h4>
            {filters.brands.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, brands: [] })}
                className="text-[11px] text-primary hover:underline"
              >
                Clear ({filters.brands.length})
              </button>
            )}
          </div>

          {/* Quick Search for Brands when more than 5 brands exist */}
          {brands.length > 5 && (
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search brands (e.g. AlpSolarr)..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="h-7 text-xs pl-7 pr-7 rounded-lg bg-muted/40 border-border"
              />
              {brandSearch && (
                <button
                  onClick={() => setBrandSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {displayBrands.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center italic">
                No matching brands
              </p>
            ) : (
              displayBrands.map((brand) => {
                const count = brandCounts?.[brand];
                const isChecked = filters.brands.includes(brand);
                return (
                  <label
                    key={brand}
                    className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        aria-label={`Filter by brand: ${brand}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleBrand(brand)}
                      />
                      <span className="truncate">{brand}</span>
                    </div>
                    {count != null && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isChecked
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {count}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Capacities / Ratings */}
      {capacities.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-border">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Power / Capacity</h4>
          <div className="flex flex-wrap gap-1.5">
            {capacities.map((cap) => {
              const active = filters.capacities.includes(cap);
              return (
                <button
                  key={cap}
                  onClick={() => toggleCapacity(cap)}
                  aria-pressed={active}
                  aria-label={`Filter by capacity: ${cap}`}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                      : "bg-card hover:bg-muted text-foreground border-border"
                  }`}
                >
                  {cap}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Availability / In Stock */}
      <div className="space-y-2.5 pt-3 border-t border-border">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Availability</h4>
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <Checkbox
            aria-label="Show only items in stock and ready for immediate dispatch"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => onChange({ ...filters, inStockOnly: Boolean(checked) })}
          />
          <span>In Stock & Ready for Immediate Dispatch</span>
        </label>
      </div>
    </div>
  );
};
