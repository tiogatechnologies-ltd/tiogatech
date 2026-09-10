import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ShoppingBag, ShieldCheck, Loader2, Share2, Zap, CheckCircle2,
  Camera, HardDrive, Eye, Cpu, Wrench, MessageCircle, TrendingDown, Tag,
  ChevronDown, ChevronUp, Sun, Wifi,
} from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { useCart } from "@/contexts/CartContext";
import { trackConversion } from "@/lib/tracking";
import { useCctvPackages, type CctvPackage } from "@/hooks/useCctvPackages";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import { savingsPct, wasPrice as calcWasPrice, savedAmount as calcSavedAmount, resolveCompareAt } from "@/lib/promoDisplay";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seoSchema";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { toast } from "sonner";

const fmtN = (n: number | null) => (n == null ? "Price on request" : `₦${Math.round(n).toLocaleString("en-NG")}`);

const FAQS = [
  { q: "Can I view the cameras from my phone?", a: "Yes. Every kit is commissioned with remote mobile streaming on iOS and Android, so you can check any camera live from anywhere with an internet connection." },
  { q: "Do the cameras record in colour at night?", a: "Our ColorVu cameras record full-colour footage in low light rather than the usual black-and-white infrared, which makes clothing, vehicles and faces far easier to identify." },
  { q: "How long is footage kept?", a: "The included surveillance drive typically holds around 30 days of continuous recording, depending on channel count and motion activity. Larger drives can be fitted on request." },
  { q: "What happens during a power cut?", a: "We recommend backing the NVR and router with a small inverter or UPS so recording continues. The 4G solar camera runs entirely off its own panel and battery, so it is unaffected." },
  { q: "Is installation included?", a: "Yes. Pricing covers site survey, cabling, mounting, NVR configuration and handover training by our own engineers - we do not subcontract installation." },
];

