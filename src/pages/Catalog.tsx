import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft, ChevronDown, ChevronUp, Zap, Sparkles, Loader2, Expand } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const trackProductClick = (productId: string) => {
  const sessionId = sessionStorage.getItem("_tid_session") || "unknown";
  supabase.from("product_clicks").insert({ product_id: productId, session_id: sessionId }).then(() => {});
};
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const WHATSAPP = "https://wa.me/2348178000023";
const PRODUCTS_PER_PAGE = 15;

interface Product {
  id: string;
  name: string;
  category: string;
  series: string | null;
  description: string;
  features: string[];
  best_for: string;
  price: string | null;
  tier: string;
  image_url: string | null;
  specifications: Record<string, string> | null;
  tags: string[] | null;
}

interface AIRecommendation {
  recommendedProducts: string[];
  recommendedCombo?: string;
  reason: string;
  budgetFit: string;
  tip: string;
  // legacy
  recommendedPackage?: string;
  alternativePackage?: string;
}

const tierColors: Record<string, string> = {
  premium: "bg-accent/15 text-accent-foreground border-accent/30",
  mid: "bg-primary/10 text-primary border-primary/30",
  affordable: "bg-muted text-muted-foreground border-border",
  entry: "bg-background text-muted-foreground border-border",
};

const tierLabels: Record<string, string> = {
  premium: "Premium",
  mid: "Mid-tier",
  affordable: "Affordable",
  entry: "Entry Level",
};

function getTierOrder(budget?: string): string[] {
  if (budget === "₦3M+" || budget === "₦1M to ₦3M") return ["premium", "mid", "affordable", "entry"];
  if (budget === "Below ₦500k") return ["entry", "affordable", "mid", "premium"];
  return ["mid", "premium", "affordable", "entry"];
}

// Map form interests to DB categories
const CATEGORY_MAP: Record<string, string> = {
  solar: "solar",
  panels: "solar",
  batteries: "solar",
  full_solar: "solar",
  smartlocks: "smart_locks",
  smarthome: "smarthome",
  cctv: "cctv",
};

const CATEGORY_LABELS: Record<string, string> = {
  solar: "Solar Products",
  smart_locks: "Smart Locks",
  smarthome: "Smart Home",
  cctv: "CCTV & Security",
};

const ProductCard = ({ product, isRecommended, pickNumber, gallery }: { product: Product; isRecommended?: boolean; pickNumber?: number; gallery?: string[] }) => {
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const waMsg = encodeURIComponent(`Hi, I'm interested in the ${product.name}${product.price ? ` (${product.price})` : ""}`);
  const isCombo = product.tags?.includes("combo") || product.series?.includes("Combo");

  // Build a clean image list: prefer gallery, else fall back to product.image_url
  const allImages = (gallery && gallery.length ? gallery : [product.image_url ?? ""])
    .map((u) => (u ?? "").trim())
    .filter(Boolean);
  const hasImage = allImages.length > 0 && !imgFailed;
  const safeIdx = Math.min(activeIdx, Math.max(0, allImages.length - 1));

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart == null || allImages.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setActiveIdx((i) => (i + 1) % allImages.length);
      else setActiveIdx((i) => (i - 1 + allImages.length) % allImages.length);
    }
    setTouchStart(null);
  };

  return (
    <div className={`rounded-2xl border shadow-sm hover:shadow-md transition-all duration-500 ios-ease overflow-hidden flex flex-col ${
      isRecommended ? "border-primary ring-2 ring-primary/20" : "border-border"
    } bg-card`}>
      {isRecommended && (
        <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1 flex items-center justify-center gap-1">
          <Sparkles size={12} /> {isCombo ? "Recommended Package" : pickNumber ? `AI Pick #${pickNumber}` : "AI Recommended"}
        </div>
      )}
      {hasImage && (
        <div
          className="relative h-32 sm:h-40 bg-muted overflow-hidden group cursor-zoom-in select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => setLightbox(true)}
        >
          <img
            key={allImages[safeIdx]}
            src={allImages[safeIdx]}
            alt=""
            onError={() => setImgFailed(true)}
            draggable={false}
            className="w-full h-full object-cover transition-opacity duration-500 ios-ease"
          />
          <span className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-card/80 backdrop-blur text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Expand size={13} />
          </span>
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + allImages.length) % allImages.length); }}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/85 hover:bg-card text-foreground shadow-md flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % allImages.length); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/85 hover:bg-card text-foreground shadow-md flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                ›
              </button>
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 rounded-full bg-foreground/40 backdrop-blur-sm">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                    className={`h-1.5 rounded-full transition-all ${i === safeIdx ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {lightbox && hasImage && (
        <ImageLightbox images={allImages} startIndex={safeIdx} onClose={() => setLightbox(false)} alt={product.name} />
      )}

      <div className="p-3 sm:p-4 flex-1 flex flex-col gap-2 sm:gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-card-foreground text-sm sm:text-base leading-tight">{product.name}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${tierColors[product.tier] ?? tierColors.entry}`}>
            {tierLabels[product.tier] ?? product.tier}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{product.description}</p>

        <span className="text-xs font-medium text-primary">Best for: {product.best_for}</span>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {Object.entries(product.specifications).slice(0, expanded ? undefined : 2).map(([key, val]) => (
              <div key={key} className="bg-muted/50 rounded px-1.5 py-0.5">
                <span className="text-muted-foreground">{key}:</span> <span className="font-medium text-foreground">{val}</span>
              </div>
            ))}
          </div>
        )}

        <ul className="text-xs text-muted-foreground space-y-1">
          {product.features.slice(0, expanded ? undefined : 2).map((f) => (
            <li key={f} className="flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span> {f}
            </li>
          ))}
        </ul>

        {(product.features.length > 2 || (product.specifications && Object.keys(product.specifications).length > 2)) && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-medium flex items-center gap-1">
            {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> More details</>}
          </button>
        )}

        <p className="text-sm font-bold text-accent">{product.price ?? "Price on request"}</p>

        <a
          href={`${WHATSAPP}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackProductClick(product.id)}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all"
        >
          <MessageCircle size={14} />
          Chat to Order
        </a>
      </div>
    </div>
  );
};

