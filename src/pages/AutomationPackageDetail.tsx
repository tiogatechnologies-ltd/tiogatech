import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ShoppingBag, ShieldCheck, Loader2, Share2,
  Zap, CheckCircle2, Wrench, Sparkles, ArrowRight, Star,
  Flame, TrendingDown, Tag, Users, Phone, MessageCircle,
  ChevronDown, ChevronUp, Music, Home, Lightbulb, Shield,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { useCart } from "@/contexts/CartContext";
import { trackConversion } from "@/lib/tracking";
import { useHomeAutomationPackages, type HomeAutomationPackage } from "@/hooks/useHomeAutomationPackages";
import { openLeadForm } from "@/components/SiteHeader";
import { toast } from "sonner";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seoSchema";
import { PROMO_LIFT as AUTO_PROMO_LIFT, viewerCount as autoViewers, savingsPct as autoSavingsPct } from "@/lib/promoDisplay";

const fmtAuto = (p: HomeAutomationPackage) =>
  p.price_label ?? (p.price ? `From ₦${(p.price / 1_000_000).toFixed(1)}M` : "On request");

const fmtN = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const FAQS = [
  { q: "What does a home automation system actually do?", a: "It connects lighting, climate, curtains, entertainment and security into one app. You control everything from your phone or via voice — from anywhere in the world." },
  { q: "Is my internet required for the system to work?", a: "Core functions (local control, scenes, automations) work on your local network even without internet. Remote access and cloud integrations require connectivity." },
  { q: "How long does installation take?", a: "Typically 1–3 days for a full home depending on the tier. Our certified engineers handle all wiring, programming, and user training." },
  { q: "Can I add more devices later?", a: "Yes. All our automation tiers are modular and expandable. You can add rooms, devices, or upgrade your tier at any time." },
  { q: "Is there ongoing maintenance?", a: "We offer annual service packages. Software updates are pushed automatically. Hardware is covered by a 1-year warranty with optional extension." },
];

const TIER_FEATURES: Record<string, { icon: typeof Home; label: string }[]> = {
  Apex: [
    { icon: Home, label: "Full-home smart lighting" },
    { icon: Shield, label: "Integrated alarm & CCTV" },
    { icon: Lightbulb, label: "Scene & mood control" },
    { icon: Music, label: "Multi-room audio" },
  ],
  Aura: [
    { icon: Home, label: "Living room automation" },
    { icon: Lightbulb, label: "Smart switches & dimmers" },
    { icon: Music, label: "Single-zone audio" },
    { icon: Shield, label: "Smart doorbell & cameras" },
  ],
  Riviera: [
    { icon: Home, label: "Bedroom & lounge automation" },
    { icon: Lightbulb, label: "Smart plug control" },
    { icon: Music, label: "Bluetooth speaker setup" },
    { icon: Shield, label: "Smart lock integration" },
  ],
};

