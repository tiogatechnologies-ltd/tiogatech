import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Lightbulb, Smartphone, Music, Wifi, Check, ShoppingBag, Eye, ShieldCheck, Cpu, Sliders, Zap, TrendingDown, Tag, Star, ShoppingCart, Heart, Users, Flame, ArrowRight } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useHomeAutomationPackages, type HomeAutomationPackage } from "@/hooks/useHomeAutomationPackages";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import bgAutomation from "@/assets/bg-voltai-ai.jpg";
import featureApp from "@/assets/feature-smart-app.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";
import { PROMO_LIFT, viewerCount, savingsPct, soldCount, wasPrice as calcWasPrice } from "@/lib/promoDisplay";

const fmt = (p: HomeAutomationPackage) =>
  p.price_label ?? (p.price ? `From ₦${(p.price / 1_000_000).toFixed(1)}M` : "Custom Quote");

const PackageCard = ({ pkg, i }: { pkg: HomeAutomationPackage; i: number }) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const isSaved = isInWishlist(pkg.id);

  const hasPrice = !!(pkg.price && pkg.price > 0);
  const pct = hasPrice ? savingsPct(pkg.id) : null;
  const wasPriceVal = hasPrice ? calcWasPrice(pkg.price!) : null;
  const savedAmount = hasPrice && wasPriceVal ? wasPriceVal - pkg.price! : null;
  const viewers = viewerCount(pkg.id);
  const sold = soldCount(pkg.id);
  const monthlyEst = pkg.price ? Math.round(pkg.price / 3) : null;

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    add({
      id: `automation-${pkg.id}`,
      refId: pkg.id,
      type: "package",
      name: pkg.name,
      price: fmt(pkg),
      numericPrice: pkg.price || 0,
      category: "Home Automation",
      image: pkg.image,
    });
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(pkg.id, `${pkg.name} - Home Automation`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`automation-${pkg.id}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
        <Link to={`/packages/automation/${pkg.id}`} className="block w-full h-full">
          <img
            src={pkg.image}
            alt={pkg.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Left Badges (top-left stack) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none max-w-[65%]">
          {pct && (
            <span className="px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur-md border border-white/25 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1 w-fit">
              <TrendingDown size={10} /> Save {pct}%
            </span>
          )}
          {pkg.badge && (
            <span className="px-2 py-0.5 rounded-full bg-gold/90 backdrop-blur-md border border-gold/40 text-midnight text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md w-fit">
              {pkg.badge}
            </span>
          )}
        </div>

        {/* Live Viewers (bottom-left overlay on image) */}
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
          <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-semibold bg-midnight/75 backdrop-blur-md border border-white/20 text-white px-2 py-0.5 rounded-full shadow-md">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            {viewers} viewing
          </span>
        </div>

        {/* Floating Action Buttons (top-right) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlist}
            aria-label={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
              isSaved
                ? "bg-red-500 text-white shadow-red-500/20 scale-110"
                : "bg-background/80 hover:bg-background text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>

          <Link
            to={`/packages/automation/${pkg.id}`}
            aria-label="View Details"
            className="p-2 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground backdrop-blur-md transition-all shadow-md flex items-center justify-center"
          >
            <Eye size={15} />
          </Link>
        </div>

        {/* Quick Add Overlay on Hover */}
        <div
          className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <button
            onClick={handleAdd}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
              addedAnim
                ? "bg-emerald-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {addedAnim ? (
              <>
                <Check size={14} className="animate-bounce" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Quick Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span className="uppercase tracking-wider font-semibold text-[10px] text-primary">
            {pkg.tagline || "Smart Living"}
          </span>
          <div className="flex items-center gap-1 font-medium text-amber-500">
            <Star size={13} fill="currentColor" />
            <span className="text-foreground font-bold">5.0</span>
            <span className="text-muted-foreground text-[10px]">({12 + ((pkg.name || "").length * 3) % 15})</span>
          </div>
        </div>

        {/* Product Title */}
        <Link
          to={`/packages/automation/${pkg.id}`}
          className="font-display font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-2"
        >
          {pkg.name}
        </Link>

        {/* Highlights / Specs Chips */}
        {Array.isArray(pkg.features) && pkg.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pkg.features.slice(0, 3).map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium flex items-center gap-1"
              >
                <Check size={10} className="text-primary shrink-0" />
                <span>{f}</span>
              </span>
            ))}
          </div>
        )}

        {/* Social Proof Urgency */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3">
          <Users size={11} className="text-emerald-500 shrink-0" />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{sold} installed this month</span>
          <span className="opacity-50">·</span>
          <Flame size={11} className="text-amber-500 shrink-0" />
          <span className="text-amber-600 dark:text-amber-400 font-semibold">In demand</span>
        </div>

        {/* Price & Financing */}
        <div className="mt-auto pt-3 border-t border-border/60">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              {/* Main Price */}
              <p className="text-base sm:text-lg font-display font-bold text-foreground leading-none">
                {fmt(pkg)}
              </p>
              {/* Was Price (slashed) */}
              {wasPriceVal && savedAmount && (
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    {wasPriceVal >= 1_000_000
                      ? `From ₦${(wasPriceVal / 1_000_000).toFixed(1)}M`
                      : `₦${Math.round(wasPriceVal).toLocaleString("en-NG")}`}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 whitespace-nowrap">
                    <Tag size={9} /> Save ₦{Math.round(savedAmount).toLocaleString("en-NG")}
                  </span>
                </div>
              )}
              {monthlyEst && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Or from <strong className="text-primary">₦{monthlyEst.toLocaleString()}/mo</strong>
                </p>
              )}
            </div>

            {/* Ready to Install badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ready to Install
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              to={`/packages/automation/${pkg.id}`}
              className="py-2 px-3 rounded-xl font-semibold text-xs border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center gap-1.5 transition-all text-center"
            >
              View Details <ArrowRight size={12} />
            </Link>
            <button
              onClick={handleAdd}
              className={`py-2 px-3 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all ${
                addedAnim
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {addedAnim ? (
                <><Check size={12} /> Added</>
              ) : (
                <><ShoppingCart size={12} /> Add to Cart</>
              )}
            </button>
          </div>

          <div className="mt-2">
            <FlexiblePaymentButton itemName={pkg.name} itemType="automation" itemId={pkg.id} price={pkg.price ?? null} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const HomeAutomation = () => {
  const { packages: items, loading } = useHomeAutomationPackages();
  const { add } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Smart Home Automation - Intelligent Lighting, Curtains & Climate in Nigeria"
        description="Experience luxury smart home living with VoltAi automated lighting, voice control, smart curtain tracks, and multi-room audio installed across Nigeria."
        path="/home-automation"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Home Automation", path: "/home-automation" }]),
          serviceJsonLd({
            name: "Tioga Home Automation Systems",
            description: "Smart lighting, climate control, automated curtains, and voice integration designed for Nigerian homes.",
            path: "/home-automation",
            serviceType: "Smart Home & IoT System Installation",
          }),
        ]}
      />
      <SiteHeader />

      <PageHero
        eyebrow="Intelligent Home IoT · VoltAi"
        title="One Touch. Complete Home Orchestration."
        subtitle="Transform your residence with intelligent scene lighting, motorized curtain automation, smart air-conditioning controls, and voice-assisted living designed for Nigeria."
        backgroundImage={bgAutomation}
        backgroundAlt="Modern luxury living room with ambient smart lighting and digital interface"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openLeadForm("home_automation_hero")}
            className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary/90 backdrop-blur-xl border border-primary/60 border-t-white/40 px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.25)]"
          >
            Request Custom Automation Plan
          </button>
          <Link
            to="/retail?category=Home+Automation"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
          >
            <ShoppingBag size={16} /> Shop IoT Switches & Modules
          </Link>
        </div>
      </PageHero>

      {/* Feature Capabilities Grid */}
      <section className="section-padding bg-muted/30">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              What Tioga Smart Automation Unifies
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              All sub-systems work in harmony under a single interface with local offline reliability.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Lightbulb size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Smart Lighting & Moods</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Touch glass switches, RGB ambient strips, motion pathway sensors, and scheduled welcome scenes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Sliders size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Climate & AC Control</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                IR smart controllers turn on your ACs before you arrive home and auto-throttle when on solar battery backup.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Home size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Motorized Curtains</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Ultra-quiet motorized tracks that glide open at sunrise and close for night privacy via schedule or voice command.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Music size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Multi-Room Audio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Ceiling flush architectural speakers with Bluetooth/AirPlay streaming for dinner, cinema, or outdoor patio entertainment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Package Configurations */}
      <main className="flex-1 section-padding py-12">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Curated Packages</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Turnkey Smart Home Setups
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Engineered turnkey packages customized for apartments, duplexes, and luxury detached mansions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {items.map((pkg, i) => (
              <PackageCard key={pkg.id} pkg={pkg} i={i} />
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HomeAutomation;
