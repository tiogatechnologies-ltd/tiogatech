import { useSiteSetting } from "@/hooks/useSiteSetting";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Battery, Sun, Zap, Cpu, Check, ArrowRight, ShoppingBag, Clock, Tag, TrendingDown, Flame, Loader2 } from "lucide-react";
import { useSolarPackages, type SolarPackage, getSolarPackageImage } from "@/hooks/useSolarPackages";
import { openLeadForm } from "@/components/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";

import { useWishlist } from "@/hooks/useWishlist";
import { Star, ShoppingCart, Heart, Eye } from "lucide-react";
import { savingsPct, wasPrice as calcWasPrice, savedAmount as calcSavedAmount, resolveCompareAt } from "@/lib/promoDisplay";
import { useLandingContent } from "@/hooks/useLandingContent";

const fmtPrice = (n: number | null) =>
  n == null ? "-" : `₦${Math.round(n).toLocaleString("en-NG")}`;

const PackageCard = ({ p, i }: { p: SolarPackage; i: number }) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const isSaved = isInWishlist(p.id);

  // Cosmetic promo values - real price is always p.total_price
  // Strikethrough only appears when a genuine previous price is recorded.
  const { settings: promos } = useSiteSetting("promotions");
  const compareAt = resolveCompareAt(p.total_price, (p as any).compare_at_price, promos, p.id);
  const pct = savingsPct(p.total_price, compareAt);
  const wasPrice = calcWasPrice(p.total_price, compareAt);
  const savedAmount = calcSavedAmount(p.total_price, compareAt);
  const monthlyEst = Math.round(p.total_price / 3);

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    add({
      refId: p.id,
      type: "package",
      name: `Solar Package #${p.package_number} - ${p.inverter}`,
      price: fmtPrice(p.total_price),
      numericPrice: p.total_price,
      image: p.image,
      category: "solar",
    });
    trackConversion("cart_add", { source: "solar_package", id: p.package_number });
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(p.id, `Solar Package #${p.package_number} - ${p.inverter}`);
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
      id={`pkg-${p.package_number}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/15 flex items-center justify-center">
        <Link to={`/packages/solar/${p.id}`} className="block w-full h-full p-3 sm:p-4 flex items-center justify-center">
          <img
            src={p.image}
            alt={p.inverter}
            loading="lazy"
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = getSolarPackageImage(p);
            }}
          />
        </Link>

        {/* Top-left Promo / Status Badge (single clean badge) */}
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
            className={`h-10 w-10 grid place-items-center rounded-full backdrop-blur-md transition-all shadow-md ${
              isSaved
                ? "bg-red-500 text-white shadow-red-500/20 scale-110"
                : "bg-background/80 hover:bg-background text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>

          <Link
            to={`/packages/solar/${p.id}`}
            aria-label="View Details"
            className="h-10 w-10 grid place-items-center rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground backdrop-blur-md transition-all shadow-md"
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
            Package #{p.package_number}{p.badge ? ` · ${p.badge}` : ""}{p.tagline ? ` · ${p.tagline}` : ""}
          </span>
          <div className="flex items-center gap-1 font-medium text-amber-500 shrink-0">
            <Star size={13} fill="currentColor" />
            <span className="text-foreground font-bold">5.0</span>
            <span className="text-muted-foreground text-[10px]">({12 + (p.package_number * 3) % 15})</span>
          </div>
        </div>

        {/* Product Title */}
        <Link
          to={`/packages/solar/${p.id}`}
          className="font-display font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-2"
        >
          {p.inverter}
        </Link>

        {/* Highlights / Specs Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium flex items-center gap-1 max-w-full">
            <Sun size={11} className="text-gold shrink-0" />
            <span className="truncate">Panels: <strong className="text-foreground">{(p.solar_panels?.split("+") || [])[0]?.trim() || p.solar_panels || "Standard Panels"}</strong></span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium flex items-center gap-1 max-w-full">
            <Battery size={11} className="text-emerald-500 shrink-0" />
            <span className="truncate">Battery: <strong className="text-foreground">{(p.battery?.split("(") || [])[0]?.trim() || p.battery || "Compatible Battery"}</strong></span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium flex items-center gap-1 max-w-full">
            <Zap size={11} className="text-primary shrink-0" />
            <span className="truncate">Powers: <strong className="text-foreground">{p.appliances ? p.appliances.split(",").slice(0, 2).join(", ") : "Essential Appliances"}</strong></span>
          </span>
        </div>


        {/* Price & Financing */}
        <div className="mt-auto pt-3 border-t border-border/60">
          <div className="flex items-start justify-between gap-1.5 mb-1.5 flex-wrap">
            <div className="min-w-0 flex-1">
              {/* Main Price */}
              <p className="text-base sm:text-lg font-display font-bold text-foreground leading-tight">
                {fmtPrice(p.total_price)}
              </p>
              {/* Was Price (slashed) */}
              {wasPrice && savedAmount && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    {fmtPrice(wasPrice)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 whitespace-nowrap">
                    <Tag size={9} /> Save {fmtPrice(savedAmount)}
                  </span>
                </div>
              )}
              {monthlyEst && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Or from <strong className="text-primary">₦{monthlyEst.toLocaleString()}/mo</strong>
                </p>
              )}
            </div>

            {/* In stock / Ready badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ready to Install
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              to={`/packages/solar/${p.id}`}
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
            <FlexiblePaymentButton itemName={`Solar Package #${p.package_number}`} itemType="package" itemId={p.id} price={p.total_price} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SolarPackagesSection = () => {
  const { packages, loading } = useSolarPackages();
  const { content: flashDeal } = useLandingContent("flash_deal");
  const [tab, setTab] = useState<"lithium" | "tubular" | "high_voltage">("lithium");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const target = searchParams.get("id") || searchParams.get("package");
    if (!target || !packages.length) return;
    const found = packages.find((p) => String(p.package_number) === target || p.id === target || `pkg-${p.package_number}` === target);
    if (found) {
      setTab(found.battery_type);
      window.setTimeout(() => document.getElementById(`pkg-${found.package_number}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    }
  }, [packages, searchParams]);

  const filtered = useMemo(
    () => packages.filter((p) => p.battery_type === tab),
    [packages, tab]
  );

  if (loading) {
    return (
      <section id="solar-packages" data-no-reveal className="section-padding bg-muted/30 scroll-mt-24">
        <div className="section-container flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (packages.length === 0) return null;

  return (
    <section id="solar-packages" data-no-reveal className="section-padding bg-muted/30 scroll-mt-32">
      <div className="section-container">

        {/* Promo Alert Banner - controlled from Admin > Retail Hero & Flash Deals */}
        {flashDeal?.is_active && (
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <Flame size={20} className="shrink-0" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider">{flashDeal.headline}{flashDeal.discount_label ? ` - ${flashDeal.discount_label}` : ""}</p>
                {flashDeal.description && <p className="text-[11px] text-primary-foreground/80 mt-0.5">{flashDeal.description}</p>}
              </div>
            </div>
            {flashDeal.discount_code && (
              <div className="flex items-center gap-2 shrink-0">
                <Tag size={14} />
                <span className="text-xs font-bold">Code: <span className="font-mono bg-primary-foreground/20 px-2 py-0.5 rounded">{flashDeal.discount_code}</span></span>
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">
            Solar Inverter Systems
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
            Pre-engineered solar packages
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            From 1KVA homes to 40KVA commercial systems. Every package is sized for real Nigerian load profiles, with clear inverter, panel, battery and setup costs.
          </p>
        </div>

        <div className="mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 min-w-max">
            {(["lithium", "tubular", "high_voltage"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-full border transition-all shrink-0 ${
                  tab === k
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {k === "lithium" ? "Lithium (LiFePO4)" : k === "tubular" ? "Tubular / Gel" : "High Voltage (40KVA+)"}
              </button>
            ))}
          </div>
        </div>


        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4">
          {filtered.map((p, i) => (
            <PackageCard key={p.id} p={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolarPackagesSection;