export const AutomationPackageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { packages, loading } = useHomeAutomationPackages();
  const [pkg, setPkg] = useState<HomeAutomationPackage | null>(null);
  const [related, setRelated] = useState<HomeAutomationPackage[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [addedAnim, setAddedAnim] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  useEffect(() => {
    if (!packages.length) return;
    const found = packages.find((p) => p.id === id) ?? null;
    setPkg(found);
    if (found) {
      setRelated(packages.filter((p) => p.id !== id).slice(0, 3));
      trackConversion("package_view", { package_id: id, type: "automation" });
    }
  }, [packages, id]);

  const handleAdd = () => {
    if (!pkg) return;
    add({
      refId: pkg.id,
      type: "package",
      name: `${pkg.name} — Home Automation`,
      price: fmtAuto(pkg),
      numericPrice: pkg.price ?? null,
      image: pkg.image,
      category: "smarthome",
    });
    trackConversion("cart_add", { source: "automation_detail", id: pkg.id });
    setAddedAnim(true);
    toast.success(`Added ${pkg.name} Automation Package to cart`);
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
      navigator.share({ title: `${pkg.name} Home Automation | Tioga`, url }).catch(() => {
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
          <p className="text-muted-foreground text-sm">This automation package may have been updated.</p>
          <button onClick={() => navigate("/packages?category=automation")} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">Browse Automation Packages</button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const pct = pkg.price ? autoSavingsPct(pkg.id) : null;
  const wasPrice = pkg.price ? Math.round(pkg.price * AUTO_PROMO_LIFT) : null;
  const savedAmount = pkg.price && wasPrice ? wasPrice - pkg.price : null;
  const viewers = autoViewers(pkg.id);
  const tierIcons = TIER_FEATURES[pkg.tier] ?? TIER_FEATURES["Riviera"];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${pkg.name} Home Automation Package`,
      description: pkg.description,
      brand: { "@type": "Brand", name: "Tioga Technologies" },
      offers: {
        "@type": "Offer",
        priceCurrency: "NGN",
        ...(pkg.price ? { price: pkg.price } : {}),
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/packages/automation/${pkg.id}`,
        seller: { "@type": "Organization", name: "Tioga Technologies" },
      },
    },
    breadcrumbJsonLd([
      { name: "Packages", path: "/packages" },
      { name: "Home Automation", path: "/packages?category=automation" },
      { name: pkg.name, path: `/packages/automation/${pkg.id}` },
    ]),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${pkg.name} Home Automation Package | Tioga Technologies`}
        description={`${pkg.description.slice(0, 160)}. Includes: ${pkg.features.slice(0, 3).join(", ")}.`}
        path={`/packages/automation/${pkg.id}`}
        image={pkg.image}
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
              <li><Link to="/packages?category=automation" className="hover:text-primary transition-colors">Home Automation</Link></li>
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
                <img src={pkg.image} alt={`${pkg.name} Home Automation`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/20 to-transparent" />

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {pkg.badge && <span className="text-[11px] font-bold bg-gold text-midnight px-3 py-1 rounded-full shadow">{pkg.badge}</span>}
                  {pct && (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold bg-red-500 text-white px-3 py-1 rounded-full shadow">
                      <TrendingDown size={11} /> Save {pct}%
                    </span>
                  )}
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-midnight/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  {viewers} viewing now
                </div>

                <div className="absolute bottom-0 inset-x-0 p-5">
                  <p className="text-[11px] uppercase tracking-widest text-white/70 mb-1">{pkg.tagline}</p>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight">{pkg.name}</h1>
                </div>
              </div>

              {/* Tier highlights */}
              <div className="grid grid-cols-2 gap-3">
                {tierIcons.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon size={15} />
                    </span>
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-6 space-y-5">

              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                    {pkg.tier} Tier · Home Automation
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-tight no-clip">{pkg.name} Package</h2>
                  {pkg.tagline && <p className="text-sm text-muted-foreground mt-1">{pkg.tagline}</p>}
                </div>
                <button onClick={handleShare} className="shrink-0 p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground transition-all" aria-label="Share">
                  <Share2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={14} className="fill-gold text-gold" />)}
                  <span className="text-xs text-muted-foreground ml-1">5.0 (12 installs)</span>
                </div>
                <span className="text-xs text-muted-foreground">·</span>
                <div className="flex items-center gap-1 text-xs">
                  <Users size={12} className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">1 booked this week</span>
                </div>
              </div>

              {/* Price */}
              <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Package Investment</p>
                <div className="flex items-end gap-4 mb-2">
                  <span className="text-4xl font-display font-bold text-foreground leading-none">{fmtAuto(pkg)}</span>
                  {wasPrice && savedAmount && (
                    <div className="flex flex-col pb-1">
                      <span className="text-sm text-muted-foreground line-through">From {fmtN(wasPrice)}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Save {fmtN(savedAmount)} ({pct}%)</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Tag size={11} className="text-primary" /> Full system: devices, wiring, programming & installation
                </p>
              </div>

              {/* Urgency */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
                <Flame size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Installation slots filling up.</span>
                  <span className="text-xs block mt-0.5 opacity-80">Book this month to lock in the current price.</span>
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
                {pkg.price && pkg.price > 500_000 && (
                  <FlexiblePaymentButton itemName={`${pkg.name} Home Automation`} itemType="package" itemId={pkg.id} price={pkg.price} />
                )}
                <button
                  onClick={() => openLeadForm(`automation_pdp_${pkg.id}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all"
                >
                  <Sparkles size={15} className="text-gold" /> Schedule Free Consultation
                </button>
              </div>

              <a
                href={`https://wa.me/2348178000023?text=${encodeURIComponent(`Hi Tioga, I'm interested in the ${pkg.name} Home Automation package. Please share installation timeline and what's included.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="bg-muted/30 section-padding py-12">
          <div className="section-container">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2 no-clip">What's Included</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">{pkg.description}</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                  <Home size={13} /> Smart Home Features
                </p>
                <div className="space-y-2">
                  {pkg.features.map((f) => (
                    <div key={f} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                      <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {pkg.entertainment.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground mb-3 flex items-center gap-2">
                    <Music size={13} /> Entertainment
                  </p>
                  <div className="space-y-2">
                    {pkg.entertainment.map((e) => (
                      <div key={e} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                        <Music size={15} className="text-gold shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Value summary */}
            {wasPrice && savedAmount && (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
                  <TrendingDown size={16} /> What You Save Versus Building it Separately
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "Individual Retail", value: `From ${fmtN(wasPrice)}`, muted: true },
                    { label: "Bundle Price", value: fmtAuto(pkg), highlight: true },
                    { label: "You Save", value: `${fmtN(savedAmount)} (${pct}%)`, green: true },
                  ].map(({ label, value, muted, highlight, green }) => (
                    <div key={label} className={`p-3 rounded-xl text-center ${highlight ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</p>
                      <p className={`font-display font-bold text-base ${green ? "text-emerald-600 dark:text-emerald-400" : muted ? "line-through text-muted-foreground text-sm" : ""}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Finance */}
        {pkg.price && pkg.price > 500_000 && (
          <section className="section-padding py-10">
            <div className="section-container">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2 no-clip">Finance This Package</h2>
                <p className="text-sm text-muted-foreground mb-6">Split into comfortable monthly payments with Tioga Finance.</p>
                <FlexiblePaymentButton itemName={`${pkg.name} Home Automation`} itemType="package" itemId={pkg.id} price={pkg.price} />
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="bg-muted/30 section-padding py-12">
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
          <section className="section-padding py-12">
            <div className="section-container">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground no-clip">Other Tiers</h2>
                <Link to="/packages?category=automation" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link key={r.id} to={`/packages/automation/${r.id}`} className="group rounded-2xl border border-border bg-card overflow-hidden hover-lift transition-all">
                    <div className="relative h-36 overflow-hidden">
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <p className="text-[10px] text-white/70 mb-0.5">{r.tier} Tier</p>
                        <p className="text-sm font-bold text-white">{r.name}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-display font-bold text-foreground">{fmtAuto(r)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">View package <ArrowRight size={11} /></p>
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
              <Sparkles size={24} className="mx-auto mb-3" />
              <h3 className="text-xl font-display font-bold mb-2 no-clip">Want a custom automation plan?</h3>
              <p className="text-sm text-primary-foreground/80 mb-5">Our home automation designers will create a bespoke system for your floor plan — free consultation.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => openLeadForm("automation_pdp_bottom")} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 transition-all">
                  <Sparkles size={15} /> Free Consultation
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
            <p className="text-xs text-muted-foreground">{pkg.tier} Tier</p>
            <p className="font-display font-bold text-foreground text-base leading-none">{fmtAuto(pkg)}</p>
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

export default AutomationPackageDetail;
