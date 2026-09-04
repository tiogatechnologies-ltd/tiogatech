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
  Users,
  Star,
} from "lucide-react";
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
import { PROMO_LIFT, viewerCount, soldCount, savingsPct } from "@/lib/promoDisplay";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seoSchema";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { resolveProductImage, getMultiAngleProductImages } from "@/lib/productImages";
import type { RetailProduct } from "@/types/retail";
import { toast } from "sonner";
import { useSiteContact, whatsappDigits } from "@/hooks/useSiteContact";

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
}

const categoryLabels: Record<string, string> = {
  solar: "Solar Energy",
  Inverters: "Solar Inverter",
  Batteries: "LiFePO4 Battery",
  "Solar Panels": "Solar Panel",
  smart_locks: "Biometric Smart Lock",
  "Smart Locks": "Biometric Smart Lock",
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
  const { contact } = useSiteContact();
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { add: addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useProductCompare();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<{ average: number; count: number } | null>(null);

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
      }));

      const all = mergeProducts(staticList, dbList);

      const found = all.find((p) => matchesSlug(p, slug)) ?? null;
      setProduct(found);
      setLoading(false);

      if (found) {
        setRelated(all.filter((p) => p.category === found.category && p.id !== found.id).slice(0, 4));
        const gallery = getMultiAngleProductImages(found.image_url, found.category);
        setImages(gallery.length > 0 ? gallery : [resolveProductImage(found.image_url, found.category)]);
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
    for (let i = 0; i < quantity; i++) {
      addToCart({
        refId: product.id,
        type: "product",
        name: product.name,
        price: product.price,
        image: images[0] || product.image_url,
        category: product.category,
      });
    }
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
        { name: "Home", item: SITE_URL },
        { name: "Retail Store", item: `${SITE_URL}/retail` },
        { name: product.name, item: prodUrl },
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
  const pct = numPrice > 0 ? savingsPct(product.id) : null;
  const wasPrice = numPrice > 0 ? Math.round(numPrice * PROMO_LIFT) : null;
  const savedAmount = numPrice > 0 && wasPrice ? wasPrice - numPrice : null;
  const viewers = viewerCount(product.id);
  const sold = soldCount(product.id);

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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock
                    </span>
                  )}
                </div>

                {/* Live Viewers Top Right */}
                <div className="absolute top-4 right-4 pointer-events-none">
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-midnight/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                    {viewers} viewing
                  </span>
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
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {categoryLabels[product.category] ?? product.category}
                </span>

                <div className="flex items-center gap-2">
                  {/* Compare button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (product) {
                        toggleCompare({
                          ...product,
                          numeric_price: numPrice,
                          brand: product.brand || "Tioga Certified",
                          rating: 5.0,
                          review_count: 14,
                        } as unknown as RetailProduct);
                      }
                    }}
                    aria-label="Compare product"
                    className={`p-2 rounded-xl border transition-all ${
                      product && isInCompare(product.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40"
                    }`}
                    title={product && isInCompare(product.id) ? "Remove from comparison" : "Add to comparison"}
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
                  <div className="flex items-center gap-1 font-medium text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-foreground font-bold">{product.rating || "5.0"}</span>
                    <span className="text-muted-foreground">({product.review_count || 14} reviews)</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Users size={13} />
                    <span>{sold} purchased this week</span>
                  </div>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Flame size={13} /> In High Demand
                  </span>
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
                        {formatPrice(product.price)}
                      </span>
                      {wasPrice && savedAmount && (
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground line-through">
                            ₦{Math.round(wasPrice).toLocaleString("en-NG")}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Tag size={11} /> Save ₦{Math.round(savedAmount).toLocaleString("en-NG")} ({pct}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {numPrice > 0 && (
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">Spread payment with direct debit</span>
                      <span className="text-xs font-bold text-primary">
                        From ₦{Math.round(numPrice / 6).toLocaleString("en-NG")}/mo
                      </span>
                    </div>
                  )}
                </div>

                {/* Urgency promo banner */}
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <Flame size={15} className="shrink-0 text-amber-500" />
                  <span className="font-medium">
                    Flash promo: Use code <strong className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded font-bold">TIOGA2026</strong> for free expedited transit.
                  </span>
                </div>

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
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
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
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
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
                    SKU: TIOGA-{product.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="divide-y divide-border">
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
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 sm:text-right">5-Year Manufacturer Warranty</span>
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
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => navigate(productPath(rel))}
                  className="text-left rounded-3xl border border-border bg-card p-4 flex flex-col justify-between hover:border-primary/50 hover:shadow-lg transition-all group"
                >
                  <div className="space-y-3">
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
                  </div>

                  <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-foreground">
                      {formatPrice(rel.price)}
                    </span>
                    <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                      Details &rarr;
                    </span>
                  </div>
                </button>
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
