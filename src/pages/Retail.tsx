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
import { ProductFilterSidebar } from "@/components/retail/ProductFilterSidebar";
import { ProductCard } from "@/components/retail/ProductCard";
import { QuickViewModal } from "@/components/retail/QuickViewModal";
import { ProductCompareTray } from "@/components/retail/ProductCompareTray";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { inferBrand, normalizeCategory } from "@/lib/productBrand";
import { mergeProducts } from "@/lib/mergeProducts";
import type { RetailProduct } from "@/types/retail";

import { ArrowRight, Check } from "lucide-react";

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
    tag: "STAMA Flagship",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<RetailProduct | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { count: wishlistCount } = useWishlist();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // Filter State
  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam || null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15_000_000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setCurrentPage(1);
    }
  }, [categoryParam]);

  // Load products
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("sort_order", { ascending: true });

        // 1. Map static catalog
        const staticList: RetailProduct[] = STATIC_PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          category: normalizeCategory(p.category),
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
          rating: p.rating || 5.0,
          review_count: p.review_count || 14,
          stock_status: (p.stock_status as any) || "in_stock",
          is_featured: p.is_featured ?? true,
          warranty_years: p.warranty_years || 5,
        }));

        // 2. Map database rows if available
        let dbList: RetailProduct[] = [];
        if (!error && data && data.length > 0) {
          dbList = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: normalizeCategory(p.category),
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
            rating: 5.0,
            review_count: 14,
            stock_status: "in_stock",
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
            category: normalizeCategory(p.category),
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
            rating: p.rating || 5.0,
            review_count: p.review_count || 14,
            stock_status: (p.stock_status as any) || "in_stock",
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

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[])), [products]);
  const capacities = useMemo(() => ["3kVA", "5kVA", "8kVA", "10kVA", "15kVA", "5.12kWh", "10.24kWh", "550W"], []);

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && selectedCategory !== "all") {
        const sel = selectedCategory.toLowerCase();
        const pCat = p.category.toLowerCase();
        const matches =
          pCat === sel ||
          pCat.includes(sel) ||
          sel.includes(pCat) ||
          (sel.includes("switch") && pCat.includes("switch")) ||
          (sel.includes("lock") && pCat.includes("lock")) ||
          ((sel.includes("camera") || sel.includes("cctv")) && (pCat.includes("camera") || pCat.includes("cctv"))) ||
          ((sel.includes("audio") || sel.includes("sound") || sel.includes("intercom")) && (pCat.includes("audio") || pCat.includes("sound") || pCat.includes("intercom"))) ||
          ((sel.includes("curtain") || sel.includes("motor") || sel.includes("shading")) && (pCat.includes("curtain") || pCat.includes("motor") || pCat.includes("shading") || pCat.includes("blind"))) ||
          (sel.includes("light") && pCat.includes("light")) ||
          (sel.includes("panel") && pCat.includes("panel") && !pCat.includes("solar") && !sel.includes("solar")) ||
          (sel.includes("solar") && pCat.includes("solar")) ||
          (sel.includes("battery") && pCat.includes("batter")) ||
          (sel.includes("inverter") && pCat.includes("inverter")) ||
          ((sel.includes("gateway") || sel.includes("network")) && (pCat.includes("gateway") || pCat.includes("network") || pCat.includes("mesh"))) ||
          (sel.includes("sensor") && pCat.includes("sensor"));
        if (!matches) return false;
      }
      if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) {
        return false;
      }
      if (selectedCapacities.length > 0) {
        const matchesCap = selectedCapacities.some((c) =>
          p.name.toLowerCase().includes(c.toLowerCase()) ||
          JSON.stringify(p.specifications || {}).toLowerCase().includes(c.toLowerCase())
        );
        if (!matchesCap) return false;
      }
      if (p.numeric_price && (p.numeric_price < priceRange[0] || p.numeric_price > priceRange[1])) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.series && p.series.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return (a.numeric_price || 0) - (b.numeric_price || 0);
      if (sortBy === "price-desc") return (b.numeric_price || 0) - (a.numeric_price || 0);
      if (sortBy === "rating") return (b.rating || 5) - (a.rating || 5);
      return 0;
    });
  }, [products, selectedCategory, selectedBrands, selectedCapacities, priceRange, searchQuery, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrands, selectedCapacities, priceRange, searchQuery, sortBy]);

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
    setSelectedCategory(null);
    setSelectedBrands([]);
    setSelectedCapacities([]);
    setPriceRange([0, 15_000_000]);
    setInStockOnly(false);
    setSearchQuery("");
    setSearchParams({});
    setCurrentPage(1);
  };

  const handleCategorySelect = (catKey: string, scrollToCatalog = false) => {
    if (catKey === "all") {
      setSelectedCategory(null);
      setSearchParams({});
    } else {
      setSelectedCategory(catKey);
      setSearchParams({ category: catKey });
    }
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
        description="Shop certified Tier-1 Deye Hybrid Inverters, Felicity LiFePO4 batteries, Longi panels, and STAMA smart biometric locks. Direct nationwide dispatch from Lagos & Abuja."
        path="/retail"
      />
      <SiteHeader />

      <main className="flex-1 section-padding py-4 sm:py-8 pt-[72px] sm:pt-[84px]">
        <div className="section-container px-3 sm:px-6">
          {/* Hero Carousel */}
          <RetailHeroCarousel productCount={products.length} />

          {/* Flash Deals Urgency Bar */}
          <FlashDealsBar />

          {/* Quick Value Props Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-xs mb-6 sm:mb-8">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Truck size={18} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">Fast Dispatch</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Lagos & Abuja 24h</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gold/10 text-gold-dark dark:text-gold shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">5-Yr Warranty</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Replacement guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
                <Award size={18} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">Tier-1 Stack</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Authorized distributor</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Zap size={18} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">0-Flicker UPS</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Seamless switchover</p>
              </div>
            </div>
          </div>

          {/* Category Cards Grid Showcase */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide uppercase mb-1">
                  <span>Hardware Categories</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                  Shop By Category
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a hardware category to browse dedicated products and solutions.
                </p>
              </div>

              {selectedCategory && (
                <button
                  onClick={() => handleCategorySelect("all", true)}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto py-1 px-3 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20"
                >
                  <span>Showing: <strong>{selectedCategory}</strong></span>
                  <span className="text-muted-foreground underline">View All Hardware</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                    className={`group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-300 text-left border ${
                      isSelected
                        ? "bg-primary/[0.07] dark:bg-primary/10 border-primary shadow-md shadow-primary/10 ring-2 ring-primary/30"
                        : "bg-card/90 hover:bg-card border-border/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Left details */}
                    <div className="flex-1 pr-2 min-w-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        {cat.tag}
                      </span>
                      <h3 className="font-display font-bold text-sm sm:text-base text-foreground leading-snug truncate group-hover:text-primary transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5 mb-3">
                        {cat.subtitle}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs group-hover:gap-1.5"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check size={12} className="stroke-[3]" />
                            <span>Active Filter</span>
                          </>
                        ) : (
                          <>
                            <span>Shop Now</span>
                            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                    </div>

                    {/* Right hardware PNG thumbnail */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                      <div
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br transition-opacity duration-300 ${
                          isSelected
                            ? "from-primary/15 to-transparent opacity-100"
                            : "from-muted/50 to-transparent opacity-60 group-hover:opacity-100"
                        }`}
                      />
                      <img
                        src={cat.image}
                        alt={cat.title}
                        loading="lazy"
                        className="relative z-10 w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Bar: Search, Mobile Filters, Sort, Grid/List */}
          <div id="catalog-grid-top" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Deye inverters, Felicity batteries, smart locks..."
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
                      {(selectedBrands.length > 0 || selectedCapacities.length > 0 || selectedCategory) && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[360px] p-6 overflow-y-auto">
                    <SheetHeader className="pb-4 border-b border-border mb-4">
                      <SheetTitle className="text-base font-display font-bold">Filter Hardware</SheetTitle>
                    </SheetHeader>
                    <ProductFilterSidebar
                      filters={{
                        category: selectedCategory,
                        brands: selectedBrands,
                        capacities: selectedCapacities,
                        priceRange,
                        inStockOnly,
                        tier: null,
                      }}
                      onChange={(f) => {
                        setSelectedCategory(f.category);
                        setSelectedBrands(f.brands);
                        setSelectedCapacities(f.capacities);
                        setPriceRange(f.priceRange);
                        setInStockOnly(f.inStockOnly);
                      }}
                      categories={categories}
                      brands={brands}
                      capacities={capacities}
                      maxPrice={15_000_000}
                      totalResults={filteredProducts.length}
                      onReset={handleResetFilters}
                    />
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

              {/* Grid / List View Toggle */}
              <div className="hidden md:flex items-center border border-border rounded-xl bg-muted/30 p-0.5 h-10">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid View"
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List View"
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 p-6 rounded-3xl bg-card border border-border/80 shadow-[var(--shadow-card)]">
                <ProductFilterSidebar
                  filters={{
                    category: selectedCategory,
                    brands: selectedBrands,
                    capacities: selectedCapacities,
                    priceRange,
                    inStockOnly,
                    tier: null,
                  }}
                  onChange={(f) => {
                    setSelectedCategory(f.category);
                    setSelectedBrands(f.brands);
                    setSelectedCapacities(f.capacities);
                    setPriceRange(f.priceRange);
                    setInStockOnly(f.inStockOnly);
                  }}
                  categories={categories}
                  brands={brands}
                  capacities={capacities}
                  maxPrice={15_000_000}
                  totalResults={filteredProducts.length}
                  onReset={handleResetFilters}
                />
              </div>
            </div>

            {/* Product Cards Grid with Pagination */}
            <div className="lg:col-span-3">
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
                    className={`grid gap-4 sm:gap-6 ${
                      viewMode === "grid"
                        ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                        : "grid-cols-1"
                    }`}
                  >
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={setQuickViewProduct}
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

      {/* Floating Comparison Tray */}
      <ProductCompareTray />

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
