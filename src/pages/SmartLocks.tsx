import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, KeyRound, Smartphone, Building2, Check, ArrowRight, Truck, Wrench, Shield, ShoppingBag, Eye, SlidersHorizontal, TrendingDown, Tag, Star, ShoppingCart, Heart, Users, Flame } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useSmartLocks, type SmartLock } from "@/hooks/useSmartLocks";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import bgSmartLockApex from "@/assets/bg-smartlock-apex.jpg";
import bgSmartLockHotel from "@/assets/bg-smartlock-hotel.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";
import { PROMO_LIFT, savingsPct, soldCount, wasPrice as calcWasPrice } from "@/lib/promoDisplay";

const fmt = (item: SmartLock) =>
  item.price_label?.trim() ||
  (item.price ? `₦${Math.round(item.price).toLocaleString("en-NG")}` : "Quote on Request");

const LockCard = ({ lock, i }: { lock: SmartLock; i: number }) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const isSaved = isInWishlist(lock.id);

  const hasPrice = !!(lock.price && lock.price > 0);
  const pct = hasPrice ? savingsPct(lock.id) : null;
  const wasPriceVal = hasPrice ? calcWasPrice(lock.price!) : null;
  const savedAmount = hasPrice && wasPriceVal ? wasPriceVal - lock.price! : null;
  const sold = soldCount(lock.id);
  const monthlyEst = lock.price ? Math.round(lock.price / 3) : null;

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    add({
      id: `lock-${lock.id}`,
      refId: lock.id,
      type: "package",
      name: lock.name,
      price: fmt(lock),
      numericPrice: lock.price || 0,
      category: "Smart Locks",
      image: lock.image,
    });
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(lock.id, lock.name);
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
      id={`lock-${lock.id}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
        <Link to={`/packages/locks/${lock.id}`} className="block w-full h-full">
          <img
            src={lock.image}
            alt={lock.name}
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
          {lock.model && (
            <span className="px-2 py-0.5 rounded-full bg-gold/90 backdrop-blur-md border border-gold/40 text-midnight text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md w-fit">
              {lock.model}
            </span>
          )}
          {lock.badge && (
            <span className="px-2 py-0.5 rounded-full bg-primary/90 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md w-fit">
              {lock.badge}
            </span>
          )}
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
            to={`/packages/locks/${lock.id}`}
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
            {lock.series || "STAMA Series"}
          </span>
          <div className="flex items-center gap-1 font-medium text-amber-500">
            <Star size={13} fill="currentColor" />
            <span className="text-foreground font-bold">5.0</span>
            <span className="text-muted-foreground text-[10px]">({12 + ((lock.name || "").length * 2) % 16})</span>
          </div>
        </div>

        {/* Product Title */}
        <Link
          to={`/packages/locks/${lock.id}`}
          className="font-display font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-2"
        >
          {lock.name}
        </Link>

        {/* Highlights / Specs Chips */}
        {Array.isArray(lock.features) && lock.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {lock.features.slice(0, 3).map((f) => (
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
                {fmt(lock)}
              </p>
              {/* Was Price (slashed) */}
              {wasPriceVal && savedAmount && (
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    ₦{Math.round(wasPriceVal).toLocaleString("en-NG")}
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

            {/* In stock badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Stock
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              to={`/packages/locks/${lock.id}`}
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
            <FlexiblePaymentButton itemName={lock.name} itemType="lock" itemId={lock.id} price={lock.price ?? null} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const SmartLocks = () => {
  const { items, loading } = useSmartLocks();
  const [filter, setFilter] = useState<"all" | "residential" | "commercial" | "hotel">("all");
  const { add } = useCart();

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((x) => x.category === filter);
  }, [items, filter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="STAMA Smart Locks - Biometric, 3D Face ID & Hotel Keyless Entry"
        description="Explore STAMA intelligent door locks with 3D Face Recognition, biometric fingerprint, Tuya / TTLock app control, and hotel card access across Nigeria."
        path="/smart-locks"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Smart Locks", path: "/smart-locks" }]),
          serviceJsonLd({
            name: "STAMA Smart Lock Supply and Installation",
            description: "Biometric and smart access locks for Nigerian homes, luxury apartments, and commercial hotels.",
            path: "/smart-locks",
            serviceType: "Access control and security installation",
          }),
        ]}
      />
      <SiteHeader />

      <PageHero
        eyebrow="STAMA Security Hardware · Powered by Tioga"
        title="Next-Generation Keyless Access & Smart Locks"
        subtitle="Military-grade security, biometric fingerprint, 3D structured-light facial recognition, and smartphone app control engineered for Nigerian homes, estates, and hotels."
        backgroundImage={bgSmartLockApex}
        backgroundAlt="Luxury STAMA smart door lock installed on modern wooden door"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openLeadForm("smart_locks_hero")}
            className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary/90 backdrop-blur-xl border border-primary/60 border-t-white/40 px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.25)]"
          >
            Request Lock Installation
          </button>
          <Link
            to="/retail?category=Smart+Locks"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
          >
            <ShoppingBag size={16} /> Browse Retail Inventory
          </Link>
        </div>
      </PageHero>

      {/* Trust Highlights */}
      <section className="border-b border-border bg-card/60 py-6">
        <div className="section-container grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-3 p-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm text-foreground">Anti-Tamper Alarm</p>
              <p className="text-[11px] text-muted-foreground">Built-in siren & phone alert</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3">
            <div className="h-10 w-10 rounded-xl bg-gold/15 text-gold-dark dark:text-gold flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm text-foreground">Tuya & TTLock</p>
              <p className="text-[11px] text-muted-foreground">Remote OTP & log history</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wrench size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm text-foreground">Free Expert Install</p>
              <p className="text-[11px] text-muted-foreground">Lagos & Abuja warranty</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <KeyRound size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm text-foreground">6-in-1 Unlock</p>
              <p className="text-[11px] text-muted-foreground">Face, Finger, Card, Key, App, PIN</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Showcase */}
      <main className="flex-1 section-padding py-12">
        <div className="section-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-2">Hardware Collection</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
                STAMA Smart Lock Models
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-xl">
                Choose the exact form factor and security level for your main security door, wooden interior door, or hotel master suite.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: "all", label: "All Locks" },
                { id: "residential", label: "Residential" },
                { id: "commercial", label: "Commercial / Office" },
                { id: "hotel", label: "Hotel Keycard" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filter === t.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.map((lock, i) => (
              <LockCard key={lock.id} lock={lock} i={i} />
            ))}
          </div>

          {/* Architectural Lock Comparison Table */}
          <div className="mt-16 p-6 sm:p-10 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)]">
            <div className="max-w-2xl mb-8">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Technical Matrix</p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                STAMA Feature Comparison
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Detailed hardware capabilities across our smart lock product tiers.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-foreground font-display font-bold">
                    <th className="p-3.5">Feature</th>
                    <th className="p-3.5">Apex (Face ID)</th>
                    <th className="p-3.5">Pro (Biometric)</th>
                    <th className="p-3.5">Base (Keypad)</th>
                    <th className="p-3.5">Hotel (Keycard)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">3D Face Recognition</td>
                    <td className="p-3.5 text-emerald-500 font-bold">Structured Light (0.3s)</td>
                    <td className="p-3.5">-</td>
                    <td className="p-3.5">-</td>
                    <td className="p-3.5">-</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">Biometric Fingerprint</td>
                    <td className="p-3.5 text-emerald-500">Live Semiconductor (99.8%)</td>
                    <td className="p-3.5 text-emerald-500">Live Semiconductor (99.8%)</td>
                    <td className="p-3.5">-</td>
                    <td className="p-3.5">-</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">Mobile App Control</td>
                    <td className="p-3.5 text-emerald-500">Tuya Smart / Smart Life</td>
                    <td className="p-3.5 text-emerald-500">Tuya Smart / TTLock</td>
                    <td className="p-3.5 text-emerald-500">TTLock Bluetooth</td>
                    <td className="p-3.5 text-emerald-500">Hotel PMS Integration</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">Emergency Physical Key</td>
                    <td className="p-3.5 text-emerald-500">Class C Hidden Cylinder</td>
                    <td className="p-3.5 text-emerald-500">Class C Hidden Cylinder</td>
                    <td className="p-3.5 text-emerald-500">Class C Cylinder</td>
                    <td className="p-3.5 text-emerald-500">Master Key Override</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">Battery Life</td>
                    <td className="p-3.5">Rechargeable Li-Ion (6-8 mos)</td>
                    <td className="p-3.5">8x AA Alkaline (10-12 mos)</td>
                    <td className="p-3.5">4x AA Alkaline (12 mos)</td>
                    <td className="p-3.5">4x AA Alkaline (14 mos)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SmartLocks;
