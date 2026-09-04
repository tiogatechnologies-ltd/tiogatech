import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ShoppingBag, ShieldCheck, Loader2, Share2,
  Zap, CheckCircle2, Wrench, Clock, ArrowRight, Check,
  Sun, Battery, Cpu, Flame, TrendingDown, Tag, Users, Star,
  ChevronDown, ChevronUp, Phone, MessageCircle,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { useCart } from "@/contexts/CartContext";
import { trackConversion } from "@/lib/tracking";
import { useSolarPackages, type SolarPackage } from "@/hooks/useSolarPackages";
import { openLeadForm } from "@/components/SiteHeader";
import { toast } from "sonner";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seoSchema";
import { PROMO_LIFT, viewerCount, savingsPct } from "@/lib/promoDisplay";

// Cosmetic promo helpers - real prices never change

const fmtN = (n: number | null) =>
  n == null ? "-" : `₦${Math.round(n).toLocaleString("en-NG")}`;

const FAQS = [
  { q: "Is installation included?", a: "Yes - every solar package includes certified engineer installation. We schedule within 48–72 hours of order confirmation." },
  { q: "Can I upgrade the battery bank later?", a: "Absolutely. Our hybrid inverters are designed to be modular. You can add battery units at any time." },
  { q: "What happens when NEPA brings light?", a: "The hybrid inverter automatically switches to grid power and recharges the batteries. Zero manual input required." },
  { q: "What warranty do I get?", a: "5-year warranty on inverters, 3-year on batteries, 10-year performance guarantee on solar panels." },
  { q: "What if my load exceeds the system rating?", a: "The inverter will prioritise critical appliances and raise an alert. We recommend the free load sizing calculator before purchase." },
];

const IDEAL_FOR = [
  { label: "Family Homes", icon: "🏠", desc: "Power lighting, fans, TV, fridge, and phone charging 24/7." },
  { label: "Home Offices", icon: "💻", desc: "Uninterrupted power for routers, laptops, and workstations." },
  { label: "Small Businesses", icon: "🏪", desc: "Keep point-of-sale, fridges and security cameras running." },
  { label: "Event Venues", icon: "🎪", desc: "Reliable backup for lighting and AV equipment." },
];

