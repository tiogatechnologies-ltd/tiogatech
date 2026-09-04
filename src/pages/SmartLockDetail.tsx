import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ShoppingBag, ShieldCheck, Loader2, Share2,
  Zap, CheckCircle2, Wrench, ArrowRight, Star,
  Flame, TrendingDown, Tag, Users, Phone, MessageCircle,
  ChevronDown, ChevronUp, Fingerprint, Wifi, Key, Building2,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { useCart } from "@/contexts/CartContext";
import { trackConversion } from "@/lib/tracking";
import { useSmartLocks, type SmartLock } from "@/hooks/useSmartLocks";
import { openLeadForm } from "@/components/SiteHeader";
import { toast } from "sonner";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seoSchema";
import { PROMO_LIFT, viewerCount, savingsPct } from "@/lib/promoDisplay";

const fmtLock = (item: SmartLock) =>
  item.price_label?.trim() ||
  (item.price ? `₦${Math.round(item.price).toLocaleString("en-NG")}` : "Quote");

const fmtN = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const FAQS = [
  { q: "What access methods does this lock support?", a: "Depending on the model: fingerprint, PIN code, RFID card, mobile app (Bluetooth/Wi-Fi), and mechanical key backup." },
  { q: "Is it weatherproof?", a: "Yes. All STAMA locks are IP65-rated for dust and moisture resistance, suitable for outdoor gates and main doors." },
  { q: "What happens when the battery dies?", a: "The lock gives a low-battery alert at ~20%. In an emergency, a 9V battery can be placed on the terminals to grant one-time access." },
  { q: "Can I add multiple fingerprints?", a: "Most models support 50–200 fingerprint registrations, perfect for families, offices and rental properties." },
  { q: "Is installation included?", a: "Professional installation is included in all Smart Lock packages. A certified technician will be scheduled within 48 hours." },
];

const FEATURES_MAP: Record<string, { icon: typeof Fingerprint; label: string }> = {
  "fingerprint": { icon: Fingerprint, label: "Biometric" },
  "wi-fi": { icon: Wifi, label: "Wi-Fi" },
  "wifi": { icon: Wifi, label: "Wi-Fi" },
  "key": { icon: Key, label: "Key Backup" },
  "hotel": { icon: Building2, label: "Hotel Ready" },
};

