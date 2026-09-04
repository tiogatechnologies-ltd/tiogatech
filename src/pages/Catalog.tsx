import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Check,
  ShoppingBag,
  Sliders,
  Filter,
  ArrowRight,
  Package,
  Cpu,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { ProductCard } from "@/components/retail/ProductCard";
import { ProductFilterSidebar } from "@/components/retail/ProductFilterSidebar";
import { QuickViewModal } from "@/components/retail/QuickViewModal";
import { ProductCompareTray } from "@/components/retail/ProductCompareTray";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { inferBrand } from "@/lib/productBrand";
import type { RetailProduct } from "@/types/retail";
import { breadcrumbJsonLd } from "@/lib/seoSchema";
import { toast } from "sonner";

type SortOption = "ai-rank" | "featured" | "price-asc" | "price-desc" | "rating";

interface AIRecommendation {
  recommendedProducts: string[];
  recommendedCombo?: string;
  reason: string;
  budgetFit?: string;
  tip?: string;
}

export const Catalog = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { add: addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = (location.state || {}) as any;

  // AI & Questionnaire State
  const hasState = Boolean(state && (state.category || state.totalWatts || state.appliances || state.budget || state.fullName));
  const userName = state.fullName || state.name || state.userName || "";
  const totalWatts = state.totalWatts || 0;
  const selectedAppliances = state.selectedAppliances || state.appliances || [];
  const budget = state.budget || "";
  const formContext = state.formContext || state;

  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Catalog Products & UI State
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>(hasState ? "ai-rank" : "featured");
  const [quickViewProduct, setQuickViewProduct] = useState<RetailProduct | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { count: wishlistCount } = useWishlist();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filter State: Default to "ai-picks" when arriving from assessment questionnaire
  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryParam || (hasState ? "ai-picks" : null)
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15_000_000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Dynamic Category Tabs with AI Recommended as First Tab
  const categoryTabs = useMemo(() => {
    const list = [];
    if (hasState || aiRec) {
      list.push({
        key: "ai-picks",
        label: "✨ AI Top Recommendations",
        icon: Sparkles,
        isAi: true,
      });
    }
    list.push(
      { key: "all", label: "All Hardware", icon: Zap, isAi: false },
      { key: "Inverters", label: "Inverters", icon: Zap, isAi: false },
      { key: "Batteries", label: "LiFePO4 Batteries", icon: Battery, isAi: false },
      { key: "Solar Panels", label: "Solar Panels", icon: Zap, isAi: false },
      { key: "Smart Locks", label: "Smart Locks", icon: Lock, isAi: false },
      { key: "Home Automation", label: "Home IoT", icon: HomeIcon, isAi: false },
      { key: "CCTV", label: "CCTV & Cameras", icon: Camera, isAi: false }
    );
    return list;
  }, [hasState, aiRec]);

  // Load products
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        const staticList: RetailProduct[] = STATIC_PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
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

        let dbList: RetailProduct[] = [];
        if (!error && data && data.length > 0) {
          dbList = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            series: p.series,
            description: p.description,
            features: Array.isArray(p.features) ? p.features : [],
            best_for: p.best_for || "Residential and commercial backup",
            price: p.price,
            numeric_price: Number(p.price?.replace(/[^\d.]/g, "") || 0),
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

        const productMap = new Map<string, RetailProduct>();
        staticList.forEach((item) => productMap.set(item.id, item));
        dbList.forEach((item) => productMap.set(item.id, item));

        const combined = Array.from(productMap.values());
        if (isMounted) setProducts(combined);
      } catch {
        if (isMounted) {
          setProducts(
            STATIC_PRODUCTS.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
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
            }))
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch AI recommendations if state provided
  useEffect(() => {
    if (!hasState) return;
    setAiLoading(true);
    supabase.functions
      .invoke("ai-recommend", {
        body: {
          category: state.category,
          appliances: selectedAppliances,
          totalWatts,
          budget,
          systemType: state.systemType,
          propertyType: state.propertyType,
          usageDuration: state.usageDuration,
          formContext,
        },
      })
      .then(({ data, error }) => {
        if (!error && data) {
          setAiRec(data as AIRecommendation);
        }
      })
      .catch(console.error)
      .finally(() => setAiLoading(false));
  }, [hasState, state.category, totalWatts]);

  // AI rank matching — computed once per (products, aiRec) change into a lookup map,
  // instead of re-scanning aiRec.recommendedProducts for every product on every render.
  const computeAiPickRank = (product: RetailProduct): number => {
    if (!aiRec?.recommendedProducts?.length) {
      // Fallback matching by wattage or load if in recommendation state
      if (hasState && totalWatts > 0) {
        if (totalWatts <= 4000 && product.name.includes("5kW")) return 1;
        if (totalWatts > 4000 && totalWatts <= 8000 && (product.name.includes("8kW") || product.name.includes("10kW"))) return 1;
        if (totalWatts > 8000 && (product.name.includes("12kW") || product.name.includes("15kVA"))) return 1;
      }
      return -1;
    }
    const pName = product.name.toLowerCase().trim();
    const idx = aiRec.recommendedProducts.findIndex((rp) => {
      const matchName = rp.toLowerCase().trim();
      return pName.includes(matchName) || matchName.includes(pName);
    });
    return idx >= 0 ? idx + 1 : -1;
  };

  const aiPickRankMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.id, computeAiPickRank(p)));
    return map;
  }, [products, aiRec, hasState, totalWatts]);

  const getAiPickRank = (product: RetailProduct): number => aiPickRankMap.get(product.id) ?? -1;

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[])), [products]);
  const capacities = useMemo(() => ["3kVA", "5kVA", "8kVA", "10kVA", "15kVA", "5.12kWh", "10.24kWh", "550W"], []);

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // AI Picks filter tab
        if (selectedCategory === "ai-picks") {
          const rank = getAiPickRank(p);
          if (rank === -1) return false;
        } else if (selectedCategory && selectedCategory !== "all" && !p.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }

        if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) {
          return false;
        }
        if (selectedCapacities.length > 0) {
          const matchesCap = selectedCapacities.some(
            (c) =>
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
            (p.brand && p.brand.toLowerCase().includes(q));
          if (!matchesSearch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "ai-rank") {
          const rankA = getAiPickRank(a);
          const rankB = getAiPickRank(b);
          if (rankA !== -1 && rankB !== -1) return rankA - rankB;
          if (rankA !== -1) return -1;
          if (rankB !== -1) return 1;
        }
        if (sortBy === "price-asc") return (a.numeric_price || 0) - (b.numeric_price || 0);
        if (sortBy === "price-desc") return (b.numeric_price || 0) - (a.numeric_price || 0);
        if (sortBy === "rating") return (b.rating || 5) - (a.rating || 5);
        return 0;
      });
  }, [
    products,
    selectedCategory,
    selectedBrands,
    selectedCapacities,
    priceRange,
    searchQuery,
    sortBy,
    aiRec,
    hasState,
  ]);

  // AI Recommended Products subset (for dedicated top rail)
  const aiRecommendedProducts = useMemo(() => {
    return products
      .filter((p) => getAiPickRank(p) !== -1)
      .sort((a, b) => getAiPickRank(a) - getAiPickRank(b));
  }, [products, aiRec, hasState]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrands, selectedCapacities, priceRange, searchQuery, sortBy]);

  // Paginated Slice
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
    setSelectedCategory(hasState ? "ai-picks" : null);
    setSelectedBrands([]);
    setSelectedCapacities([]);
    setPriceRange([0, 15_000_000]);
    setInStockOnly(false);
    setSearchQuery("");
    setSearchParams({});
    setCurrentPage(1);
  };

  const handleCategorySelect = (catKey: string) => {
    if (catKey === "all") {
      setSelectedCategory(null);
      setSearchParams({});
    } else {
      setSelectedCategory(catKey);
      setSearchParams({ category: catKey });
    }
    setCurrentPage(1);
  };

  const handleAddAllAiPicksToCart = () => {
    if (!aiRecommendedProducts.length) return;
    aiRecommendedProducts.forEach((prod) => {
      addToCart({
        refId: prod.id,
        type: "product",
        name: prod.name,
        price: prod.price,
        numericPrice: prod.numeric_price,
        image: prod.image_url,
        category: prod.category,
        quantity: 1,
      });
    });
    toast.success("Added all recommended items to cart!", {
      description: `${aiRecommendedProducts.length} matched system components added.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={hasState ? "Your Tailored Hardware Recommendation — Tioga Store" : "Tioga Store & Hardware Catalog"}
        description="Explore tailored renewable energy, lithium battery storage, and smart home biometric access systems matching your load assessment."
        path="/catalog"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Catalog", path: "/catalog" }]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Tioga Hardware Catalog & AI Store",
            description: "Full Tioga product catalog: solar inverters, batteries, smart locks, home automation.",
            url: "https://tiogatechnologies.com/catalog",
          },
        ]}
      />
      <SiteHeader />

      <main className="flex-1 section-padding py-4 sm:py-8 pt-[72px] sm:pt-[84px]">
        <div className="section-container px-3 sm:px-6">
          {/* Top Hero Banner */}
          <div className="mb-6 sm:mb-8 p-6 sm:p-8 rounded-3xl bg-secondary text-secondary-foreground shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-1 text-xs text-secondary-foreground/70 hover:text-secondary-foreground transition-colors mb-1"
                >
                  <ArrowLeft size={13} /> Back to Home
                </button>
                <h1 className="text-2xl sm:text-4xl font-display font-bold leading-tight">
                  {hasState ? (
                    <>
                      {userName ? `${userName}, here is` : "Here is"} your{" "}
                      <span className="text-accent">tailored hardware selection</span>
                    </>
                  ) : (
                    <>
                      Shop the <span className="text-accent">Tioga Store</span>
                    </>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-secondary-foreground/80 max-w-2xl leading-relaxed">
                  {hasState
                    ? "Based on your load assessment, we have filtered certified Tier-1 hybrid inverters, lithium batteries, and smart home IoT hardware sized specifically for your property."
                    : "Direct warehouse supply of Tier-1 solar inverters, LiFePO4 batteries, STAMA biometric smart locks, and home IoT devices."}
                </p>
              </div>

              {totalWatts > 0 && (
                <div className="p-4 rounded-2xl bg-secondary-foreground/10 border border-secondary-foreground/15 shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-secondary-foreground/70 font-semibold mb-1">
                    Assessed Load
                  </p>
                  <p className="text-xl sm:text-2xl font-display font-bold text-accent">
                    {totalWatts.toLocaleString()}W
                  </p>
                  <p className="text-[10px] text-secondary-foreground/70">Continuous peak demand</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendation Summary Box */}
          {(aiLoading || aiRec) && (
            <div className="mb-6 sm:mb-8 rounded-3xl border border-primary/25 bg-card p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                      Engineering Recommendation
                    </h3>
                    <p className="text-xs text-muted-foreground">Custom-matched equipment profile</p>
                  </div>
                </div>

                {aiRecommendedProducts.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAddAllAiPicksToCart}
                    className="h-9 text-xs rounded-xl gap-1.5 font-bold shadow-sm"
                  >
                    <ShoppingBag size={13} />
                    <span>Add Entire Matched System to Cart</span>
                  </Button>
                )}
              </div>

              {aiLoading ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>Synthesizing load metrics and computing optimal inverter-battery ratio...</span>
                </div>
              ) : aiRec ? (
                <div className="grid md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-8 space-y-3">
                    {aiRec.recommendedCombo && (
                      <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center gap-2">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>Recommended System Combo: {aiRec.recommendedCombo}</span>
                      </div>
                    )}
                    <p className="text-xs text-foreground/90 leading-relaxed">{aiRec.reason}</p>

                    {aiRec.recommendedProducts?.length > 0 && (
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mr-1">
                          Priority Matches:
                        </span>
                        {aiRec.recommendedProducts.map((pName, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted border border-border text-[11px] font-bold text-foreground"
                          >
                            <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-mono">
                              {i + 1}
                            </span>
                            <span>{pName}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4 p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
                    {aiRec.budgetFit && (
                      <div>
                        <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Budget Alignment</p>
                        <p className="text-foreground mt-0.5">{aiRec.budgetFit}</p>
                      </div>
                    )}
                    {aiRec.tip && (
                      <div className="pt-2 border-t border-border">
                        <p className="font-bold text-[10px] uppercase tracking-wider text-primary">Pro Tip</p>
                        <p className="text-muted-foreground mt-0.5">{aiRec.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Quick Value Props Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-xs mb-6 sm:mb-8">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Truck size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">Fast Dispatch</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Lagos & Abuja 24h</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-muted text-foreground shrink-0">
                <Shield size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">5-Yr Warranty</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Replacement guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Award size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">Tier-1 Stack</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Authorized distributor</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground leading-tight">0-Flicker UPS</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">Seamless switchover</p>
              </div>
            </div>
          </div>

          {/* Categorized Tabs — With AI Top Recommendations as FIRST Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              const active =
                tab.key === "all"
                  ? selectedCategory === null || selectedCategory === "all"
                  : selectedCategory === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => handleCategorySelect(tab.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                    active
                      ? tab.isAi
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02] ring-2 ring-primary/40"
                        : "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                      : tab.isAi
                      ? "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 font-bold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={14} className={tab.isAi ? "animate-pulse" : ""} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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
            <div className="flex items-center gap-2">
              {/* Mobile Filter Drawer */}
              <div className="lg:hidden">
                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 text-xs font-semibold">
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
                        category: selectedCategory === "ai-picks" ? null : selectedCategory,
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
                className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
              >
                <Heart size={14} className="text-red-500" />
                <span className="hidden sm:inline">Wishlist</span>
                <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {wishlistCount}
                </span>
              </Link>

              {/* Items Per Page Selector */}
              <Select
                value={String(itemsPerPage)}
                onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-24 bg-muted/30 rounded-xl text-xs font-medium h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="9" className="text-xs">9 / page</SelectItem>
                  <SelectItem value="12" className="text-xs">12 / page</SelectItem>
                  <SelectItem value="18" className="text-xs">18 / page</SelectItem>
                  <SelectItem value="24" className="text-xs">24 / page</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Selector */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-36 bg-muted/30 rounded-xl text-xs font-medium h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {hasState && <SelectItem value="ai-rank" className="text-xs">AI Match Rank</SelectItem>}
                  <SelectItem value="featured" className="text-xs">Featured</SelectItem>
                  <SelectItem value="price-asc" className="text-xs">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc" className="text-xs">Price: High to Low</SelectItem>
                  <SelectItem value="rating" className="text-xs">Top Rated</SelectItem>
                </SelectContent>
              </Select>

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
                    category: selectedCategory === "ai-picks" ? null : selectedCategory,
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
                  {/* If viewing AI Top Picks, show dedicated section banner */}
                  {selectedCategory === "ai-picks" && (
                    <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Sparkles size={16} />
                        <span>Showing {filteredProducts.length} hardware components matched to your load</span>
                      </div>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs text-muted-foreground hover:text-foreground font-semibold underline"
                      >
                        View All Categories
                      </button>
                    </div>
                  )}

                  <div
                    className={`grid gap-4 sm:gap-6 ${
                      viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                    }`}
                  >
                    {displayedProducts.map((product) => {
                      const rank = getAiPickRank(product);
                      const customBadge = rank !== -1 ? `#${rank} AI Match` : undefined;

                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onQuickView={setQuickViewProduct}
                          customBadge={customBadge}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)]">
                      <p className="text-xs text-muted-foreground">
                        Showing{" "}
                        <span className="font-semibold text-foreground">
                          {(currentPage - 1) * itemsPerPage + 1}–
                          {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                        </span>{" "}
                        of <span className="font-semibold text-foreground">{filteredProducts.length}</span> hardware products
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

                        {/* Page Numbers */}
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

export default Catalog;