export const SolarPackageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { packages, loading } = useSolarPackages();
  const [pkg, setPkg] = useState<SolarPackage | null>(null);
  const [related, setRelated] = useState<SolarPackage[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [addedAnim, setAddedAnim] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  useEffect(() => {
    if (!packages.length) return;
    const found = packages.find((p) => p.id === id) ?? null;
    setPkg(found);
    if (found) {
      setRelated(
        packages
          .filter((p) => p.id !== id && p.battery_type === found.battery_type)
          .slice(0, 3)
      );
      trackConversion("package_view", { package_id: id, type: "solar" });
    }
  }, [packages, id]);

  const handleAdd = () => {
    if (!pkg) return;
    add({
      refId: pkg.id,
      type: "package",
      name: `Solar Package #${pkg.package_number} - ${pkg.inverter}`,
      price: fmtN(pkg.total_price),
      numericPrice: pkg.total_price,
      image: pkg.image,
      category: "solar",
    });
    trackConversion("cart_add", { source: "solar_detail", id: pkg.id });
    setAddedAnim(true);
    toast.success(`Added Solar Package #${pkg.package_number} to cart`);
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
      navigator.share({ title: `${pkg.inverter} Solar Package | Tioga`, url }).catch(() => {
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

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="flex-1 section-container py-24 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Package Not Found</h1>
          <p className="text-muted-foreground text-sm">This package may have been updated or discontinued.</p>
          <button
            onClick={() => navigate("/packages?category=solar")}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
          >
            Browse Solar Packages
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const pct = savingsPct(pkg.package_number);
  const wasPrice = Math.round(pkg.total_price * PROMO_LIFT);
  const savedAmount = wasPrice - pkg.total_price;
  const viewers = viewerCount(pkg.package_number);
  const batteryLabel = pkg.battery_type === "lithium" ? "Lithium LiFePO₄" : pkg.battery_type === "high_voltage" ? "High Voltage" : "Tubular / Gel";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `Solar Package #${pkg.package_number} - ${pkg.inverter}`,
      description: `Pre-engineered ${pkg.inverter} solar system with ${pkg.battery} battery bank and ${pkg.solar_panels}. Powers: ${pkg.appliances}.`,
      brand: { "@type": "Brand", name: "Tioga Technologies (LumiVolt)" },
      offers: {
        "@type": "Offer",
        priceCurrency: "NGN",
        price: pkg.total_price,
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/packages/solar/${pkg.id}`,
        seller: { "@type": "Organization", name: "Tioga Technologies" },
      },
    },
    breadcrumbJsonLd([
      { name: "Packages", path: "/packages" },
      { name: "Solar", path: "/packages?category=solar" },
      { name: `Package #${pkg.package_number}`, path: `/packages/solar/${pkg.id}` },
    ]),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`Solar Package #${pkg.package_number} - ${pkg.inverter} | Tioga Technologies`}
        description={`Pre-engineered ${pkg.inverter} solar system (${batteryLabel}) with ${pkg.solar_panels}. Powers: ${pkg.appliances}. Installed in 48 hours. Price: ${fmtN(pkg.total_price)}.`}
        path={`/packages/solar/${pkg.id}`}
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
              <li><Link to="/packages?category=solar" className="hover:text-primary transition-colors">Solar</Link></li>
              <ChevronRight size={12} />
              <li className="text-foreground font-medium line-clamp-1">Package #{pkg.package_number}</li>
            </ol>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="section-container py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Left: Image */}
            <div className="lg:col-span-6 lg:sticky lg:top-28 space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] aspect-[4/3]">
                <img
                  src={pkg.image}
                  alt={`${pkg.inverter} Solar System`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-midnight/80" />

                {/* Badges on image */}
                <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 max-w-[60%]">
                  <span className="text-[10px] font-bold bg-gold text-midnight px-2.5 py-0.5 rounded-full shadow w-fit">
                    #{pkg.package_number}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-extrabold bg-red-500 text-white px-2.5 py-0.5 rounded-full shadow w-fit">
                    <TrendingDown size={10} /> Save {pct}%
                  </span>
                  {pkg.badge && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full shadow w-fit">
                      {pkg.badge}
                    </span>
                  )}
                </div>

                {/* Viewer count */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-midnight/75 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  {viewers} viewing
                </div>

                {/* Bottom of image: name */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                  <p className="text-[10px] uppercase tracking-widest text-white/80 mb-1">{batteryLabel} System</p>
                  <h1 className="text-lg sm:text-2xl font-display font-bold text-white leading-tight">{pkg.inverter}</h1>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { icon: ShieldCheck, label: "5-Yr Warranty", sub: "Inverter & Panels" },
                  { icon: Wrench, label: "Pro Install", sub: "Within 48–72h" },
                  { icon: Clock, label: "Live Support", sub: "Mon–Sat, 8am–6pm" },
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

              {/* Title + share */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                    LumiVolt Solar · {batteryLabel}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-tight no-clip">
                    {pkg.inverter}
                  </h2>
                  {pkg.tagline && <p className="text-sm text-muted-foreground mt-1">{pkg.tagline}</p>}
                </div>
                <button
                  onClick={handleShare}
                  className="shrink-0 p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  aria-label="Share"
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={14} className="fill-gold text-gold" />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">4.9 (38 installs)</span>
                </div>
                <span className="text-xs text-muted-foreground">·</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={12} className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">3 purchased this week</span>
                </div>
              </div>

              {/* Price block */}
              <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Bundle Installation Price</p>
                <div className="flex items-end gap-4 mb-2">
                  <span className="text-4xl font-display font-bold text-foreground leading-none">{fmtN(pkg.total_price)}</span>
                  <div className="flex flex-col pb-1">
                    <span className="text-sm text-muted-foreground line-through">{fmtN(wasPrice)}</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      You save {fmtN(savedAmount)} ({pct}%)
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Tag size={11} className="text-primary" />
                  Includes all components + professional installation
                </p>
              </div>

              {/* Urgency */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
                <Flame size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Bundle pricing valid this week only.</span>
                  <span className="text-xs block mt-0.5 opacity-80">Contact us to lock in this price before month-end.</span>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAdd}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 py-3.5 text-sm font-bold transition-all ${
                      addedAnim
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                    }`}
                  >
                    <ShoppingBag size={16} />
                    {addedAnim ? "Added! ✓" : "Add to Cart"}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={buyingNow}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-70"
                  >
                    {buyingNow ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    Buy Now
                  </button>
                </div>
                <FlexiblePaymentButton itemName={`${pkg.inverter} Solar Package`} itemType="package" itemId={pkg.id} price={pkg.total_price} />
                <button
                  onClick={() => openLeadForm(`solar_pdp_${pkg.id}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Request Custom Engineering
                </button>
              </div>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/2348178000023?text=${encodeURIComponent(`Hi Tioga, I'm interested in Solar Package #${pkg.package_number} - ${pkg.inverter} (${fmtN(pkg.total_price)}). Please share installation timeline.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <MessageCircle size={15} /> Chat on WhatsApp to ask questions
              </a>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="bg-muted/30 section-padding py-12">
          <div className="section-container">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2 no-clip">What's Included</h2>
            <p className="text-sm text-muted-foreground mb-8">Everything below is included in the bundle price - no hidden extras.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Cpu, label: "Inverter", value: pkg.inverter, price: pkg.inverter_price },
                { icon: Sun, label: "Solar Panels", value: pkg.solar_panels, price: pkg.solar_panels_price },
                { icon: Battery, label: "Battery Bank", value: pkg.battery, price: pkg.battery_price },
                ...(pkg.charge_controller && pkg.charge_controller !== "NIL"
                  ? [{ icon: Zap, label: "Charge Controller", value: pkg.charge_controller, price: pkg.charge_controller_price }]
                  : []),
                { icon: Wrench, label: "Accessories & Cabling", value: "DC breakers, surge protector, cabling, mounting", price: pkg.accessories_price },
                { icon: CheckCircle2, label: "Professional Installation", value: "Certified Tioga engineers - 48–72h scheduling", price: pkg.setup_fee },
              ].map(({ icon: Icon, label, value, price }) => (
                <div key={label} className="flex gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                    <p className="text-sm font-bold text-foreground leading-snug mt-0.5">{value}</p>
                    {price != null && price > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Retail: {fmtN(price)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bundle savings breakdown */}
            <div className="mt-8 p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
                <TrendingDown size={16} /> Bundle Savings vs. Buying Separately
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: "Individual Retail Total", value: fmtN(wasPrice), muted: true },
                  { label: "Bundle Price", value: fmtN(pkg.total_price), highlight: true },
                  { label: "You Save", value: `${fmtN(savedAmount)} (${pct}%)`, green: true },
                ].map(({ label, value, muted, highlight, green }) => (
                  <div key={label} className={`p-3 rounded-xl text-center ${highlight ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</p>
                    <p className={`font-display font-bold text-lg ${green ? "text-emerald-600 dark:text-emerald-400" : muted ? "line-through text-muted-foreground text-base" : ""}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Appliances Powered */}
        <section className="section-padding py-12">
          <div className="section-container">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2 no-clip">What This System Powers</h2>
            <p className="text-sm text-muted-foreground mb-6">{pkg.appliances}</p>

            <h3 className="text-lg font-display font-semibold text-foreground mb-4 no-clip">Ideal For</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {IDEAL_FOR.map(({ label, icon, desc }) => (
                <div key={label} className="p-4 rounded-2xl bg-card border border-border text-center">
                  <div className="text-3xl mb-2">{icon}</div>
                  <p className="text-sm font-bold text-foreground mb-1">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Finance Calculator */}
        {pkg.total_price > 500_000 && (
          <section className="bg-muted/30 section-padding py-10">
            <div className="section-container">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2 no-clip">Finance This Package</h2>
                <p className="text-sm text-muted-foreground mb-6">Split the cost into manageable monthly payments with our Tioga Finance options.</p>
                <FlexiblePaymentButton itemName={`${pkg.inverter} Solar Package`} itemType="package" itemId={pkg.id} price={pkg.total_price} />
              </div>
            </div>
          </section>
        )}

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
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Packages */}
        {related.length > 0 && (
          <section className="bg-muted/30 section-padding py-12">
            <div className="section-container">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground no-clip">Similar Packages</h2>
                <Link to="/packages?category=solar" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/packages/solar/${r.id}`}
                    className="group rounded-2xl border border-border bg-card overflow-hidden hover-lift transition-all"
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img src={r.image} alt={r.inverter} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-midnight/80" />
                      <div className="absolute bottom-3 left-3">
                        <p className="text-[10px] text-white/70 mb-0.5">#{r.package_number}</p>
                        <p className="text-sm font-bold text-white leading-tight line-clamp-2">{r.inverter}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-display font-bold text-foreground">{fmtN(r.total_price)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        View package <ArrowRight size={11} />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA banner */}
        <section className="section-padding py-10">
          <div className="section-container">
            <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground">
              <h3 className="text-xl font-display font-bold mb-2 no-clip">Need help choosing the right package?</h3>
              <p className="text-sm text-primary-foreground/80 mb-5">Our energy engineers will size the perfect system for your load profile - free of charge.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => openLeadForm("solar_pdp_bottom")}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 transition-all"
                >
                  Get AI Recommendation
                </button>
                <a
                  href="tel:+2348178000023"
                  className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/20 transition-all"
                >
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
            <p className="text-xs text-muted-foreground truncate">Package #{pkg.package_number}</p>
            <p className="font-display font-bold text-foreground text-base leading-none">{fmtN(pkg.total_price)}</p>
          </div>
          <button
            onClick={handleAdd}
            className={`px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all shrink-0 ${
              addedAnim ? "border-emerald-500 bg-emerald-500 text-white" : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {addedAnim ? "Added ✓" : "Cart"}
          </button>
          <button
            onClick={handleBuyNow}
            className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all shrink-0 shadow-lg shadow-primary/30"
          >
            Buy Now
          </button>
        </div>
      </div>
      {/* Spacer for sticky bar on mobile */}
      <div className="h-20 lg:hidden" />

      <SiteFooter />
    </div>
  );
};

export default SolarPackageDetail;
