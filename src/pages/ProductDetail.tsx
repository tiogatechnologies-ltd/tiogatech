import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, MessageCircle, ShoppingBag, Truck, ShieldCheck, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import ImageLightbox from "@/components/ImageLightbox";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { trackConversion } from "@/lib/tracking";
import { matchesSlug, productPath } from "@/lib/productSlug";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seoSchema";
import ProductReviews from "@/components/ProductReviews";

const WHATSAPP = "https://wa.me/2348178000023";

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
  stock_qty: number | null;
}

const parsePriceNaira = (price?: string | null): number => {
  if (!price) return 0;
  const digits = price.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

const categoryLabels: Record<string, string> = {
  solar: "Solar",
  smart_locks: "Smart Locks",
  security: "Security",
  smarthome: "Home Automation",
  cctv: "CCTV",
};

const ProductDetail = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { add: addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [reviewStats, setReviewStats] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, category, series, description, features, best_for, price, tier, image_url, specifications, tags, stock_qty")
        .eq("is_active", true)
        .order("sort_order");
      if (cancelled) return;

      const all = (data as unknown as Product[]) ?? [];
      const found = all.find((p) => matchesSlug(p, slug)) ?? null;
      setProduct(found);
      setLoading(false);

      if (found) {
        setRelated(all.filter((p) => p.category === found.category && p.id !== found.id).slice(0, 4));
        const { data: imgs } = await (supabase as any)
          .from("product_images")
          .select("url, sort_order, is_primary")
          .eq("product_id", found.id)
          .order("is_primary", { ascending: false })
          .order("sort_order", { ascending: true });
        if (cancelled) return;
        const list = ((imgs as any[]) ?? []).map((r) => r.url).filter(Boolean);
        setImages(list.length ? list : [found.image_url].filter(Boolean) as string[]);
        trackConversion("product_view", { product_id: found.id, slug });
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!product) return undefined;
    const amount = parsePriceNaira(product.price);
    const inStock = (product.stock_qty ?? 1) > 0;
    return [
      breadcrumbJsonLd([
        { name: "Catalog", path: "/catalog" },
        { name: product.name, path: productPath(product) },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        category: categoryLabels[product.category] ?? product.category,
        ...(images[0] ? { image: [images[0]] } : {}),
        brand: { "@type": "Brand", name: product.series || "Tioga Technologies" },
        ...(reviewStats.count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: reviewStats.average.toFixed(1),
                reviewCount: reviewStats.count,
              },
            }
          : {}),
        ...(product.specifications
          ? {
              additionalProperty: Object.entries(product.specifications).map(([name, value]) => ({
                "@type": "PropertyValue",
                name,
                value: String(value),
              })),
            }
          : {}),
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}${productPath(product)}`,
          priceCurrency: "NGN",
          ...(amount ? { price: amount } : {}),
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: "Tioga Technologies" },
        },
      },
    ];
  }, [product, images, reviewStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEO title="Product not found" description="This product is no longer available." path={`/product/${slug}`} />
        <SiteHeader />
        <div className="flex-1 section-container py-24 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Product not found</h1>
          <p className="text-muted-foreground">This item may have been removed or renamed.</p>
          <Link to="/catalog" className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Browse the catalog
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const waMsg = encodeURIComponent(`Hi, I am interested in the ${product.name}${product.price ? ` (${product.price})` : ""}`);
  const inStock = (product.stock_qty ?? 1) > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${product.name} — Price & Specs in Nigeria`}
        description={`${product.description.slice(0, 150)}${product.price ? ` Priced at ${product.price}.` : ""}`}
        path={productPath(product)}
        type="website"
        image={images[0]}
        jsonLd={jsonLd}
      />
      <SiteHeader />

      <main className="flex-1 pt-[72px] sm:pt-[80px]">
        <nav aria-label="Breadcrumb" className="section-container pt-6">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <ChevronRight size={12} />
            <li><Link to="/catalog" className="hover:text-primary">Catalog</Link></li>
            <ChevronRight size={12} />
            <li className="text-foreground font-medium line-clamp-1">{product.name}</li>
          </ol>
        </nav>

        <section className="section-container py-6 grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted cursor-zoom-in"
              onClick={() => images.length && setLightbox(true)}
            >
              {images[activeIdx] ? (
                <img
                  src={images[activeIdx]}
                  alt={`${product.name} — ${categoryLabels[product.category] ?? product.category} by Tioga Technologies`}
                  width={1200}
                  height={900}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No image available
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeIdx ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                {categoryLabels[product.category] ?? product.category}
                {product.series ? ` · ${product.series}` : ""}
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{product.name}</h1>
              <p className="text-2xl font-bold text-accent">{product.price ?? "Price on request"}</p>
              <p className={`text-xs font-medium ${inStock ? "text-emerald-600" : "text-muted-foreground"}`}>
                {inStock ? "In stock — installable this week" : "Currently out of stock"}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            <p className="text-sm font-medium text-primary">Best for: {product.best_for}</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  addToCart({
                    refId: product.id,
                    type: "product",
                    name: product.name,
                    price: product.price,
                    image: images[0] || product.image_url,
                    category: product.category,
                  });
                  trackConversion("cart_add", { product_id: product.id, source: "pdp" });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 text-primary px-4 py-3 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ShoppingBag size={16} /> Add to Cart
              </button>
              <a
                href={`${WHATSAPP}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion("whatsapp_click", { product_id: product.id, source: "pdp" })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>
            <FlexiblePaymentButton itemName={product.name} itemType="product" itemId={product.id} />

            <div className="grid gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Truck size={14} className="text-primary" /> Free delivery in Abuja and Jos · ₦15,000 elsewhere</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-primary" /> Manufacturer warranty plus Tioga after-sales support</span>
            </div>

            {product.features.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-display font-bold text-base">Key features</h2>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  {product.features.map((f) => (
                    <li key={f} className="flex gap-2"><span className="text-primary">•</span>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-2">
                <h2 className="font-display font-bold text-base">Specifications</h2>
                <dl className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-3 py-2 text-sm">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-medium text-right">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>

        {related.length > 0 && (
          <section className="section-container pb-16">
            <h2 className="font-display text-xl font-bold mb-4">Related products</h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate(productPath(r))}
                  className="text-left rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-muted">
                    {r.image_url && (
                      <img src={r.image_url} alt={r.name} loading="lazy" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{r.name}</p>
                    <p className="text-sm font-bold text-accent">{r.price ?? "Price on request"}</p>
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