const ComingSoonStore = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <SiteHeader />
      <section className="relative flex-1 flex items-center justify-center overflow-hidden -mt-[64px] sm:-mt-[72px] pt-[64px] sm:pt-[72px]">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/30 blur-3xl animate-blob" />
          <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-accent/25 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
          <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] rounded-full bg-primary/25 blur-3xl animate-blob" style={{ animationDelay: "8s" }} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent,hsl(var(--secondary))_75%)]" />

        <div className="relative section-container py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/40 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-gold animate-fade-up">
            <Sparkles size={13} className="fill-gold" /> Coming Soon
          </div>
          <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-display font-bold text-primary-foreground tracking-[-0.02em] leading-[1.05] no-clip max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
            The Tioga <span className="bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">Online Store</span> is launching soon.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-primary-foreground/75 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "0.2s" }}>
            We're putting the finishing touches on a curated catalog of solar, smart home, and security gear, complete with one-tap WhatsApp ordering.
          </p>
          <p className="mt-3 text-sm text-primary-foreground/60 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "0.25s" }}>
            In the meantime, get an instant AI-tailored recommendation for your space.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("tioga:open-lead-form", { detail: { source: "store_coming_soon" } }));
                navigate("/?lead=1");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-bold text-midnight hover:brightness-110 active:scale-[0.97] transition-all shadow-xl shadow-gold/40"
            >
              <Sparkles size={15} className="fill-midnight" /> Get AI Recommendation
            </button>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/5 backdrop-blur-md px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/15 transition-all"
            >
              <MessageCircle size={15} /> Chat on WhatsApp
            </a>
          </div>

          {/* Preview tiles */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {[
              { label: "Solar Kits", emoji: "☀️" },
              { label: "Smart Locks", emoji: "🔒" },
              { label: "CCTV", emoji: "📷" },
              { label: "Smart Lights", emoji: "💡" },
            ].map((t) => (
              <div key={t.label} className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur-md p-4 text-center">
                <div className="text-2xl mb-1.5">{t.emoji}</div>
                <p className="text-xs sm:text-sm font-semibold text-primary-foreground">{t.label}</p>
                <p className="text-[10px] uppercase tracking-widest text-primary-foreground/50 mt-1">Soon</p>
              </div>
            ))}
          </div>

          <Link to="/" className="mt-10 inline-flex items-center gap-1.5 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

const Catalog = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Gate: products are only accessible after completing the personalized quote form.
  // Without form state or unlock flag, show the Coming Soon screen.
  const unlocked = typeof window !== "undefined" && sessionStorage.getItem("_tid_catalog_unlocked") === "1";
  const hasState = !!location.state;
  const showComingSoon = !unlocked && !hasState;

  useEffect(() => {
    if (hasState) sessionStorage.setItem("_tid_catalog_unlocked", "1");
  }, [hasState]);

  if (showComingSoon) return <ComingSoonStore />;

  const state = location.state as {
    products?: string[];
    budget?: string;
    fullName?: string;
    totalWatts?: number;
    selectedAppliances?: { name: string; quantity: number; avgWatts: number }[];
    formContext?: {
      category?: string;
      systemType?: string;
      propertyType?: string;
      usageDuration?: string;
      automateWhat?: string[];
      controlPreference?: string;
      automationScale?: string;
      securityNeeds?: string[];
      accessType?: string[];
      cctvCoverage?: string[];
    };
  } | null;
  const interests = state?.products ?? [];
  const budget = state?.budget;
  const userName = state?.fullName;
  const totalWatts = state?.totalWatts;
  const selectedAppliances = state?.selectedAppliances;
  const formContext = state?.formContext;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSeries, setActiveSeries] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Determine the primary category from form
  const primaryCategory = useMemo(() => {
    if (formContext?.category) return formContext.category;
    if (interests.length > 0) {
      const mapped = CATEGORY_MAP[interests[0]];
      if (mapped) return mapped === "solar" ? "solar" : mapped === "smart_locks" ? "security" : mapped;
    }
    return null;
  }, [formContext?.category, interests]);

  // Map interests to DB categories
  const targetCategories = useMemo(() => {
    if (interests.length > 0) {
      return [...new Set(interests.map((i) => CATEGORY_MAP[i] || i))];
    }
    return ["solar", "smart_locks", "smarthome", "cctv"];
  }, [interests]);

  const [galleryByProduct, setGalleryByProduct] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, category, series, description, features, best_for, price, tier, image_url, specifications, tags")
        .in("category", targetCategories)
        .eq("is_active", true)
        .order("sort_order");

      let results = (data as Product[]) ?? [];
      const tierOrder = getTierOrder(budget);
      results.sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));
      setAllProducts(results);
      setLoading(false);

      // Fetch gallery images for these products
      if (results.length) {
        const ids = results.map((p) => p.id);
        const { data: imgs } = await (supabase as any)
          .from("product_images")
          .select("product_id, url, sort_order, is_primary")
          .in("product_id", ids)
          .order("is_primary", { ascending: false })
          .order("sort_order", { ascending: true });
        const map: Record<string, string[]> = {};
        ((imgs as any[]) ?? []).forEach((row) => {
          if (!map[row.product_id]) map[row.product_id] = [];
          map[row.product_id].push(row.url);
        });
        setGalleryByProduct(map);
      }
    };
    fetchProducts();
  }, []);

  // AI recommendation
  useEffect(() => {
    if (!formContext?.category && !totalWatts) return;
    setAiLoading(true);
    supabase.functions
      .invoke("ai-recommend", {
        body: {
          category: formContext?.category,
          appliances: selectedAppliances,
          totalWatts,
          budget,
          systemType: formContext?.systemType,
          propertyType: formContext?.propertyType,
          usageDuration: formContext?.usageDuration,
          formContext,
        },
      })
      .then(({ data, error }) => {
        if (!error && data) setAiRec(data as AIRecommendation);
      })
      .catch(console.error)
      .finally(() => setAiLoading(false));
  }, [formContext?.category, totalWatts]);

  // Check if product matches AI recommendation - exact name match
  const getPickNumber = (product: Product): number => {
    if (!aiRec?.recommendedProducts?.length) return 0;
    const idx = aiRec.recommendedProducts.findIndex(
      (rp) => rp.toLowerCase().trim() === product.name.toLowerCase().trim()
    );
    return idx >= 0 ? idx + 1 : 0;
  };

  const isRecommended = (product: Product) => {
    return getPickNumber(product) > 0;
  };

  // Available categories from loaded products
  const availableCategories = useMemo(() => {
    const cats = [...new Set(allProducts.map(p => p.category))];
    return cats;
  }, [allProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;
    if (activeCategory) {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (activeSeries) {
      filtered = filtered.filter(p => (p.series || p.category) === activeSeries);
    }
    // Sort: recommended first, ordered by pick number
    if (aiRec?.recommendedProducts?.length) {
      filtered.sort((a, b) => {
        const aP = getPickNumber(a) || 999;
        const bP = getPickNumber(b) || 999;
        return aP - bP;
      });
    }
    return filtered;
  }, [allProducts, activeCategory, activeSeries, aiRec]);

  // Series within active category
  const availableSeries = useMemo(() => {
    const source = activeCategory ? allProducts.filter(p => p.category === activeCategory) : allProducts;
    const seriesMap: Record<string, number> = {};
    for (const p of source) {
      const key = p.series || p.category;
      seriesMap[key] = (seriesMap[key] || 0) + 1;
    }
    return Object.entries(seriesMap).sort(([a], [b]) => a.localeCompare(b));
  }, [allProducts, activeCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [activeCategory, activeSeries]);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SiteHeader />
      <div className="bg-secondary text-secondary-foreground">
        <div className="section-container py-6 sm:py-8 space-y-3">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-1 text-sm text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </button>
          <h1 className="text-xl sm:text-3xl font-display font-bold leading-tight">
            {userName ? `${userName}, here's` : "Here's"} what we{" "}
            <span className="text-accent">recommend for you</span>
          </h1>
          <p className="text-sm text-secondary-foreground/70">
            Carefully selected solutions tailored to your request.
          </p>
          {totalWatts ? (
            <div className="flex items-center gap-2 text-xs bg-secondary-foreground/10 rounded-lg px-3 py-2 w-fit">
              <Zap size={14} className="text-accent" />
              <span>Your estimated power need: <strong>{totalWatts.toLocaleString()}W</strong></span>
            </div>
          ) : null}
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {(aiLoading || aiRec) && (
        <div className="section-container py-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="font-display font-bold text-foreground">AI Recommendation</h3>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                Analyzing your requirements...
              </div>
            ) : aiRec ? (
              <div className="space-y-2">
                {aiRec.recommendedCombo && (
                  <p className="text-sm font-semibold text-primary">Recommended package: {aiRec.recommendedCombo}</p>
                )}
                {aiRec.recommendedProducts?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {aiRec.recommendedProducts.map((name, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        #{i + 1} {name}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{aiRec.reason}</p>
                {aiRec.tip && (
                  <p className="text-xs bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 text-accent-foreground">
                    <strong>Pro tip:</strong> {aiRec.tip}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="section-container py-6 sm:py-10 space-y-6">
        {/* Category tabs */}
        {!loading && availableCategories.length > 1 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setActiveCategory(null); setActiveSeries(null); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${!activeCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
              >
                All ({allProducts.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(activeCategory === cat ? null : cat); setActiveSeries(null); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
                >
                  {CATEGORY_LABELS[cat] || cat} ({allProducts.filter(p => p.category === cat).length})
                </button>
              ))}
            </div>

            {/* Series sub-filter */}
            {availableSeries.length > 3 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveSeries(null)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${!activeSeries ? "bg-secondary text-secondary-foreground border-secondary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
                >
                  All Series
                </button>
                {availableSeries.map(([series, count]) => (
                  <button
                    key={series}
                    onClick={() => setActiveSeries(activeSeries === series ? null : series)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${activeSeries === series ? "bg-secondary text-secondary-foreground border-secondary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
                  >
                    {series} ({count})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading recommendations...</div>
          </div>
        ) : (
          <>
            {/* Product count */}
            <p className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1} to {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {paginatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} isRecommended={isRecommended(p)} pickNumber={getPickNumber(p)} gallery={galleryByProduct[p.id]} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, i) =>
                    page === "ellipsis" ? (
                      <PaginationItem key={`e-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page as number)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <p className="text-muted-foreground">No products matched your selection.</p>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                  <MessageCircle size={16} /> Chat with us
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border py-3 px-4">
        <div className="max-w-6xl mx-auto flex gap-3">
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 sm:px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Chat on </span>WhatsApp
          </a>
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent("Hi, I'd like to request an installation consultation.")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 sm:px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
          >
            <span className="hidden sm:inline">Request </span>Installation
          </a>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
