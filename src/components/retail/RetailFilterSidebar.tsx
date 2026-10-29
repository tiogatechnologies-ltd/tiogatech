import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { FacetGroup, FacetOption, RetailFilterState } from "@/lib/retailFilters";

interface FilterProps {
  filters: RetailFilterState;
  onChange: (filters: RetailFilterState) => void;
  onCategoryChange: (category: string | null) => void;
  categories: string[];
  brands: FacetOption[];
  groups: FacetGroup[];
  maxPrice: number;
  totalResults: number;
  onReset: () => void;
}
const currency = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export const RetailFilterSidebar = ({ filters, onChange, onCategoryChange, categories, brands, groups, maxPrice, totalResults, onReset }: FilterProps) => {
  const [brandSearch, setBrandSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  useEffect(() => { setOpenGroups([]); setBrandSearch(""); }, [filters.category]);
  const shownBrands = useMemo(() => brands.filter(option => option.value.toLowerCase().includes(brandSearch.trim().toLowerCase())), [brands, brandSearch]);
  const isFiltered = filters.brands.length > 0 || Object.values(filters.specs).some(values => values?.length) || filters.minPrice !== null || filters.maxPrice !== null || filters.inStockOnly || !!filters.search;
  const toggle = (selected: string[], value: string) => selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
  const range: [number, number] = [Math.min(filters.minPrice ?? 0, maxPrice), Math.min(filters.maxPrice ?? maxPrice, maxPrice)];
  const priceSummary = filters.minPrice === null && filters.maxPrice === null ? "Any price" : `${currency(filters.minPrice ?? 0)} – ${filters.maxPrice === null ? "Any price" : currency(filters.maxPrice)}`;
  const section = (key: string, title: string, summary: string, selectedCount: number, children: ReactNode) => (
    <AccordionItem key={key} value={key} className="border-border">
      <AccordionTrigger aria-label={`${title} filters`} className="gap-2 py-3 text-left text-sm hover:no-underline">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            {title}{selectedCount > 0 && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{selectedCount}<span className="sr-only"> selected</span></Badge>}
          </span>
          {summary && <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground" title={summary}>{summary}</span>}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-3">
        <fieldset className="min-w-0 space-y-2">
          <legend className="sr-only">{title}</legend>
          {children}
        </fieldset>
      </AccordionContent>
    </AccordionItem>
  );
  const renderOption = (option: FacetOption, checked: boolean, change: () => void, label: string) => (
    <label key={option.value} className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs ${option.count === 0 && !checked ? "text-muted-foreground opacity-60" : "text-foreground cursor-pointer hover:bg-muted"} ${checked ? "bg-primary/10 font-semibold" : ""}`}>
      <span className="flex min-w-0 items-center gap-2">
        <Checkbox aria-label={`Filter by ${label}: ${option.value}`} checked={checked} disabled={option.count === 0 && !checked} onCheckedChange={change} />
        <span>{option.value}</span>
      </span>
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{option.count}</span>
    </label>
  );
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2"><SlidersHorizontal size={16} className="text-primary" /><span className="font-semibold">Filters</span><Badge variant="secondary">{totalResults} items</Badge></div>
        {isFiltered && <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-xs text-primary"><RotateCcw size={12} />Clear</button>}
      </div>
      <label className="block text-xs font-semibold text-muted-foreground">Category
        <select aria-label="Product category" value={filters.category ?? ""} onChange={event => onCategoryChange(event.target.value || null)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal text-foreground">
          <option value="">All categories</option>
          {categories.map(category => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <Accordion type="multiple" value={openGroups} onValueChange={setOpenGroups} className="border-t border-border">
        {brands.length > 0 && section("brand", "Brand", filters.brands.join(", "), filters.brands.length, <>
          {brands.length > 5 && <div className="relative"><Search size={13} className="absolute left-2.5 top-3 text-muted-foreground" /><Input aria-label="Search brands" placeholder="Search brands" value={brandSearch} onChange={event => setBrandSearch(event.target.value)} className="h-9 pl-8 text-xs" /></div>}
          <div>{shownBrands.map(option => renderOption(option, filters.brands.includes(option.value), () => onChange({ ...filters, brands: toggle(filters.brands, option.value) }), "brand"))}</div>
          {!shownBrands.length && <p className="text-xs text-muted-foreground">No matching brands.</p>}
        </>)}
        {section("price", "Price range", filters.minPrice === null && filters.maxPrice === null ? "" : priceSummary, Number(filters.minPrice !== null || filters.maxPrice !== null), <>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">Min (₦)<Input type="number" min={0} step={1} aria-label="Minimum price (₦)" value={filters.minPrice ?? ""} placeholder="0" onChange={event => onChange({ ...filters, minPrice: event.target.value === "" ? null : Math.max(0, Number(event.target.value)) })} className="mt-1 h-9 text-xs" /></label>
            <label className="text-xs text-muted-foreground">Max (₦)<Input type="number" min={0} step={1} aria-label="Maximum price (₦)" value={filters.maxPrice ?? ""} placeholder={String(maxPrice)} onChange={event => onChange({ ...filters, maxPrice: event.target.value === "" ? null : Math.max(0, Number(event.target.value)) })} className="mt-1 h-9 text-xs" /></label>
          </div>
          <Slider aria-label="Price range" min={0} max={maxPrice} step={Math.max(1, Math.min(1000, Math.floor(maxPrice / 1000)))} value={[Math.min(...range), Math.max(...range)]} onValueChange={value => onChange({ ...filters, minPrice: value[0] === 0 ? null : value[0], maxPrice: value[1] === maxPrice ? null : value[1] })} />
          <p className="text-[11px] text-muted-foreground">{priceSummary}</p>
          {filters.minPrice !== null && filters.maxPrice !== null && filters.minPrice > filters.maxPrice && <p role="alert" className="text-xs text-destructive">Minimum price must not exceed maximum price.</p>}
        </>)}
        {groups.map(group => {
          const selected = filters.specs[group.key] ?? [];
          return section(`spec-${group.key}`, group.label, selected.join(", "), selected.length,
            <div>{group.options.map(option => renderOption(option, selected.includes(option.value), () => onChange({ ...filters, specs: { ...filters.specs, [group.key]: toggle(selected, option.value) } }), group.label.toLowerCase()))}</div>);
        })}
        {section("availability", "Availability", filters.inStockOnly ? "In stock only" : "", Number(filters.inStockOnly),
          <label className="flex cursor-pointer items-center gap-2 text-xs"><Checkbox aria-label="In stock only" checked={filters.inStockOnly} onCheckedChange={checked => onChange({ ...filters, inStockOnly: checked === true })} />In stock only</label>)}
      </Accordion>
    </div>
  );
};
