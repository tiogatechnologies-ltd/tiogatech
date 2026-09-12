import { useSiteSetting } from "@/hooks/useSiteSetting";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight,
  MessageCircle,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Loader2,
  Heart,
  Share2,
  Minus,
  Plus,
  Zap,
  CheckCircle2,
  Maximize2,
  Wrench,
  Clock,
  ArrowRight,
  Check,
  SlidersHorizontal,
  Flame,
  TrendingDown,
  Tag,
  Star,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import ImageLightbox from "@/components/ImageLightbox";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import ProductReviews from "@/components/ProductReviews";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useProductCompare } from "@/hooks/useProductCompare";
import { trackConversion } from "@/lib/tracking";
import { matchesSlug, productPath } from "@/lib/productSlug";
import { inferBrand, normalizeCategory } from "@/lib/productBrand";
import { mergeProducts } from "@/lib/mergeProducts";
import { savingsPct, wasPrice as calcWasPrice, savedAmount as calcSavedAmount, resolveCompareAt } from "@/lib/promoDisplay";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seoSchema";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { resolveProductImage, getMultiAngleProductImages } from "@/lib/productImages";
import type { RetailProduct } from "@/types/retail";
import { toast } from "sonner";
import { useSiteContact, whatsappDigits } from "@/hooks/useSiteContact";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useLandingContent } from "@/hooks/useLandingContent";

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
  stock_qty?: number;
  brand?: string;
  rating?: number;
  review_count?: number;
  numeric_price?: number;
  serial_number?: string;
  sku?: string;
}

const categoryLabels: Record<string, string> = {
  solar: "Solar Energy",
  Inverters: "Solar Inverter",
  Batteries: "LiFePO4 Battery",
  "Solar Panels": "Solar Panel",
  smart_locks: "Biometric Smart Lock",
  "Smart Locks": "Biometric Smart Lock",
  "Smart Door Locks": "Biometric Smart Lock",
  "Smart Switches & Sockets": "Smart Switch & Socket",
  "Smart Control Panels": "Smart Control Panel",
  "Smart Sensors & Alarms": "Smart Sensor & Alarm",
  "Smart Curtains & Motors": "Smart Curtain & Blind",
  "Smart Audio & Intercom": "Smart Audio & Sound",
  "Smart Lighting & Track": "Smart Lighting & Track",
  "Gateways & Networking": "Gateway & Mesh Networking",
  "Smart Breakers & Energy": "Smart Breaker & Energy",
  "Smart Hotel & Commercial": "Smart Hotel System",
  "CCTV & Cameras": "CCTV & Security Camera",
  security: "Security System",
  smarthome: "Home Automation",
  "Home Automation": "Home Automation",
  cctv: "CCTV Surveillance",
  CCTV: "CCTV Surveillance",
};