export const CctvPackageDetail = () => {
  // Declared above the loading / not-found early returns.
  const { settings: promos } = useSiteSetting("promotions");
  const { contact } = useSiteContact();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { packages, loading } = useCctvPackages();

  const [pkg, setPkg] = useState<CctvPackage | null>(null);
  const [related, setRelated] = useState<CctvPackage[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [addedAnim, setAddedAnim] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  useEffect(() => {
    if (!packages.length) return;
    const found = packages.find((p) => p.id === id) ?? null;
    setPkg(found);
    if (found) {
      setRelated(packages.filter((p) => p.id !== id).slice(0, 3));
      trackConversion("package_view", { package_id: id, type: "cctv" });
    }
  }, [packages, id]);

  const handleAdd = () => {
    if (!pkg) return;
    add({
      refId: pkg.id,
      type: "package",
      name: pkg.name,
      price: fmtN(pkg.price),
      numericPrice: pkg.price ?? null,
      image: pkg.image,
      category: "cctv",
    });
    trackConversion("cart_add", { source: "cctv_detail", id: pkg.id });
    setAddedAnim(true);
    toast.success(`Added ${pkg.name} to cart`);
    setTimeout(() => setAddedAnim(false), 2000);
  };

  const handleBuyNow = () => {
    handleAdd();
    setBuyingNow(true);
    setTimeout(() => navigate("/checkout"), 400);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share && pkg) {
      navigator.share({ title: `${pkg.name} | Tioga`, url }).catch(() => {
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
        <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        <SiteFooter />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="flex-1 section-container py-24 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Package Not Found</h1>
          <p className="text-muted-foreground text-sm">This CCTV package may have been updated or discontinued.</p>
          <button
            onClick={() => navigate("/cctv")}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
          >
            Browse CCTV Packages
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const compareAt = resolveCompareAt(pkg.price, (pkg as any).compare_at_price, promos, pkg.id);
  const pct = savingsPct(pkg.price, compareAt);
  const wasPrice = calcWasPrice(pkg.price, compareAt);
  const savedAmount = calcSavedAmount(pkg.price, compareAt);
  const isStandalone = pkg.channels === 0;

  const highlights = isStandalone
    ? [
        { icon: Sun, label: "Solar powered" },
        { icon: Wifi, label: "4G SIM - no WiFi" },
        { icon: Eye, label: "360° PTZ tracking" },
        { icon: Wrench, label: "Engineer installed" },
      ]
    : [
        { icon: Camera, label: `${pkg.channels} cameras` },
        { icon: HardDrive, label: "30-day storage" },
        { icon: Cpu, label: "AI motion filtering" },
        { icon: Wrench, label: "Engineer installed" },
      ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: pkg.name,
      description: pkg.tagline || `${pkg.name} - AI CCTV surveillance supplied and installed by Tioga Technologies.`,
      brand: { "@type": "Brand", name: pkg.brand || "Tioga Technologies" },
      ...(pkg.image ? { image: `${SITE_URL}${pkg.image}` } : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "NGN",
        ...(pkg.price ? { price: pkg.price } : {}),
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/packages/cctv/${pkg.id}`,
        seller: { "@type": "Organization", name: "Tioga Technologies" },
      },
    },
    breadcrumbJsonLd([
      { name: "CCTV & Security", path: "/cctv" },
      { name: pkg.name, path: `/packages/cctv/${pkg.id}` },
    ]),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${pkg.name} | CCTV & Surveillance | Tioga Technologies`}
        description={`${pkg.tagline || pkg.name}. Supplied, cabled and installed by Tioga engineers across Nigeria. ${fmtN(pkg.price)}.`}
        path={`/packages/cctv/${pkg.id}`}
        image={pkg.image}
        jsonLd={jsonLd}
      />
      <SiteHeader />

      <main className="flex-1 pt-[72px] sm:pt-[80px]">
        {/* Breadcrumb */}
        <div className="border-b border-border/40 bg-muted/10">
          <nav className="section-container py-3.5" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <ChevronRight size={12} />
              <li><Link to="/cctv" className="hover:text-primary transition-colors">CCTV &amp; Security</Link></li>
              <ChevronRight size={12} />
              <li className="text-foreground font-medium">{pkg.name}</li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section className="section-container py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Image */}
            <div className="lg:col-span-6 lg:sticky lg:top-28 space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] aspect-[4/3]">
                <img src={pkg.image} alt={`${pkg.name} - CCTV surveillance kit`} className="w-full h-full object-cover" />
                <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 max-w-[60%]">
                  {pkg.badge && (
                    <span className="text-[10px] font-bold bg-gold/90 backdrop-blur-xl border border-gold/50 text-midnight px-2.5 py-0.5 rounded-full shadow-md w-fit">
                      {pkg.badge}
                    </span>
                  )}
                  {pct && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold bg-red-600/90 backdrop-blur-xl border border-white/25 text-white px-2.5 py-0.5 rounded-full shadow-md w-fit">
                      <TrendingDown size={10} /> Save {pct}%
                    </span>
                  )}
                </div>
                <button
                  onClick={handleShare}
                  aria-label="Share this package"
                  className="absolute top-3.5 right-3.5 h-10 w-10 grid place-items-center rounded-full bg-background/80 backdrop-blur-md text-foreground hover:bg-background transition-all shadow-md"
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {highlights.map((h) => (
                  <div key={h.label} className="rounded-2xl border border-border bg-card p-3 text-center">
                    <h.icon size={17} className="mx-auto text-primary mb-1.5" />
                    <span className="text-[11px] font-semibold text-foreground leading-tight block">{h.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-2">
                {pkg.brand && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{pkg.brand}</span>
                )}
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  {pkg.name}
                </h1>
                {pkg.tagline && <p className="text-sm text-muted-foreground leading-relaxed">{pkg.tagline}</p>}
              </div>

              {/* Price */}
              <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Supplied &amp; Installed Price</p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-display text-3xl font-bold text-foreground">
                    {pkg.price != null ? <AnimatedCounter target={pkg.price} prefix="₦" /> : "Price on request"}
                  </span>
                  {wasPrice && savedAmount && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">{fmtN(wasPrice)}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <Tag size={11} /> Save {fmtN(savedAmount)}
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Includes site survey, all cabling, mounting, configuration and handover training.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAdd}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 py-3.5 text-sm font-bold transition-all ${addedAnim ? "bg-emerald-500 border-emerald-500 text-white" : "border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"}`}
                  >
                    <ShoppingBag size={16} /> {addedAnim ? "Added" : "Add to Cart"}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={buyingNow}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-70"
                  >
                    {buyingNow ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Buy Now
                  </button>
                </div>
                {pkg.price && pkg.price > 500_000 && (
                  <FlexiblePaymentButton itemName={pkg.name} itemType="package" itemId={pkg.id} price={pkg.price} />
                )}
                <button
                  onClick={() => openLeadForm(`cctv_pdp_${pkg.id}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Request a Free Site Survey
                </button>
              </div>

              <a
                href={whatsappLink(contact, `Hi Tioga, I'm interested in the ${pkg.name}. Please share installation timeline and what's included.`)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground">
                <ShieldCheck size={16} className="shrink-0 mt-0.5 text-primary" />
                <span>Installed by our own COREN-supervised engineers. We do not subcontract installation.</span>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included */}
        {pkg.specs.length > 0 && (
          <section className="section-container pb-10">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-5">What's included</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pkg.specs.map((spec) => (
                  <li key={spec} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-primary" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="section-container pb-10">
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Frequently asked</h2>
          <div className="space-y-2.5">
            {FAQS.map((f, i) => (
              <div key={f.q} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
                >
                  <span>{f.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
                </button>
                {openFaq === i && (
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="section-container pb-14">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Other CCTV packages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/packages/cctv/${r.id}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted/20">
                    <img src={r.image} alt={r.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{r.name}</p>
                    <p className="text-sm font-display font-bold text-primary">{fmtN(r.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default CctvPackageDetail;
