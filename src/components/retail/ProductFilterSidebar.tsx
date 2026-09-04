import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal, RotateCcw, Check } from "lucide-react";

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
  capacities: string[];
  maxPrice: number;
  totalResults: number;
  onReset: () => void;
}

const formatNGN = (n: number) => `₦${(n / 1_000_000).toFixed(1)}M`;

export const ProductFilterSidebar = ({
  filters,
  onChange,
  categories,
  brands,
  capacities,
  maxPrice,
  totalResults,
  onReset,
}: FilterProps) => {
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
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Brand / Manufacturer</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2 text-xs text-foreground hover:text-primary cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
                />
                <span>{brand}</span>
              </label>
            ))}
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
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => onChange({ ...filters, inStockOnly: Boolean(checked) })}
          />
          <span>In Stock & Ready for Immediate Dispatch</span>
        </label>
      </div>
    </div>
  );
};
