import { useState, useMemo, useEffect, useRef } from "react";
import {
  SlidersHorizontal,
  X,
  ArrowRight,
  Check,
  Trash2,
  ShoppingBag,
  Scale,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductCompare, MAX_COMPARE } from "@/hooks/useProductCompare";
import { useCart } from "@/contexts/CartContext";
import { productPath } from "@/lib/productSlug";
import { resolveProductImage } from "@/lib/productImages";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { mergeProducts } from "@/lib/mergeProducts";
import { normalizeCategory, inferBrand } from "@/lib/productBrand";
import type { RetailProduct } from "@/types/retail";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const parsePriceNaira = (price?: string | null): number | null => {
  if (!price) return null;
  const digits = price.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : null;
};

export const ProductCompareTray = () => {
  const {
    compareItems,
    count,
    removeCompare,
    clearCompare,
    isOpen,
    setIsOpen,
    addCompare,
  } = useProductCompare();
  const { add } = useCart();
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [dbCatalog, setDbCatalog] = useState<RetailProduct[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fetch live products from Supabase to ensure authentic DB rows and IDs match
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (cancelled || !data) return;
        const normalizedDb: RetailProduct[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: normalizeCategory(p.category, p.name),
          series: p.series || null,
          description: p.description || "",
          features: Array.isArray(p.features) ? p.features : [],
          best_for: p.best_for || "Residential & commercial applications",
          price: p.price || null,
          numeric_price: parsePriceNaira(p.price) || undefined,
          tier: p.tier || "premium",
          image_url: p.image_url || null,
          specifications: p.specifications || {},
          brand: p.brand || inferBrand(p.name, p.category),
          rating: p.rating,
          review_count: p.review_count,
          stock_status: "in_stock",
          serial_number: p.serial_number,
          sku: p.sku,
        }));
        setDbCatalog(normalizedDb);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Merge static catalog with live DB items, ensuring normalized categories and matching IDs
  const catalogPool: RetailProduct[] = useMemo(() => {
    const staticItems: RetailProduct[] = STATIC_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      category: normalizeCategory(p.category, p.name),
      series: p.series || null,
      description: p.description,
      features: p.features || [],
      best_for: p.best_for || p.bestFor || "Residential & commercial applications",
      price: p.price || null,
      numeric_price: p.numeric_price,
      tier: p.tier || "premium",
      image_url: p.image_url || null,
      specifications: p.specifications || {},
      tags: p.tags || null,
      brand: p.brand || inferBrand(p.name, p.category),
      rating: p.rating,
      review_count: p.review_count,
      stock_status: p.stock_status || "in_stock",
      warranty_years: p.warranty_years,
      serial_number: p.serial_number,
      sku: p.sku,
    }));
    return mergeProducts(staticItems, dbCatalog);
  }, [dbCatalog]);

  // Primary category of currently selected items for relevant suggestions
  const primaryCategory = compareItems[0]?.category
    ? normalizeCategory(compareItems[0].category, compareItems[0].name)
    : "";

  // Available products for picker (exclude currently selected by ID or name)
  const availableToPick = useMemo(() => {
    return catalogPool.filter(
      (p) =>
        !compareItems.some(
          (item) =>
            item.id === p.id ||
            (item.name && p.name && item.name.trim().toLowerCase() === p.name.trim().toLowerCase())
        )
    );
  }, [catalogPool, compareItems]);

  // Unique categories in the available pool for fast filtering
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    availableToPick.forEach((p) => {
      const cat = normalizeCategory(p.category, p.name);
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [availableToPick]);

  // Suggestions filtered by search, category chip, or prioritized by primaryCategory
  const filteredSuggestions = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (q) {
      return availableToPick.filter((p) => {
        const cat = normalizeCategory(p.category, p.name);
        return (
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          cat.toLowerCase().includes(q) ||
          (p.series && p.series.toLowerCase().includes(q))
        );
      });
    }

    if (selectedCat !== "all") {
      return availableToPick.filter(
        (p) => normalizeCategory(p.category, p.name) === selectedCat
      );
    }

    // Default: prioritize models in the same category first, followed by others
    if (primaryCategory) {
      const sameCat = availableToPick.filter(
        (p) => normalizeCategory(p.category, p.name) === primaryCategory
      );
      const otherCats = availableToPick.filter(
        (p) => normalizeCategory(p.category, p.name) !== primaryCategory
      );
      return [...sameCat, ...otherCats];
    }

    return availableToPick;
  }, [availableToPick, pickerSearch, selectedCat, primaryCategory]);

  // Top alternative suggestions in the same category (used for quick-add pills)
  const quickAlternatives = useMemo(() => {
    if (!primaryCategory) return availableToPick.slice(0, 3);
    const same = availableToPick.filter(
      (p) => normalizeCategory(p.category, p.name) === primaryCategory
    );
    return same.length > 0 ? same.slice(0, 3) : availableToPick.slice(0, 3);
  }, [availableToPick, primaryCategory]);

  // Unique spec keys across compared items
  const allSpecKeys = Array.from(
    new Set(
      compareItems.flatMap((p) =>
        p.specifications ? Object.keys(p.specifications) : []
      )
    )
  );

  const handleAddToCart = (item: RetailProduct) => {
    add({
      refId: item.id,
      type: "product",
      name: item.name,
      price: item.price,
      numericPrice: item.numeric_price,
      image: item.image_url,
      category: item.category,
      quantity: 1,
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const handleQuickAdd = (product: RetailProduct) => {
    const success = addCompare(product);
    if (success && compareItems.length + 1 >= MAX_COMPARE) {
      setShowPicker(false);
    }
  };

  const openPickerAndFocus = () => {
    setShowPicker(true);
    setTimeout(() => {
      pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  if (count === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating Bottom Bar (Sticky across site when items are selected) */}
      {count > 0 && (
        <div className="fixed bottom-5 inset-x-4 md:inset-x-auto md:right-8 z-40 max-w-xl mx-auto bg-card/95 text-foreground backdrop-blur-xl border border-primary/40 rounded-3xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
              <SlidersHorizontal size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {count === 1
                  ? "1 model selected · Add another to compare"
                  : `Compare Models (${count}/${MAX_COMPARE})`}
              </p>
              <div className="flex items-center gap-1.5 mt-1 overflow-x-auto">
                {compareItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative group w-9 h-9 rounded-xl overflow-hidden border border-border bg-muted/30 p-0.5 shrink-0"
                    title={item.name}
                  >
                    <img
                      src={resolveProductImage(item.image_url, item.category)}
                      alt={item.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeCompare(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {count < MAX_COMPARE && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(true);
                      setShowPicker(true);
                    }}
                    className="w-9 h-9 rounded-xl border border-dashed border-primary/50 text-primary hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors"
                    title="Add another product to compare"
                    aria-label="Add another product to compare"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={clearCompare}
              className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-xl transition-colors font-medium"
            >
              Clear
            </button>
            <Button
              onClick={() => setIsOpen(true)}
              size="sm"
              className="bg-primary text-primary-foreground font-bold text-xs rounded-2xl shadow-md px-4 py-2 gap-1.5 hover:brightness-110"
            >
              <span>{count >= 2 ? "Compare Now" : "Open Matrix"}</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Comparison Modal Table */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl p-4 sm:p-6 lg:p-8 bg-card border-border rounded-3xl max-h-[92vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4 shrink-0">
            <div>
              <DialogTitle className="text-lg sm:text-2xl font-display font-bold text-foreground flex items-center gap-2.5">
                <Scale size={22} className="text-primary" />
                Side-by-Side Hardware Comparison
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Direct head-to-head engineering specifications, pricing, features, and factory warranties.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {count < MAX_COMPARE && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPicker((s) => !s)}
                  className="text-xs rounded-xl h-8 font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Plus size={13} />
                  {showPicker ? "Hide Picker" : "Add Model"}
                </Button>
              )}

              <Button
                variant={highlightDiffs ? "default" : "outline"}
                size="sm"
                onClick={() => setHighlightDiffs((h) => !h)}
                className="text-xs rounded-xl h-8 font-semibold"
              >
                {highlightDiffs ? "Show All" : "Highlight Differences"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompare}
                className="text-xs text-muted-foreground hover:text-destructive gap-1 rounded-xl h-8"
              >
                <Trash2 size={13} />
                Clear All
              </Button>
            </div>
          </DialogHeader>

          {/* Quick Model Picker Drawer / Banner */}
          {showPicker && count < MAX_COMPARE && (
            <div
              ref={pickerRef}
              className="p-4 rounded-2xl bg-muted/40 border border-border mt-3 shrink-0 space-y-3 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Sparkles size={15} className="text-primary" />
                  <span>
                    Add Hardware Model to Compare ({count}/{MAX_COMPARE})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCat("all")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors shrink-0 text-xs ${
                    selectedCat === "all"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({availableToPick.length})
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors shrink-0 text-xs capitalize ${
                      selectedCat === cat
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder={`Search by model name, brand (Deye, Felicity, Longi, STAMA), or specs...`}
                  className="pl-9 pr-8 h-9 text-xs rounded-xl bg-card border-border"
                />
                {pickerSearch && (
                  <button
                    type="button"
                    onClick={() => setPickerSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Suggestions grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredSuggestions.slice(0, 12).map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/80 hover:border-primary/50 text-left gap-2.5 text-xs transition-all shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-muted/20 border border-border/60 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={resolveProductImage(prod.image_url, prod.category, prod.name)}
                          alt={prod.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-primary truncate max-w-[80px]">
                            {prod.brand || "Tioga"}
                          </span>
                          <span className="text-[9px] text-muted-foreground/80 px-1 py-0.2 rounded bg-muted">
                            {prod.category}
                          </span>
                        </div>
                        <p className="font-bold text-foreground truncate text-xs mt-0.5" title={prod.name}>
                          {prod.name}
                        </p>
                        <p className="text-[11px] font-mono text-primary font-bold">
                          {prod.numeric_price
                            ? `₦${prod.numeric_price.toLocaleString("en-NG")}`
                            : prod.price || "Contact for Price"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickAdd(prod)}
                      className="h-8 px-3 text-xs font-bold rounded-xl shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all gap-1"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </Button>
                  </div>
                ))}
                {filteredSuggestions.length === 0 && (
                  <div className="text-xs text-muted-foreground py-6 col-span-full text-center border border-dashed border-border rounded-xl">
                    <p className="font-medium">No matching models found.</p>
                    <p className="text-[11px] mt-1 text-muted-foreground/70">
                      Try clearing search or switching category tabs above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* If only 1 item selected, show a helpful invite banner with 1-click alternative pills */}
          {count === 1 && !showPicker && (
            <div className="mt-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-foreground space-y-2 shrink-0 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-primary shrink-0" />
                  <span>
                    Selected: <strong>{compareItems[0]?.name}</strong>. Add at least one more product to compare side-by-side:
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={openPickerAndFocus}
                  className="text-xs h-7 rounded-xl font-bold gap-1 shrink-0 self-start sm:self-auto"
                >
                  <Search size={12} /> Browse Catalog ({availableToPick.length})
                </Button>
              </div>

              {/* 1-Click Quick Add Recommended Alternatives */}
              {quickAlternatives.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                    Quick Add:
                  </span>
                  {quickAlternatives.map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => handleQuickAdd(alt)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 hover:border-primary text-foreground text-xs font-semibold shrink-0 transition-all hover:shadow-xs group"
                    >
                      <img
                        src={resolveProductImage(alt.image_url, alt.category, alt.name)}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                      <span className="truncate max-w-[140px] text-left">{alt.name}</span>
                      <span className="font-mono text-primary text-[11px]">
                        {alt.numeric_price ? `₦${(alt.numeric_price / 1000).toFixed(0)}k` : ""}
                      </span>
                      <span className="p-0.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus size={12} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comparison Matrix Table with Horizontal Scroll & Sticky First Column */}
          <div className="overflow-x-auto mt-4 rounded-2xl border border-border bg-card flex-1">
            <table className="w-full text-xs text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 font-bold text-foreground w-40 sm:w-48 min-w-[150px] sticky left-0 bg-muted/90 backdrop-blur-md z-20 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Hardware Overview
                  </th>

                  {compareItems.map((item) => (
                    <th key={item.id} className="p-4 text-center min-w-[200px] max-w-[260px] align-top border-r border-border/40 last:border-r-0">
                      <div className="flex flex-col items-center space-y-2.5">
                        <div className="relative aspect-square w-24 h-24 rounded-2xl overflow-hidden bg-card border border-border p-2 flex items-center justify-center">
                          <img
                            src={resolveProductImage(item.image_url, item.category)}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => removeCompare(item.id)}
                            className="absolute top-1 right-1 p-1 rounded-md bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove from comparison"
                            aria-label={`Remove ${item.name} from comparison`}
                          >
                            <X size={12} />
                          </button>
                        </div>

                        <Link
                          to={productPath(item)}
                          onClick={() => setIsOpen(false)}
                          className="font-display font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-2 text-center"
                        >
                          {item.name}
                        </Link>

                        <p className="font-display font-black text-base text-primary">
                          {item.numeric_price
                            ? `₦${item.numeric_price.toLocaleString("en-NG")}`
                            : item.price || "Price on Request"}
                        </p>

                        <div className="grid grid-cols-2 gap-1.5 w-full pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            className="w-full py-1.5 text-[11px] rounded-xl font-bold gap-1"
                          >
                            <ShoppingBag size={13} />
                            Add
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="w-full py-1.5 text-[11px] rounded-xl font-bold"
                          >
                            <Link to={productPath(item)} onClick={() => setIsOpen(false)}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </th>
                  ))}

                  {/* Empty Slot for adding more products */}
                  {count < MAX_COMPARE && (
                    <th className="p-4 text-center min-w-[180px] align-middle">
                      <button
                        type="button"
                        onClick={openPickerAndFocus}
                        className="w-full h-48 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/10 hover:bg-primary/5 flex flex-col items-center justify-center p-4 gap-2 text-muted-foreground hover:text-primary transition-all group"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus size={18} />
                        </div>
                        <span className="text-xs font-bold text-foreground">Add Another Model</span>
                        <span className="text-[10px] text-muted-foreground">Compare up to 4</span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {/* Category Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20 sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Category
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center font-medium text-muted-foreground capitalize border-r border-border/40 last:border-r-0">
                      {item.category.replace("_", " ")}
                    </td>
                  ))}
                  {count < MAX_COMPARE && <td className="p-3.5 text-center text-muted-foreground/40">-</td>}
                </tr>

                {/* Brand Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20 sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Brand / Manufacturer
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center font-semibold text-foreground border-r border-border/40 last:border-r-0">
                      {item.brand || "Tioga Certified"}
                    </td>
                  ))}
                  {count < MAX_COMPARE && <td className="p-3.5 text-center text-muted-foreground/40">-</td>}
                </tr>

                {/* Series Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20 sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Product Series
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center font-medium text-muted-foreground border-r border-border/40 last:border-r-0">
                      {item.series || "Standard Line"}
                    </td>
                  ))}
                  {count < MAX_COMPARE && <td className="p-3.5 text-center text-muted-foreground/40">-</td>}
                </tr>

                {/* Key Features Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20 sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Key Features
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 align-top border-r border-border/40 last:border-r-0">
                      {item.features && item.features.length > 0 ? (
                        <ul className="space-y-1.5 text-left text-[11px] text-muted-foreground">
                          {item.features.slice(0, 4).map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-1.5">
                              <CheckCircle2 size={13} className="text-primary shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground/50 text-center block">Standard features</span>
                      )}
                    </td>
                  ))}
                  {count < MAX_COMPARE && <td className="p-3.5 text-center text-muted-foreground/40">-</td>}
                </tr>

                {/* Stock Status Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20 sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Availability
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center border-r border-border/40 last:border-r-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <Check size={13} />
                        In Stock (Ships in 24h)
                      </span>
                    </td>
                  ))}
                  {count < MAX_COMPARE && <td className="p-3.5 text-center text-muted-foreground/40">-</td>}
                </tr>

                {/* Official Warranty Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20 sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Official Warranty
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center font-semibold text-foreground border-r border-border/40 last:border-r-0">
                      {item.warranty_years
                        ? `${item.warranty_years}-Year Direct Warranty`
                        : "5-Year Direct Warranty"}
                    </td>
                  ))}
                  {count < MAX_COMPARE && <td className="p-3.5 text-center text-muted-foreground/40">-</td>}
                </tr>

                {/* Dynamic Specification Rows */}
                {allSpecKeys.map((key) => {
                  const values = compareItems.map((item) => item.specifications?.[key] || "-");
                  const allSame = values.every((v) => v === values[0]);

                  if (highlightDiffs && allSame) return null;

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-muted/10 ${
                        !allSame ? "bg-primary/5 font-semibold" : ""
                      }`}
                    >
                      <td className="p-3.5 font-bold text-foreground bg-muted/20 sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] flex items-center justify-between">
                        <span>{key}</span>
                        {!allSame && (
                          <span className="text-[10px] uppercase font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                            Diff
                          </span>
                        )}
                      </td>
                      {compareItems.map((item) => (
                        <td key={item.id} className="p-3.5 text-center text-foreground font-mono border-r border-border/40 last:border-r-0">
                          {item.specifications?.[key] || "-"}
                        </td>
                      ))}
                      {count < MAX_COMPARE && <td className="p-3.5 text-center text-muted-foreground/40">-</td>}
                    </tr>
                  );
                })}

                {/* Best For Application Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20 sticky left-0 z-10 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Recommended For
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center text-xs text-muted-foreground leading-relaxed border-r border-border/40 last:border-r-0">
                      {item.best_for}
                    </td>
                  ))}
                  {count < MAX_COMPARE && <td className="p-3.5 text-center text-muted-foreground/40">-</td>}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCompareTray;
