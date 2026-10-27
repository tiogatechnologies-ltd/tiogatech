import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  Zap,
  Battery,
  Lock,
  Home as HomeIcon,
  Shield,
  Truck,
  RotateCcw,
  Tag,
  Award,
  Loader2,
  Heart,
  Camera,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Lightbulb,
  Radio,
  Tv,
  Layers,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { RetailHeroCarousel } from "@/components/retail/RetailHeroCarousel";
import { FlashDealsBar } from "@/components/retail/FlashDealsBar";
import { RetailFilterSidebar } from "@/components/retail/RetailFilterSidebar";
import { ProductCard } from "@/components/retail/ProductCard";
import { QuickViewModal } from "@/components/retail/QuickViewModal";
import { ColumnGridSwitcher, type GridColumnOption } from "@/components/retail/ColumnGridSwitcher";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { inferBrand, normalizeCategory } from "@/lib/productBrand";
import { mergeProducts } from "@/lib/mergeProducts";
import { buildRetailFacets, emptyRetailFilters, extractProductFacets, FACET_LABELS, matchesRetailFilters, readRetailFilters, writeRetailFilters, type RetailFilterState } from "@/lib/retailFilters";
import { fetchAllRows } from "../../supabase/functions/_shared/pagination";
import type { RetailProduct } from "@/types/retail";

import { ArrowRight, Check, ShoppingBag, X } from "lucide-react";

type SortOption = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

export interface RetailCategoryCard {
  key: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
}

export const RETAIL_CATEGORY_CARDS: RetailCategoryCard[] = [
  {
    key: "Smart Switches & Sockets",
    title: "Smart Switches & Sockets",
    subtitle: "Tempered Glass & Zigbee Relays",
    tag: "16A • Touch & Voice",
    image: "/products/categories/cat-switches.png",
  },
  {
    key: "Smart Control Panels",
    title: "Smart Control Panels",
    subtitle: "In-Wall Multi-Touch Hubs",
    tag: "Granite & Linux IPS",
    image: "/products/categories/cat-control-panels.png",
  },
  {
    key: "Smart Door Locks",
    title: "Smart Door Locks",
    subtitle: "3D Face ID, Biometrics & NFC",
    tag: "Flagship Biometric",
    image: "/products/categories/cat-smart-locks.png",
  },
  {
    key: "CCTV & Cameras",
    title: "Safety & Security",
    subtitle: "4G Solar PTZ & 4K AI Cameras",
    tag: "Tioga Vision HD",
    image: "/products/categories/cat-cctv.png",
  },
  {
    key: "Inverters",
    title: "Solar Inverters",
    subtitle: "Deye, Growatt & SRNE Hybrid",
    tag: "Zero-Flicker UPS",
    image: "/products/categories/cat-inverters.png",
  },
  {
    key: "Batteries",
    title: "LiFePO4 Batteries",
    subtitle: "Felicity & Powerwall Storage",
    tag: "6,000+ Cycles",
    image: "/products/categories/cat-batteries.png",
  },
  {
    key: "Solar Panels",
    title: "Solar Panels",
    subtitle: "Tier-1 Monocrystalline Modules",
    tag: "Longi & Canadian Solar",
    image: "/products/categories/cat-solar-panels.png",
  },
  {
    key: "Smart Lighting & Track",
    title: "Smart Lighting & Track",
    subtitle: "Magnetic Rails & LED Spotlights",
    tag: "Dimmable • CCT",
    image: "/products/categories/cat-lighting.png",
  },
  {
    key: "Smart Curtains & Motors",
    title: "Curtains & Shading",
    subtitle: "Motorized Tracks & Smart Blinds",
    tag: "Silent Heavy-Duty",
    image: "/products/categories/cat-curtains.png",
  },
  {
    key: "Smart Audio & Intercom",
    title: "AV Systems & Sound",
    subtitle: "Coaxial Ceiling Speakers & Amps",
    tag: "Multi-Zone Hi-Fi",
    image: "/products/categories/cat-audio.png",
  },
  {
    key: "Gateways & Networking",
    title: "Network & Control",
    subtitle: "Multi-Mode Zigbee Gateways & IR",
    tag: "Mesh Bridge",
    image: "/products/categories/cat-gateways.png",
  },
  {
    key: "Smart Sensors & Alarms",
    title: "Sensors & Alarms",
    subtitle: "PIR Motion, Gas, Water & Smoke",
    tag: "Instant Alerts",
    image: "/products/categories/cat-sensors.png",
  },
];