export const SmartLockDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { items: locks, loading } = useSmartLocks();
  const [lock, setLock] = useState<SmartLock | null>(null);
  const [related, setRelated] = useState<SmartLock[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [addedAnim, setAddedAnim] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  useEffect(() => {
    if (!locks.length) return;
    const found = locks.find((l) => l.id === id) ?? null;
    setLock(found);
    if (found) {
      setRelated(
        locks.filter((l) => l.id !== id && l.category === found.category).slice(0, 3)
      );
      trackConversion("package_view", { package_id: id, type: "lock" });
    }
  }, [locks, id]);

  const handleAdd = () => {
    if (!lock) return;
    add({
      refId: lock.id,
      type: "product",
      name: lock.name,
      price: fmtLock(lock),
      numericPrice: lock.price ?? null,
      image: lock.image,
      category: "smart_locks",
    });
    trackConversion("cart_add", { source: "lock_detail", id: lock.id });
    setAddedAnim(true);
    toast.success(`Added ${lock.name} to cart`);
    setTimeout(() => setAddedAnim(false), 2000);
  };

  const handleBuyNow = () => {
    handleAdd();
    setBuyingNow(true);
    setTimeout(() => navigate("/checkout"), 400);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share && lock) {
      navigator.share({ title: `${lock.name} | Tioga STAMA`, url }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

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

  if (!lock) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="flex-1 section-container py-24 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground text-sm">This smart lock may have been updated or discontinued.</p>
          <button onClick={() => navigate("/packages?category=locks")} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
            Browse Smart Locks
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const pct = lock.price ? savingsPct(lock.id) : null;
  const wasPrice = lock.price ? Math.round(lock.price * PROMO_LIFT) : null;
  const savedAmount = lock.price && wasPrice ? wasPrice - lock.price : null;
  const viewers = viewerCount(lock.id);
  const categoryLabel = lock.category === "hotel" ? "Hotel Ecosystem" : lock.category === "accessory" ? "Smart Lock Accessory" : `${lock.series}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: lock.name,
      description: lock.description,
      brand: { "@type": "Brand", name: "STAMA Smart Locks" },
      offers: {
        "@type": "Offer",
        priceCurrency: "NGN",
        ...(lock.price ? { price: lock.price } : {}),
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/packages/lock/${lock.id}`,
        seller: { "@type": "Organization", name: "Tioga Technologies" },
      },
    },
    breadcrumbJsonLd([
      { name: "Packages", path: "/packages" },
      { name: "Smart Locks", path: "/packages?category=locks" },
      { name: lock.name, path: `/packages/lock/${lock.id}` },
    ]),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${lock.name} - STAMA Smart Lock | Tioga Technologies`}
        description={`${lock.description.slice(0, 160)} ${lock.features.slice(0, 3).join(", ")}.`}
        path={`/packages/lock/${lock.id}`}
        image={lock.image}
        jsonLd={jsonLd}
      />
      <SiteHeader />

      <main className="flex-1 pt-[72px] sm:pt-[80px]">

        {/* Breadcrumb */}
        <div className="border-b border-border/40 bg-muted/10">
          <nav className="section-container py-3.5">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <ChevronRight size={12} />
              <li><Link to="/packages" className="hover:text-primary transition-colors">Packages</Link></li>
              <ChevronRight size={12} />
              <li><Link to="/packages?category=locks" className="hover:text-primary transition-colors">Smart Locks</Link></li>
              <ChevronRight size={12} />
              <li className="text-foreground font-medium line-clamp-1">{lock.name}</li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section className="section-container py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Left: Image */}
            <div className="lg:col-span-6 lg:sticky lg:top-28 space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] aspect-[4/3]">
                <img src={lock.image} alt={lock.name} className="w-full h-full object-cover" />
                {/* Badges on image */}
                <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 max-w-[60%]">
                  {lock.model && (
                    <span className="text-[10px] font-bold bg-gold/90 backdrop-blur-md border border-gold/40 text-midnight px-2.5 py-0.5 rounded-full shadow-md w-fit">{lock.model}</span>
                  )}
                  {pct && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold bg-red-600/90 backdrop-blur-md border border-white/25 text-white px-2.5 py-0.5 rounded-full shadow-md w-fit">
                      <TrendingDown size={10} /> Save {pct}%
                    </span>
                  )}
                  {lock.badge && (
                    <span className="text-[10px] font-bold bg-primary/90 backdrop-blur-md border border-white/20 text-white px-2.5 py-0.5 rounded-full shadow-md w-fit">{lock.badge}</span>
                  )}
                </div>

                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-midnight/75 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  {viewers} viewing
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-midnight/65 backdrop-blur-md border-t border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-white/80 mb-1">{categoryLabel}</p>
                  <h1 className="text-lg sm:text-2xl font-display font-bold text-white leading-tight">{lock.name}</h1>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { icon: ShieldCheck, label: "1-Yr Warranty", sub: "Manufacturer Backed" },
                  { icon: Wrench, label: "Pro Install", sub: "Within 48h" },
                  { icon: Zap, label: "Quick Setup", sub: "30-min install" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="p-2.5 sm:p-3 rounded-2xl bg-card border border-border flex flex-col items-center text-center gap-1 min-w-0">
                    <Icon size={16} className="text-primary shrink-0 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-foreground truncate w-full">{label}</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate w-full">{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-6 space-y-5">

              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                    STAMA · {categoryLabel}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-tight no-clip">{lock.name}</h2>
                  {lock.tagline && <p className="text-sm text-muted-foreground mt-1">{lock.tagline}</p>}
                </div>
                <button onClick={handleShare} className="shrink-0 p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground transition-all" aria-label="Share">
                  <Share2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={14} className="fill-gold text-gold" />)}
                  <span className="text-xs text-muted-foreground ml-1">4.8 (24 installs)</span>
                </div>
                <span className="text-xs text-muted-foreground">·</span>
                <div className="flex items-center gap-1 text-xs">
                  <Users size={12} className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">2 ordered this week</span>
                </div>
              </div>

              {/* Price */}
              <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                  {lock.category === "hotel" ? "Investment Price" : "Bundle Price"}
                </p>
                <div className="flex items-end gap-4 mb-2">
                  <span className="text-4xl font-display font-bold text-foreground leading-none">{fmtLock(lock)}</span>
                  {wasPrice && savedAmount && (
                    <div className="flex flex-col pb-1">
                      <span className="text-sm text-muted-foreground line-through">{fmtN(wasPrice)}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Save {fmtN(savedAmount)} ({pct}%)</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Tag size={11} className="text-primary" /> Includes hardware + professional installation
                </p>
              </div>

              {/* Urgency */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
                <Flame size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Limited stock this month.</span>
                  <span className="text-xs block mt-0.5 opacity-80">Reserve yours today to guarantee same-week installation.</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAdd}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 py-3.5 text-sm font-bold transition-all ${addedAnim ? "bg-emerald-500 border-emerald-500 text-white" : "border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"}`}
                  >
                    <ShoppingBag size={16} /> {addedAnim ? "Added! ✓" : "Add to Cart"}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={buyingNow}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-70"
                  >
                    {buyingNow ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Buy Now
                  </button>
                </div>
                {lock.price && lock.price > 100_000 && (
                  <FlexiblePaymentButton itemName={lock.name} itemType="lock" itemId={lock.id} price={lock.price} />
                )}
                <button
                  onClick={() => openLeadForm(`lock_pdp_${lock.id}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Get Custom Quote
                </button>
              </div>

              <a
                href={`https://wa.me/2348178000023?text=${encodeURIComponent(`Hi Tioga, I'm interested in the ${lock.name}${lock.price ? ` (${fmtLock(lock)})` : ""}. Please share availability and installation timeline.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/30 section-padding py-12">
          <div className="section-container">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2 no-clip">Key Features</h2>
            {lock.description && <p className="text-sm text-muted-foreground mb-8 max-w-2xl">{lock.description}</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              {lock.features.map((f) => (
                <div key={f} className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>

            {(lock.power_system || lock.ideal_for) && (
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {lock.power_system && (
                  <div className="p-5 rounded-2xl bg-card border border-border">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Power System</p>
                    <p className="text-sm font-semibold text-foreground">{lock.power_system}</p>
                  </div>
                )}
                {lock.ideal_for && (
                  <div className="p-5 rounded-2xl bg-card border border-border">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Ideal For</p>
                    <p className="text-sm font-semibold text-foreground">{lock.ideal_for}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="section-padding py-12">
          <div className="section-container max-w-2xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6 no-clip">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    {faq.q}
                    {openFaq === i ? <ChevronUp size={16} className="text-primary shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                  </button>
                  {openFaq === i && <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="bg-muted/30 section-padding py-12">
            <div className="section-container">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground no-clip">Similar Locks</h2>
                <Link to="/packages?category=locks" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link key={r.id} to={`/packages/lock/${r.id}`} className="group rounded-2xl border border-border bg-card overflow-hidden hover-lift transition-all">
                    <div className="relative h-36 overflow-hidden">
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute bottom-0 inset-x-0 p-3 bg-midnight/65 backdrop-blur-md border-t border-white/10">
                        <p className="text-sm font-bold text-white leading-tight line-clamp-2">{r.name}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-display font-bold text-foreground">{fmtLock(r)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">View product <ArrowRight size={11} /></p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="section-padding py-10">
          <div className="section-container">
            <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground">
              <h3 className="text-xl font-display font-bold mb-2 no-clip">Not sure which lock suits you?</h3>
              <p className="text-sm text-primary-foreground/80 mb-5">Talk to our STAMA specialists for a free recommendation based on your door type and security needs.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => openLeadForm("lock_pdp_bottom")} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 transition-all">
                  Get Recommendation
                </button>
                <a href="tel:+2348178000023" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/20 transition-all">
                  <Phone size={15} /> Call Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{lock.series}</p>
            <p className="font-display font-bold text-foreground text-base leading-none truncate">{fmtLock(lock)}</p>
          </div>
          <button onClick={handleAdd} className={`px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all shrink-0 ${addedAnim ? "border-emerald-500 bg-emerald-500 text-white" : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"}`}>
            {addedAnim ? "Added ✓" : "Cart"}
          </button>
          <button onClick={handleBuyNow} className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all shrink-0 shadow-lg shadow-primary/30">
            Buy Now
          </button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      <SiteFooter />
    </div>
  );
};

export default SmartLockDetail;