const parsePriceNaira = (price?: string | null): number => {
  if (!price) return 0;
  const digits = price.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

const formatPrice = (price?: string | null): string => {
  if (!price) return "Price on request";
  const num = parsePriceNaira(price);
  if (num > 0) return `₦${num.toLocaleString("en-NG")}`;
  return price;
};


export const ProductDetail = () => {
  // Declared here, above the loading / not-found early returns.
  const { settings: promos } = useSiteSetting("promotions");
  const { contact } = useSiteContact();
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { add: addToCart } = useCart();
  const { content: flashDeal } = useLandingContent("flash_deal");
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare, openCompareModal, count: compareCount } = useProductCompare();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<{ average: number; count: number } | null>(null);

  const handleToggleCompare = (p: Product) => {
    toggleCompare({
      id: p.id,
      name: p.name,
      category: p.category,
      series: p.series || null,
      description: p.description,
      features: p.features || [],
      best_for: p.best_for || "Residential & commercial applications",
      price: p.price,
      numeric_price: p.numeric_price || parsePriceNaira(p.price) || undefined,
      tier: (p.tier as any) || "premium",
      image_url: p.image_url,
      specifications: p.specifications || {},
      brand: p.brand || inferBrand(p.name, p.category),
      rating: p.rating,
      review_count: p.review_count,
      stock_status: "in_stock",
      serial_number: p.serial_number,
      sku: p.sku,
    } as unknown as RetailProduct);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (cancelled) return;

      const dbList: Product[] = ((data as any[]) || []).map((p) => ({
        id: p.id,
        name: p.name,
        category: normalizeCategory(p.category),
        series: p.series,
        description: p.description,
        features: Array.isArray(p.features) ? p.features : [],
        best_for: p.best_for || "Residential & commercial applications",
        price: p.price,
        tier: p.tier || "premium",
        image_url: p.image_url,
        specifications: p.specifications || {},
        stock_qty: p.stock_qty,
        brand: p.brand || inferBrand(p.name, p.category),
        numeric_price: parsePriceNaira(p.price) || undefined,
      }));

      const staticList: Product[] = STATIC_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        category: normalizeCategory(p.category),
        series: p.series || null,
        description: p.description,
        features: p.features || [],
        best_for: p.best_for || p.bestFor || "Residential & commercial applications",
        price: p.price || null,
        tier: p.tier || "premium",
        image_url: p.image_url || null,
        specifications: p.specifications || {},
        stock_qty: p.stock_qty,
        brand: p.brand || inferBrand(p.name, p.category),
        numeric_price: p.numeric_price,
        serial_number: p.serial_number,
        sku: p.sku,
      }));

      const all = mergeProducts(staticList, dbList);

      const found = all.find((p) => matchesSlug(p, slug)) ?? null;
      setProduct(found);
      setLoading(false);

      if (found) {
        setRelated(all.filter((p) => p.category === found.category && p.id !== found.id).slice(0, 4));
        const gallery = getMultiAngleProductImages(found.image_url, found.category);
        setImages(gallery.length > 0 ? gallery : [resolveProductImage(found.image_url, found.category, found.name)]);
        setActiveIdx(0);
        trackConversion("product_view", { product_id: found.id, slug });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: `${product.name} | Tioga Technologies`,
          text: product.description,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      refId: product.id,
      type: "product",
      name: product.name,
      price: product.price,
      numericPrice: product.numeric_price,
      image: images[0] || product.image_url,
      category: product.category,
      quantity,
    });
    trackConversion("cart_add", { product_id: product.id, quantity, source: "pdp" });
    toast.success(`Added ${quantity} × ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const jsonLd = useMemo(() => {
    if (!product) return undefined;
    const priceNum = parsePriceNaira(product.price);
    const inStock = product.stock_qty == null || product.stock_qty > 0;
    const primaryImg = images[0] ? (images[0].startsWith("http") ? images[0] : `${SITE_URL}${images[0]}`) : undefined;
    const prodUrl = `${SITE_URL}${productPath(product)}`;

    const schema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      brand: { "@type": "Brand", name: product.brand || "Tioga Technologies" },
      offers: {
        "@type": "Offer",
        priceCurrency: "NGN",
        price: priceNum > 0 ? priceNum : undefined,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: prodUrl,
        seller: { "@type": "Organization", name: "Tioga Technologies" },
      },
    };
    if (primaryImg) schema.image = [primaryImg];
    if (reviewStats && reviewStats.count > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: reviewStats.average.toFixed(1),
        reviewCount: reviewStats.count,
        bestRating: "5",
        worstRating: "1",
      };
    }
    return [
      schema,
      breadcrumbJsonLd([
        { name: "Retail Store", path: "/retail" },
        { name: product.name, path: productPath(product) },
      ]),
    ];
  }, [product, images, reviewStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO title="Product Not Found" description="This product is no longer available." path={`/product/${slug}`} />
        <SiteHeader />
        <div className="flex-1 section-container py-24 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground text-sm">This product may have been discontinued or moved.</p>
          <button
            onClick={() => navigate("/retail")}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
          >
            Browse Products
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const waMsg = encodeURIComponent(
    `Hi Tioga Technologies, I'm interested in ordering the ${product.name}${product.price ? ` (${product.price})` : ""} (Qty: ${quantity}). Please share delivery timeline and payment details.`
  );
  const inStock = product.stock_qty == null || product.stock_qty > 0;
  const numPrice = parsePriceNaira(product.price);
  const isWishlisted = isInWishlist(product.id);

  // Cosmetic promo calculations
  const compareAt = resolveCompareAt(numPrice, (product as any).compare_at_price, promos, product.id);
  const pct = savingsPct(numPrice, compareAt);
  const wasPrice = calcWasPrice(numPrice, compareAt);
  const savedAmount = calcSavedAmount(numPrice, compareAt);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${product.name} - ${categoryLabels[product.category] ?? product.category} | Tioga Technologies`}
        description={`${product.description.slice(0, 155)}...`}
        path={productPath(product)}
        type="website"
        image={images[0]}
        jsonLd={jsonLd}
      />
      <SiteHeader />

      <main className="flex-1 pt-[72px] sm:pt-[80px]">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-border/40 bg-muted/10">
          <nav aria-label="Breadcrumb" className="section-container py-3.5">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <ChevronRight size={12} />
              <li><Link to="/retail" className="hover:text-primary transition-colors">Retail Store</Link></li>
              <ChevronRight size={12} />
              <li>
                <Link
                  to={`/retail?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-primary transition-colors capitalize"
                >
                  {categoryLabels[product.category] ?? product.category}
                </Link>
              </li>
              <ChevronRight size={12} />
              <li className="text-foreground font-medium line-clamp-1">{product.name}</li>
            </ol>
          </nav>
        </div>

        {/* Primary Product Showcase (Image Gallery + Buy Area) */}
        <section className="section-container py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Image Gallery (Curved edges, filled frame & multi-angle thumbnails) */}
            <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-28 space-y-4">
              {/* Main Image Stage */}
              {/* Main Image Stage */}
              <div
                className="group relative aspect-[4/3] sm:aspect-square md:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] flex items-center justify-center p-4 sm:p-10 transition-all hover:border-primary/40"
              >
                {images[activeIdx] ? (
                  <img
                    src={images[activeIdx]}
                    alt={`${product.name} - ${categoryLabels[product.category] ?? product.category}`}
                    className="w-full h-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No image available
                  </div>
                )}

                {/* Overlaid Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  {pct && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow">
                      <TrendingDown size={12} /> Save {pct}%
                    </span>
                  )}
                  {product.series && (
                    <span className="px-3 py-1 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-[11px] font-bold text-foreground uppercase tracking-wider shadow-sm">
                      {product.series}
                    </span>
                  )}
                  {inStock && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock
                    </span>
                  )}
                </div>

                {/* Zoom Lightbox Trigger */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); if (images.length) setLightbox(true); }}
                  aria-label="Expand image"
                  className="absolute bottom-4 right-4 p-2.5 rounded-2xl bg-background/90 backdrop-blur-md border border-border/80 text-muted-foreground hover:text-primary transition-all shadow-sm hover:bg-primary hover:text-primary-foreground active:scale-95"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Multi-Angle Thumbnail Carousel */}
              {images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      aria-label={`View angle ${i + 1}`}
                      className={`relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all p-1.5 bg-card ${
                        i === activeIdx
                          ? "border-primary ring-2 ring-primary/20 shadow-md"
                          : "border-border hover:border-primary/50 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt="" loading="lazy" className="w-full h-full object-contain rounded-xl" />
                    </button>
                  ))}
                </div>
              )}

              {/* Value Guarantees Below Gallery */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-3 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-1">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="text-[11px] font-bold text-foreground">Official Warranty</span>
                  <span className="text-[10px] text-muted-foreground">5-Year Coverage</span>
                </div>
                <div className="p-3 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-1">
                  <Truck size={18} className="text-primary" />
                  <span className="text-[11px] font-bold text-foreground">Fast Dispatch</span>
                  <span className="text-[10px] text-muted-foreground">24-48h Nationwide</span>
                </div>
                <div className="p-3 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-1">
                  <Wrench size={18} className="text-primary" />
                  <span className="text-[11px] font-bold text-foreground">Certified Support</span>
                  <span className="text-[10px] text-muted-foreground">Expert Installers</span>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Pricing, Actions & Ordering */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-6">
              
              {/* Category, Brand, Actions Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-primary text-xs font-bold uppercase tracking-wider">
                  {categoryLabels[product.category] ?? product.category}
                </span>

                <div className="flex items-center gap-2">
                  {/* Compare button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (product) handleToggleCompare(product);
                    }}
                    aria-label="Compare product"
                    className={cn(
                      "p-2 rounded-xl border transition-all",
                      product && isInCompare(product.id)
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40"
                    )}
                    title={
                      product && isInCompare(product.id)
                        ? `In comparison (${compareCount}/4) · Click to remove`
                        : "Add to comparison"
                    }
                  >
                    <SlidersHorizontal size={16} />
                  </button>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Share product"
                    className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                    title="Share link"
                  >
                    {copiedLink ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                  </button>

                  {/* Wishlist toggle */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id, product.name)}
                    aria-label="Add to wishlist"
                    className={`p-2 rounded-xl border transition-all ${
                      isWishlisted
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                        : "border-border bg-card text-muted-foreground hover:text-rose-500 hover:border-rose-500/40"
                    }`}
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart size={16} className={isWishlisted ? "fill-rose-500" : ""} />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {(product.serial_number || product.sku) && (
                    <>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono text-[11px] font-bold">
                        <span>SN: {product.serial_number || product.sku}</span>
                      </div>
                      <span>·</span>
                    </>
                  )}
                  {/* Only shown once real reviews exist - it used to fall back
                      to a 5.0 rating and 14 reviews for products with none. */}
                  {/* Averaged from the reviews actually left on this product.
                      This used to fall back to a 5.0 rating and 14 reviews for
                      products nobody had reviewed. */}
                  {reviewStats && reviewStats.count > 0 ? (
                    <div className="flex items-center gap-1 font-medium text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-foreground font-bold">{reviewStats.average.toFixed(1)}</span>
                      <span className="text-muted-foreground">({reviewStats.count} {reviewStats.count === 1 ? "review" : "reviews"})</span>
                    </div>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                  {product.description}
                </p>
              </div>

              {/* Price & Slashed Deal Box */}
              <div className="p-5 rounded-3xl bg-muted/30 border border-border/80 space-y-3">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">Special Promo Price</span>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="font-display text-3xl sm:text-4xl font-black text-foreground">
                        {numPrice > 0 ? (
                          <AnimatedCounter target={numPrice} prefix="₦" />
                        ) : (
                          formatPrice(product.price)
                        )}
                      </span>
                      {wasPrice && savedAmount && (
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground line-through">
                            ₦{Math.round(wasPrice).toLocaleString("en-NG")}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Tag size={11} /> Save <AnimatedCounter target={Math.round(savedAmount)} prefix="₦" /> ({pct}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {numPrice > 0 && (
                    <div className="w-full sm:w-auto text-left sm:text-right">
                      <span className="text-[11px] text-muted-foreground block">Spread payment with direct debit</span>
                      <span className="text-xs font-bold text-primary">
                        From ₦{Math.round(numPrice / 6).toLocaleString("en-NG")}/mo
                      </span>
                    </div>
                  )}
                </div>

                {/* Flash deal banner - controlled from Admin > Retail Hero & Flash Deals */}
                {flashDeal?.is_active && flashDeal.discount_code && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                    <Flame size={15} className="shrink-0 text-amber-500" />
                    <span className="font-medium">
                      {flashDeal.headline ? `${flashDeal.headline}: ` : "Flash promo: "}Use code <strong className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded font-bold">{flashDeal.discount_code}</strong>{flashDeal.description ? ` - ${flashDeal.description}` : " for a limited-time discount."}
                    </span>
                  </div>
                )}

                <FlexiblePaymentButton itemName={product.name} itemType="product" itemId={product.id} />
              </div>

              {/* Quantity Selector & Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* Quantity Control */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground">Quantity:</span>
                  <div className="inline-flex items-center rounded-xl border border-border bg-card p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-display font-bold text-sm text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {inStock ? "Available for nationwide shipping" : "Backorder available"}
                  </span>
                </div>

                {/* Primary CTA Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary/10 text-primary px-5 py-3.5 text-sm font-bold hover:bg-primary hover:text-primary-foreground active:scale-[0.98] transition-all shadow-sm"
                  >
                    <ShoppingBag size={18} />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-5 py-3.5 text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md"
                  >
                    <span>Instant Checkout</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Compare Action Row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (product) handleToggleCompare(product);
                    }}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-all shadow-sm",
                      product && isInCompare(product.id)
                        ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20"
                        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <SlidersHorizontal size={15} className={product && isInCompare(product.id) ? "text-primary" : "text-muted-foreground"} />
                    <span>
                      {product && isInCompare(product.id)
                        ? `In Comparison (${compareCount}/4)`
                        : "Compare with Similar Models"}
                    </span>
                  </button>

                  {compareCount >= 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openCompareModal}
                      className="rounded-2xl px-4 py-3 h-auto text-xs font-bold gap-1.5 shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <Scale size={15} />
                      <span>Matrix ({compareCount})</span>
                    </Button>
                  )}
                </div>

                {/* WhatsApp Sales Channel */}
                <a
                  href={`https://wa.me/${whatsappDigits(contact)}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackConversion("whatsapp_click", { product_id: product.id, source: "pdp" })}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <MessageCircle size={16} className="text-emerald-500" />
                  <span>Order or Inquire via WhatsApp ({contact.whatsapp || contact.phone})</span>
                </a>
              </div>

              {/* Delivery & Assurance Micro-list */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <Truck size={16} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Nationwide Delivery: </span>
                    <span>Free delivery within Abuja & Jos. Flat ₦15,000 tracked transit across Lagos, Port Harcourt, and all 36 states.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock size={16} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Estimated Dispatch: </span>
                    <span>Orders placed before 2:00 PM are dispatched same-day with direct tracking.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Balanced Full-Width Section: Key Features & Technical Specifications (Zero blank spaces) */}
        <section className="section-container py-12 border-t border-border space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Engineering & Performance</span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              Technical Specifications & Key Features
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Comprehensive hardware documentation and factory-certified specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Key Features & Application Highlights (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Features List */}
              <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  <h3 className="font-display text-lg font-bold text-foreground">Engineered Capabilities</h3>
                </div>

                {product.features && product.features.length > 0 ? (
                  <ul className="space-y-3">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed text-foreground/90">{feat}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Detailed feature breakdown is being indexed.</p>
                )}
              </div>

              {/* Best For Application Banner */}
              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-foreground text-sm">Recommended Deployment</h4>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {product.best_for}
                </p>
              </div>

              {/* Installation & Certified Support Notice */}
              <div className="p-6 rounded-3xl bg-muted/20 border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-foreground" />
                  <h4 className="font-bold text-foreground text-sm">Professional Installation Available</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tioga Technologies certified field engineers are available for turnkey site installation, battery balancing, and cloud monitoring setup. Request engineer assistance upon checkout.
                </p>
              </div>
            </div>

            {/* Right Column: Full Specifications Sheet (6 Cols) */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-border bg-muted/30 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-foreground">Specification Sheet</h3>
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                    SKU: {product.sku || product.serial_number || `TIOGA-${product.id.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {/* Serial Number Row */}
                  {(product.serial_number || product.sku) && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-4 text-xs sm:text-sm hover:bg-muted/10 transition-colors">
                      <span className="text-muted-foreground font-medium">Serial Number</span>
                      <span className="font-mono font-bold text-primary sm:text-right">{product.serial_number || product.sku}</span>
                    </div>
                  )}
                  {/* Category & Series rows */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-4 text-xs sm:text-sm hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground font-medium">Hardware Class</span>
                    <span className="font-semibold text-foreground sm:text-right">{categoryLabels[product.category] ?? product.category}</span>
                  </div>
                  {product.series && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-4 text-xs sm:text-sm hover:bg-muted/10 transition-colors">
                      <span className="text-muted-foreground font-medium">Product Series</span>
                      <span className="font-semibold text-foreground sm:text-right">{product.series}</span>
                    </div>
                  )}

                  {/* Dynamic Product Specifications */}
                  {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    Object.entries(product.specifications).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-4 text-xs sm:text-sm hover:bg-muted/10 transition-colors"
                      >
                        <span className="text-muted-foreground font-medium">{key}</span>
                        <span className="font-mono font-semibold text-foreground break-words sm:text-right">{String(val)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Standard technical specifications loaded directly from manufacturer data sheet.
                    </div>
                  )}

                  {/* Warranty Duration */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-4 text-xs sm:text-sm hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground font-medium">Warranty Period</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 sm:text-right">5-Year Manufacturer Warranty</span>
                  </div>

                  {/* Compatibility */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-4 text-xs sm:text-sm hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground font-medium">Certifications</span>
                    <span className="font-semibold text-foreground sm:text-right">CE, RoHS, UN38.3, IEC 62109</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Interactive Side-by-Side Model Comparison Section */}
        {product && related.length > 0 && (
          <section className="section-container py-12 border-t border-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Scale size={15} />
                  <span>Side-by-Side Comparison</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
                  Compare Against Similar {categoryLabels[product.category] ?? product.category}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Evaluate specifications, pricing, warranties, and features against alternative models before you decide.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={() => {
                    if (!isInCompare(product.id)) {
                      handleToggleCompare(product);
                    }
                    openCompareModal();
                  }}
                  className="rounded-2xl px-4 py-2.5 font-bold text-xs gap-2 shadow-md bg-primary text-primary-foreground hover:brightness-110"
                >
                  <Scale size={15} />
                  <span>
                    {compareCount >= 2
                      ? `Open Comparison Matrix (${compareCount})`
                      : "Launch Side-by-Side Matrix"}
                  </span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>

            {/* Quick Side-by-Side Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[product, ...related.slice(0, 3)].map((item) => {
                const isCurrent = item.id === product.id;
                const inComp = isInCompare(item.id);
                const itemNumPrice = item.numeric_price || parsePriceNaira(item.price) || 0;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-3xl border bg-card p-5 flex flex-col justify-between transition-all duration-300 relative",
                      isCurrent
                        ? "border-primary/80 ring-2 ring-primary/20 shadow-lg"
                        : "border-border hover:border-primary/40 hover:shadow-md"
                    )}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                        Current Model
                      </div>
                    )}

                    <div className="space-y-3.5">
                      <div className="aspect-[4/3] rounded-2xl bg-muted/20 overflow-hidden p-3 flex items-center justify-center">
                        <img
                          src={resolveProductImage(item.image_url, item.category)}
                          alt={item.name}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {item.brand || "Tioga Certified"}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 mt-0.5">
                          {item.name}
                        </h3>
                      </div>

                      <div>
                        <p className="font-display font-black text-base text-foreground">
                          {itemNumPrice > 0 ? `₦${itemNumPrice.toLocaleString("en-NG")}` : item.price || "Price on Request"}
                        </p>
                        {itemNumPrice > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Spread: ~₦{Math.round(itemNumPrice / 6).toLocaleString("en-NG")}/mo
                          </p>
                        )}
                      </div>

                      {/* Key Specs Preview (Top 2-3 specifications) */}
                      {item.specifications && Object.keys(item.specifications).length > 0 && (
                        <div className="pt-2 border-t border-border/60 space-y-1.5 text-[11px]">
                          {Object.entries(item.specifications).slice(0, 3).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between text-muted-foreground">
                              <span className="truncate max-w-[100px]">{k}</span>
                              <span className="font-semibold text-foreground truncate max-w-[120px]">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-3 border-t border-border/60 flex flex-col gap-2">
                      <Button
                        type="button"
                        variant={inComp ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleCompare(item)}
                        className={cn(
                          "w-full rounded-xl text-xs font-bold gap-1.5 h-9",
                          inComp
                            ? "bg-primary text-primary-foreground hover:brightness-110"
                            : "border-border hover:border-primary/50 text-foreground"
                        )}
                      >
                        {inComp ? (
                          <>
                            <Check size={14} />
                            <span>In Compare ({compareCount}/4)</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Add to Compare</span>
                          </>
                        )}
                      </Button>

                      {!isCurrent && (
                        <Link
                          to={productPath(item)}
                          className="text-center text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors pt-0.5"
                        >
                          View Full Details &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Verified Customer Reviews Section */}
        <section className="section-container py-8 border-t border-border">
          <ProductReviews productId={product.id} onStats={setReviewStats} />
        </section>

        {/* Related Hardware Recommendations Grid */}
        {related.length > 0 && (
          <section className="section-container py-12 border-t border-border space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  Related Hardware in {categoryLabels[product.category] ?? product.category}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Explore compatible equipment and accessories</p>
              </div>
              <Link
                to={`/retail?category=${encodeURIComponent(product.category)}`}
                className="text-xs font-bold text-primary hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((rel) => (
                <div
                  key={rel.id}
                  className="rounded-3xl border border-border bg-card p-4 flex flex-col justify-between hover:border-primary/50 hover:shadow-lg transition-all group relative"
                >
                  <Link to={productPath(rel)} className="space-y-3 block">
                    <div className="aspect-[4/3] rounded-2xl bg-muted/20 overflow-hidden p-3 flex items-center justify-center">
                      <img
                        src={resolveProductImage(rel.image_url, rel.category)}
                        alt={rel.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {categoryLabels[rel.category] ?? rel.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                        {rel.name}
                      </h4>
                    </div>
                  </Link>

                  <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="font-display font-bold text-sm text-foreground">
                      {formatPrice(rel.price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleCompare(rel);
                      }}
                      className={cn(
                        "px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all border",
                        isInCompare(rel.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 text-muted-foreground border-border hover:text-primary hover:border-primary/50"
                      )}
                      title={isInCompare(rel.id) ? "Remove from comparison" : "Add to comparison"}
                      aria-label={`Compare ${rel.name}`}
                    >
                      {isInCompare(rel.id) ? <Check size={12} /> : <Plus size={12} />}
                      <span>Compare</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {lightbox && images.length > 0 && (
        <ImageLightbox images={images} startIndex={activeIdx} onClose={() => setLightbox(false)} alt={product.name} />
      )}
      <SiteFooter />
    </div>
  );
};

export default ProductDetail;