export const Retail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const filters = useMemo(() => readRetailFilters(searchParams), [searchParams]);
  const updateFilters = (next: RetailFilterState, replace = false) => setSearchParams(writeRetailFilters(next, searchParams), { replace });
  const searchQuery = filters.search;
  const setSearchQuery = (search: string) => updateFilters({ ...filters, search }, true);
  const [gridColumns, setGridColumns] = useState<GridColumnOption>(3);
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);

  const getGridColsClass = (cols: GridColumnOption) => {
    switch (cols) {
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-4";
      case 5:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 3xl:grid-cols-5";
      case "list":
        return "grid-cols-1";
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    }
  };

  const getGridGapClass = (cols: GridColumnOption) => {
    if (cols === 5) return "gap-3 sm:gap-3.5";
    if (cols === 4) return "gap-3.5 sm:gap-4";
    return "gap-4 sm:gap-6";
  };
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<RetailProduct | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { count: wishlistCount } = useWishlist();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  const selectedCategory = filters.category;
  const selectedBrands = filters.brands;
  const setSelectedBrands = (next: string[] | ((previous: string[]) => string[])) => updateFilters({ ...filters, brands: typeof next === "function" ? next(filters.brands) : next });
  const activeFilterCount = filters.brands.length + Object.values(filters.specs).reduce((count, values) => count + (values?.length ?? 0), 0) + Number(filters.minPrice !== null) + Number(filters.maxPrice !== null) + Number(filters.inStockOnly) + Number(!!filters.search);

  // Load products
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchAllRows<any>((from, to) => supabase.from("products").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("id").range(from, to));

        // 1. Map static catalog
        const staticList: RetailProduct[] = STATIC_PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          category: normalizeCategory(p.category, p.name),
          series: p.series || null,
          description: p.description,
          features: p.features || [],
          best_for: p.best_for || p.bestFor || "Residential and commercial backup",
          price: p.price || null,
          numeric_price: p.numeric_price || Number(p.price?.replace(/[^\d.]/g, "") || 0),
          tier: p.tier || "premium",
          image_url: p.image_url || null,
          specifications: p.specifications || {},
          tags: p.tags || [],
          brand: p.brand || inferBrand(p.name, p.category),
          rating: p.rating ?? undefined,
          review_count: p.review_count ?? undefined,
          compare_at_price: p.compare_at_price || null,
          stock_status: (p.stock_status as string) === "preorder" ? "pre_order" : p.stock_status as RetailProduct["stock_status"] || (p.stock_qty != null ? p.stock_qty > 0 ? "in_stock" : "out_of_stock" : undefined),
          is_featured: p.is_featured ?? true,
          warranty_years: p.warranty_years || 5,
        }));

        // 2. Map database rows if available
        let dbList: RetailProduct[] = [];
        if (data && data.length > 0) {
          dbList = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: normalizeCategory(p.category, p.name),
            series: p.series,
            description: p.description,
            features: Array.isArray(p.features) ? p.features : [],
            best_for: p.best_for || "Residential and commercial backup",
            price: p.price,
            numeric_price: Number(p.price?.replace(/[^\d.]/g, "") || p.numeric_price || 0),
            tier: p.tier || "premium",
            image_url: p.image_url,
            specifications: p.specifications || {},
            tags: p.tags || [],
            brand: p.brand || inferBrand(p.name, p.category),
            rating: p.rating ?? undefined,
            review_count: p.review_count ?? undefined,
            compare_at_price: p.compare_at_price ?? null,
            stock_status: (p.stock_qty != null ? p.stock_qty > 0 ? "in_stock" : "out_of_stock" : undefined),
            is_featured: true,
            warranty_years: 5,
          }));
        }

        // 3. Merge static + DB rows (by id, then by name to catch legacy DB duplicates)
        const combined = mergeProducts(staticList, dbList);
        if (isMounted) setProducts(combined);
      } catch {
        if (isMounted) {
          setProducts(STATIC_PRODUCTS.map((p) => ({
            id: p.id,
            name: p.name,
            category: normalizeCategory(p.category, p.name),
            series: p.series || null,
            description: p.description,
            features: p.features || [],
            best_for: p.best_for || p.bestFor || "Residential backup",
            price: p.price || null,
            numeric_price: p.numeric_price || Number(p.price?.replace(/[^\d.]/g, "") || 0),
            tier: p.tier || "premium",
            image_url: p.image_url || null,
            specifications: p.specifications || {},
            tags: p.tags || [],
            brand: p.brand || inferBrand(p.name, p.category),
            rating: p.rating ?? undefined,
            review_count: p.review_count ?? undefined,
            compare_at_price: p.compare_at_price || null,
            stock_status: (p.stock_status as string) === "preorder" ? "pre_order" : p.stock_status as RetailProduct["stock_status"] || (p.stock_qty != null ? p.stock_qty > 0 ? "in_stock" : "out_of_stock" : undefined),
            is_featured: true,
            warranty_years: 5,
          })));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProducts();
    return () => { isMounted = false; };
  }, []);

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))).sort(), [products]);
  const productIndex = useMemo(() => products.map(product => ({ product, facets: extractProductFacets(product) })), [products]);
  const facetOptions = useMemo(() => buildRetailFacets(productIndex, filters), [productIndex, filters]);
  const brandCounts = Object.fromEntries(facetOptions.brands.map(option => [option.value, option.count]));
  const filteredProducts = useMemo(() => productIndex.filter(item => matchesRetailFilters(item, filters)).map(item => item.product).sort((a, b) => {
    if (sortBy === "price-asc") return (a.numeric_price || Number.MAX_SAFE_INTEGER) - (b.numeric_price || Number.MAX_SAFE_INTEGER);
    if (sortBy === "price-desc") return (b.numeric_price || 0) - (a.numeric_price || 0);
    if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    return 0;
  }), [productIndex, filters, sortBy]);
  useEffect(() => { setCurrentPage(1); }, [filters, sortBy]);

  // Paginated View Slice
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const displayedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const catalogEl = document.getElementById("catalog-grid-top");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleResetFilters = () => {
    updateFilters(emptyRetailFilters(selectedCategory));
    setCurrentPage(1);
  };

  const handleCategorySelect = (catKey: string, scrollToCatalog = false) => {
    updateFilters(emptyRetailFilters(catKey === "all" ? null : catKey));
    setCurrentPage(1);
    if (scrollToCatalog) {
      setTimeout(() => {
        document.getElementById("catalog-grid-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Tioga Retail Store - Tier-1 Solar Inverters, Lithium Batteries & Smart Locks"
        description="Shop certified Tier-1 Deye Hybrid Inverters, Felicity LiFePO4 batteries, Longi panels, and smart biometric locks. Direct nationwide dispatch from Lagos & Abuja."
        path="/retail"
      />
      <SiteHeader />

      <main className="flex-1 section-padding py-4 sm:py-8 pt-[72px] sm:pt-[84px]">
        <div className="section-container-wide px-3 sm:px-6">
          {/* Hero Carousel */}
          <RetailHeroCarousel productCount={products.length} />

          {/* Flash Deals Urgency Bar */}
          <FlashDealsBar />

          {/* Quick Value Props Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-xs mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <Truck size={24} className="text-primary shrink-0" />
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">Fast Dispatch</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Lagos & Abuja 24h</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield size={24} className="text-gold-dark dark:text-gold shrink-0" />
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">5-Yr Warranty</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Replacement guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Award size={24} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">Tier-1 Stack</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Authorized distributor</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Zap size={24} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">0-Flicker UPS</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Seamless switchover</p>
              </div>
            </div>
          </div>

          {/* Category Cards Grid Showcase */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-1.5">
                  Hardware Categories
                </p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
                  Shop By Category
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                  Select a hardware category to browse dedicated products and solutions.
                </p>
              </div>

              {selectedCategory && (
                <button
                  onClick={() => handleCategorySelect("all", true)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto py-1.5 px-3.5 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/25 shadow-xs"
                >
                  <span>Showing: <strong>{selectedCategory}</strong></span>
                  <span className="text-muted-foreground underline ml-1">View All Hardware</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 sm:gap-6">
              {RETAIL_CATEGORY_CARDS.map((cat) => {
                const isSelected = selectedCategory?.toLowerCase() === cat.key.toLowerCase();
                return (
                  <div
                    key={cat.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCategorySelect(cat.key, true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCategorySelect(cat.key, true);
                      }
                    }}
                    className={`group relative flex items-center justify-between p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-300 text-left border overflow-hidden ${
                      isSelected
                        ? "bg-primary/[0.08] dark:bg-primary/15 border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/40"
                        : "bg-gradient-to-br from-[#f8f9fb] via-[#f1f3f6] to-[#e8ebef] dark:from-slate-900/90 dark:via-slate-900/75 dark:to-slate-800/80 hover:from-white hover:to-[#e2e5e9] dark:hover:from-slate-800/90 dark:hover:to-slate-800/60 border-slate-200/90 dark:border-slate-800/80 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                    }`}
                  >
                    {/* Ambient subtle concentric wave rings background (matching reference) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.35] dark:opacity-[0.12] transition-opacity duration-500 group-hover:opacity-60">
                      <svg
                        className="absolute -right-16 -top-12 sm:-right-8 sm:-top-8 w-[320px] h-[320px] text-slate-400/50 dark:text-slate-500/30"
                        viewBox="0 0 200 200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="130" cy="90" r="30" strokeDasharray="3 3" opacity="0.35" />
                        <circle cx="130" cy="90" r="55" opacity="0.45" />
                        <circle cx="130" cy="90" r="80" opacity="0.55" />
                        <circle cx="130" cy="90" r="105" opacity="0.65" />
                        <circle cx="130" cy="90" r="130" opacity="0.45" />
                        <circle cx="130" cy="90" r="155" opacity="0.25" />
                      </svg>
                    </div>

                    {/* Left details */}
                    <div className="relative z-10 flex-1 pr-3 min-w-0 flex flex-col justify-between self-stretch">
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                          {cat.tag}
                        </span>
                        <h3 className="font-display font-bold text-lg sm:text-xl text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                          {cat.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                          {cat.subtitle}
                        </p>
                      </div>

                      <div className="pt-2">
                        <span
                          className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-sm ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-primary/25 ring-2 ring-primary/40"
                              : "bg-[#43a047] hover:bg-[#388e3c] text-white shadow-emerald-600/20 group-hover:scale-105 active:scale-95"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check size={15} className="stroke-[3]" />
                              <span>Active Filter</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={15} className="shrink-0" />
                              <span>Shop Now</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right hardware floating 3D PNG */}
                    <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 shrink-0 flex items-center justify-center pointer-events-none">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_16px_24px_rgba(0,0,0,0.6)] group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 ease-out"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Bar: Search, Mobile Filters, Sort, Grid/List */}
          <div id="catalog-grid-top" className="scroll-mt-24 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Bread Energy, Deye, Felicity, AlpSolarr, SolarPro, smart locks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 rounded-2xl bg-card border-border text-xs h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Right Controls */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Mobile Filter Drawer */}
              <div className="lg:hidden col-span-1">
                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 text-xs font-semibold w-full justify-center">
                      <SlidersHorizontal size={14} />
                      <span>Filters</span>
                      {(activeFilterCount > 0) && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[min(92vw,380px)] p-5 overflow-y-auto">
                    <SheetHeader className="pb-4 border-b border-border mb-4">
                      <SheetTitle className="text-base font-display font-bold">Filter Hardware</SheetTitle>
                      <SheetDescription>Combine filters to find the right products.</SheetDescription>
                    </SheetHeader>
                    <RetailFilterSidebar
                      filters={filters}
                      onChange={(next) => updateFilters(next, next.minPrice !== filters.minPrice || next.maxPrice !== filters.maxPrice)}
                      onCategoryChange={(category) => handleCategorySelect(category ?? "all")}
                      categories={categories}
                      brands={facetOptions.brands}
                      groups={facetOptions.groups}
                      maxPrice={facetOptions.maxPrice}
                      totalResults={filteredProducts.length}
                      onReset={handleResetFilters}
                    />
                    <div className="sticky bottom-0 mt-5 border-t bg-background pt-3"><Button className="w-full" onClick={() => setMobileFilterOpen(false)}>Show {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}</Button></div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Wishlist Link */}
              <Link
                to="/retail/wishlist"
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors w-full sm:w-auto"
              >
                <Heart size={14} className="text-red-500" />
                <span>Wishlist</span>
                <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {wishlistCount}
                </span>
              </Link>

              {/* Items Per Page Selector */}
              <div className="col-span-1 w-full sm:w-auto">
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full sm:w-28 shrink-0 bg-muted/30 rounded-xl text-xs font-medium h-10 justify-between">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="12" className="text-xs">12 / page</SelectItem>
                    <SelectItem value="24" className="text-xs">24 / page</SelectItem>
                    <SelectItem value="48" className="text-xs">48 / page</SelectItem>
                    <SelectItem value="96" className="text-xs">96 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Selector */}
              <div className="col-span-1 w-full sm:w-auto">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-full sm:w-36 bg-muted/30 rounded-xl text-xs font-medium h-10 justify-between">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="featured" className="text-xs">Featured</SelectItem>
                    <SelectItem value="price-asc" className="text-xs">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc" className="text-xs">Price: High to Low</SelectItem>
                    <SelectItem value="rating" className="text-xs">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Filter Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDesktopFilters((prev) => !prev)}
                className="hidden lg:inline-flex h-10 rounded-xl gap-2 text-xs font-semibold"
              >
                <SlidersHorizontal size={14} />
                <span>{showDesktopFilters ? "Hide Filters" : "Show Filters"}</span>
              </Button>

              {/* Column Grid Switcher (2, 3, 4, 5 columns, List View) */}
              <div className="hidden sm:flex items-center">
                <ColumnGridSwitcher
                  value={gridColumns}
                  onChange={setGridColumns}
                />
              </div>

              {/* Mobile 2-col / List View Toggle */}
              <div className="flex sm:hidden items-center border border-border rounded-xl bg-muted/30 p-0.5 h-10 col-span-1 justify-center">
                <button
                  type="button"
                  onClick={() => setGridColumns(2)}
                  aria-label="Grid View"
                  className={`p-2 rounded-lg transition-colors ${
                    gridColumns !== "list" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setGridColumns("list")}
                  aria-label="List View"
                  className={`p-2 rounded-lg transition-colors ${
                    gridColumns === "list" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Popular Brand Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
            <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">
              Popular Brands:
            </span>
            {[...facetOptions.brands].sort((a, b) => b.count - a.count).slice(0, 12).map(({ value: brand }) => {
              const isSelected = selectedBrands.includes(brand);
              const count = brandCounts[brand] || 0;
              return (
                <button
                  key={brand}
                  type="button"
                  disabled={!count && !isSelected}
                  onClick={() => {
                    setSelectedBrands((prev) =>
                      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
                    );
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                      : "bg-card hover:bg-muted text-foreground border-border"
                  }`}
                >
                  <span>{brand}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {isSelected && <X size={12} className="ml-0.5" />}
                </button>
              );
            })}
            {selectedBrands.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedBrands([])}
                className="text-xs text-primary hover:underline ml-2 shrink-0 font-medium"
              >
                Clear Brands ({selectedBrands.length})
              </button>
            )}
          </div>

          <section className="mb-5 space-y-3" aria-label="Selected product filters">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="font-display text-xl font-bold">{selectedCategory || "All hardware"}</h2><p role="status" aria-live="polite" data-testid="retail-results-count" className="text-sm text-muted-foreground">{loading ? "Loading products…" : filteredProducts.length + (filteredProducts.length === 1 ? " product" : " products")}</p></div>
              {activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={handleResetFilters}>Clear filters ({activeFilterCount})</Button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.brands.map(brand => <Button key={brand} variant="secondary" size="sm" className="h-auto max-w-full whitespace-normal text-left text-xs" aria-label={"Remove brand filter: " + brand} onClick={() => setSelectedBrands(previous => previous.filter(value => value !== brand))}>{brand}<X size={12} className="ml-1 shrink-0" /></Button>)}
              {Object.entries(filters.specs).flatMap(([key, values]) => (values ?? []).map(value => <Button key={key + value} variant="secondary" size="sm" className="h-auto max-w-full whitespace-normal text-left text-xs" aria-label={"Remove " + FACET_LABELS[key as keyof typeof FACET_LABELS] + " filter: " + value} onClick={() => updateFilters({ ...filters, specs: { ...filters.specs, [key]: values?.filter(item => item !== value) } })}>{FACET_LABELS[key as keyof typeof FACET_LABELS]}: {value}<X size={12} className="ml-1 shrink-0" /></Button>))}
              {filters.minPrice !== null && <Button variant="secondary" size="sm" aria-label="Remove minimum price filter" onClick={() => updateFilters({ ...filters, minPrice: null })}>From ₦{filters.minPrice.toLocaleString()}<X size={12} className="ml-1" /></Button>}
              {filters.maxPrice !== null && <Button variant="secondary" size="sm" aria-label="Remove maximum price filter" onClick={() => updateFilters({ ...filters, maxPrice: null })}>Up to ₦{filters.maxPrice.toLocaleString()}<X size={12} className="ml-1" /></Button>}
              {filters.inStockOnly && <Button variant="secondary" size="sm" onClick={() => updateFilters({ ...filters, inStockOnly: false })}>In stock only<X size={12} className="ml-1" /></Button>}
              {filters.search && <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")}>Search: {filters.search}<X size={12} className="ml-1" /></Button>}
            </div>
          </section>
          {/* Main Layout */}
          <div className={`grid grid-cols-1 ${showDesktopFilters ? "lg:grid-cols-4" : "lg:grid-cols-1"} gap-8`}>
            {/* Desktop Filter Sidebar */}
            {showDesktopFilters && (
              <div className="hidden lg:block lg:col-span-1">
                <div role="region" aria-label="Product filters" className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5 rounded-3xl bg-card border border-border/80 shadow-[var(--shadow-card)]">
                  <RetailFilterSidebar
                      filters={filters}
                      onChange={(next) => updateFilters(next, next.minPrice !== filters.minPrice || next.maxPrice !== filters.maxPrice)}
                      onCategoryChange={(category) => handleCategorySelect(category ?? "all")}
                      categories={categories}
                      brands={facetOptions.brands}
                      groups={facetOptions.groups}
                      maxPrice={facetOptions.maxPrice}
                      totalResults={filteredProducts.length}
                      onReset={handleResetFilters}
                    />
                </div>
              </div>
            )}

            {/* Product Cards Grid with Pagination */}
            <div className={showDesktopFilters ? "min-w-0 lg:col-span-3" : "min-w-0 lg:col-span-1"}>
              {loading ? (
                <div className="py-20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border p-6 space-y-3">
                  <div className="p-4 rounded-full bg-muted w-14 h-14 mx-auto flex items-center justify-center text-muted-foreground">
                    <Search size={22} />
                  </div>
                  <h3 className="text-base font-display font-bold text-foreground">No Products Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    We couldn't find any products matching your specific filters. Try clearing your filters or search query.
                  </p>
                  <Button onClick={handleResetFilters} variant="outline" className="rounded-xl font-bold text-xs gap-1.5">
                    <RotateCcw size={13} />
                    Reset All Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    data-testid="retail-product-grid"
                    className={`grid ${getGridGapClass(gridColumns)} ${getGridColsClass(gridColumns)}`}
                  >
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={setQuickViewProduct}
                        layout={gridColumns === "list" ? "list" : "grid"}
                        columns={gridColumns}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)]">
                      <p className="text-xs text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-semibold text-foreground">{filteredProducts.length}</span> hardware products
                      </p>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="h-9 px-3 text-xs rounded-xl gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronLeft size={14} />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>

                        {/* Page Numbers 1...N */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${
                                    currentPage === pageNum
                                      ? "bg-primary text-primary-foreground shadow-md"
                                      : "border border-border bg-card hover:bg-muted text-foreground"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                            if (
                              (pageNum === 2 && currentPage > 3) ||
                              (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                            ) {
                              return (
                                <span key={pageNum} className="px-1 text-xs text-muted-foreground font-mono">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="h-9 px-3 text-xs rounded-xl gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      />

      <SiteFooter />
    </div>
  );
};

export default Retail;
