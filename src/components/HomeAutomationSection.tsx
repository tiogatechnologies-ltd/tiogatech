import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Music, Home, ShoppingBag, TrendingDown, Flame, Tag, Loader2, Star, ShoppingCart, Heart, Eye, Users } from "lucide-react";
import { useHomeAutomationPackages, type HomeAutomationPackage } from "@/hooks/useHomeAutomationPackages";
import { openLeadForm } from "@/components/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";
import { savingsPct, wasPrice as calcWasPrice, savedAmount as calcSavedAmount } from "@/lib/promoDisplay";

const fmtAuto = (p: HomeAutomationPackage) =>
  p.price_label ?? (p.price ? `From ₦${(p.price / 1_000_000).toFixed(1)}M` : "On request");

const PackageCard = ({ p, i }: { p: HomeAutomationPackage; i: number }) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const isSaved = isInWishlist(p.id);

  const hasPrice = !!(p.price && p.price > 0);
  // Strikethrough only appears when a genuine previous price is recorded.
  const compareAt = (p as any).compare_at_price ?? null;
  const pct = savingsPct(p.price, compareAt);
  const wasPriceVal = calcWasPrice(p.price, compareAt);
  const savedAmount = calcSavedAmount(p.price, compareAt);
  const monthlyEst = p.price ? Math.round(p.price / 3) : null;

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    add({
      refId: p.id,
      type: "package",
      name: `${p.name} - Home Automation`,
      price: fmtAuto(p),
      numericPrice: p.price ?? null,
      image: p.image,
      category: "smarthome",
    });
    trackConversion("cart_add", { source: "home_automation", id: p.id });
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(p.id, `${p.name} - Home Automation`);
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
      id={`automation-${p.id}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
        <Link to={`/packages/automation/${p.id}`} className="block w-full h-full">
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Top-left Promo / Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          {pct ? (
            <span className="px-2.5 py-1 rounded-full bg-red-600/95 backdrop-blur-md border border-white/25 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
              <TrendingDown size={11} /> Save {pct}%
            </span>
          ) : p.badge ? (
            <span className="px-2.5 py-1 rounded-full bg-primary/95 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              {p.badge}
            </span>
          ) : null}
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
            to={`/packages/automation/${p.id}`}
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
        {/* Category, Tier & Rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 gap-2">
          <span className="uppercase tracking-wider font-semibold text-[10px] text-primary truncate">
            {p.badge ? `${p.badge} Tier · ` : ""}{p.tagline || "Smart Living"}
          </span>
          <div className="flex items-center gap-1 font-medium text-amber-500 shrink-0">
            <Star size={13} fill="currentColor" />
            <span className="text-foreground font-bold">5.0</span>
            <span className="text-muted-foreground text-[10px]">({12 + ((p.name || "").length * 3) % 15})</span>
          </div>
        </div>

        {/* Product Title */}
        <Link
          to={`/packages/automation/${p.id}`}
          className="font-display font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-2"
        >
          {p.name}
        </Link>

        {/* Highlights / Specs Chips */}
        {Array.isArray(p.features) && p.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {p.features.slice(0, 3).map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium flex items-center gap-1 max-w-full"
              >
                <Check size={10} className="text-primary shrink-0" />
                <span className="truncate">{f}</span>
              </span>
            ))}
          </div>
        )}


        {/* Price & Financing */}
        <div className="mt-auto pt-3 border-t border-border/60">
          <div className="flex items-start justify-between gap-1.5 mb-1.5 flex-wrap">
            <div className="min-w-0 flex-1">
              {/* Main Price */}
              <p className="text-base sm:text-lg font-display font-bold text-foreground leading-tight">
                {fmtAuto(p)}
              </p>
              {/* Was Price (slashed) */}
              {wasPriceVal && savedAmount && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    {wasPriceVal >= 1_000_000
                      ? `From ₦${(wasPriceVal / 1_000_000).toFixed(1)}M`
                      : `₦${Math.round(wasPriceVal).toLocaleString("en-NG")}`}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 whitespace-nowrap">
                    <Tag size={9} /> Save ₦{Math.round(savedAmount).toLocaleString("en-NG")}
                  </span>
                </div>
              )}
              {monthlyEst && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Or from <strong className="text-primary">₦{monthlyEst.toLocaleString()}/mo</strong>
                </p>
              )}
            </div>

            {/* Ready to Install badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ready to Install
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              to={`/packages/automation/${p.id}`}
              className="py-2 px-2.5 sm:px-3 rounded-xl font-semibold text-xs border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center gap-1 transition-all text-center"
            >
              <span className="truncate">View Details</span> <ArrowRight size={12} className="shrink-0" />
            </Link>
            <button
              onClick={handleAdd}
              className={`py-2 px-2.5 sm:px-3 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-1 transition-all ${
                addedAnim
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {addedAnim ? (
                <><Check size={12} className="shrink-0" /> <span className="truncate">Added</span></>
              ) : (
                <><ShoppingCart size={12} className="shrink-0" /> <span className="truncate">Add to Cart</span></>
              )}
            </button>
          </div>

          <div className="mt-2">
            <FlexiblePaymentButton itemName={p.name} itemType="automation" itemId={p.id} price={p.price ?? null} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const HomeAutomationSection = () => {
  const { packages, loading } = useHomeAutomationPackages();

  if (loading) {
    return (
      <section id="home-automation" data-no-reveal className="section-padding scroll-mt-24">
        <div className="section-container flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (packages.length === 0) return null;

  return (
    <section id="home-automation" data-no-reveal className="section-padding scroll-mt-32">
      <div className="section-container">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">
            Home Automation
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
            Whole-home automation tiers
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Three curated levels of smart living. From essential security and voice control to a fully automated luxury ecosystem with motorised gates and Starlink.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p, i) => (
            <PackageCard key={p.id} p={p} i={i} />
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight mb-2 no-clip">
            Want a custom blend?
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto mb-5 text-sm">
            Mix and match features across tiers. Tell us your home size and goals and we will design a tailored automation plan.
          </p>
          <button
            onClick={() => openLeadForm("home_automation_custom")}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
          >
            Design my smart home
          </button>
        </div>
      </div>
    </section>
  );
};

export default HomeAutomationSection;
