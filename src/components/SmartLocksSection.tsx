import { useSiteSetting } from "@/hooks/useSiteSetting";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Lock, KeyRound, Building2, ShoppingBag, TrendingDown, Tag, Loader2, Star, ShoppingCart, Heart, Eye } from "lucide-react";
import { useSmartLocks, type SmartLock } from "@/hooks/useSmartLocks";
import { openLeadForm } from "@/components/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";
import { savingsPct, wasPrice as calcWasPrice, savedAmount as calcSavedAmount, resolveCompareAt } from "@/lib/promoDisplay";

const fmtLock = (item: SmartLock) =>
  item.price_label?.trim() ||
  (item.price ? `₦${Math.round(item.price).toLocaleString("en-NG")}` : "Quote");

const LockCard = ({ p, i }: { p: SmartLock; i: number }) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const isSaved = isInWishlist(p.id);

  const hasPrice = !!(p.price && p.price > 0);
  // Strikethrough only appears when a genuine previous price is recorded.
  const { settings: promos } = useSiteSetting("promotions");
  const compareAt = resolveCompareAt(p.price, (p as any).compare_at_price, promos, p.id);
  const pct = savingsPct(p.price, compareAt);
  const wasPriceVal = calcWasPrice(p.price, compareAt);
  const savedAmount = calcSavedAmount(p.price, compareAt);
  const monthlyEst = p.price ? Math.round(p.price / 3) : null;

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    add({
      refId: p.id,
      type: "product",
      name: p.name,
      price: fmtLock(p),
      numericPrice: p.price ?? null,
      image: p.image,
      category: "smart_locks",
    });
    trackConversion("cart_add", { source: "smart_lock", id: p.id });
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(p.id, p.name);
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
      id={`lock-${p.id}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/15 flex items-center justify-center">
        <Link to={`/packages/lock/${p.id}`} className="block w-full h-full p-3 sm:p-4 flex items-center justify-center">
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            width={1024}
            height={768}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-sm"
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
            to={`/packages/lock/${p.id}`}
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
        {/* Category, Series & Rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 gap-2">
          <span className="uppercase tracking-wider font-semibold text-[10px] text-primary truncate">
            {p.series || "STAMA Security"}{p.model ? ` · ${p.model}` : ""}{p.badge ? ` · ${p.badge}` : ""}
          </span>
          <div className="flex items-center gap-1 font-medium text-amber-500 shrink-0">
            <Star size={13} fill="currentColor" />
            <span className="text-foreground font-bold">5.0</span>
            <span className="text-muted-foreground text-[10px]">({10 + ((p.name || "").length * 2) % 18})</span>
          </div>
        </div>

        {/* Product Title */}
        <Link
          to={`/packages/lock/${p.id}`}
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
                {fmtLock(p)}
              </p>
              {/* Was Price (slashed) */}
              {wasPriceVal && savedAmount && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    ₦{Math.round(wasPriceVal).toLocaleString("en-NG")}
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

            {/* In stock badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Stock
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              to={`/packages/lock/${p.id}`}
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
            <FlexiblePaymentButton itemName={p.name} itemType="lock" itemId={p.id} price={p.price ?? null} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TABS = [
  { key: "lock", label: "Smart Locks", icon: Lock },
  { key: "hotel", label: "Hotel Ecosystem", icon: Building2 },
  { key: "accessory", label: "Accessories", icon: KeyRound },
] as const;

const SmartLocksSection = () => {
  const { items, loading } = useSmartLocks();
  const [tab, setTab] = useState<"lock" | "hotel" | "accessory">("lock");

  const filtered = useMemo(
    () => items.filter((p) => p.category === tab),
    [items, tab]
  );

  if (loading) {
    return (
      <section id="smart-locks" data-no-reveal className="section-padding scroll-mt-24">
        <div className="section-container flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section id="smart-locks" data-no-reveal className="section-padding scroll-mt-32">
      <div className="section-container">
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">
            STAMA Smart Lock Series
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
            Smart Locks & Hotel Access
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            From premium biometric home locks to a full hotel access ecosystem. Every install includes setup, training and a 1-year warranty.
          </p>
        </div>

        <div className="mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center sm:justify-center gap-2 min-w-max">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`whitespace-nowrap px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-full border transition-all inline-flex items-center gap-1.5 shrink-0 ${
                  tab === key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div key={tab} className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <LockCard key={`${tab}-${p.id}`} p={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SmartLocksSection;
