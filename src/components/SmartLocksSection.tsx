import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Lock, Sparkles, KeyRound, Building2, ShoppingBag, TrendingDown, Flame, Tag } from "lucide-react";
import { useSmartLocks, type SmartLock } from "@/hooks/useSmartLocks";
import { openLeadForm } from "@/components/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";

const fmtLock = (item: SmartLock) =>
  item.price_label?.trim() ||
  (item.price ? `₦${Math.round(item.price).toLocaleString("en-NG")}` : "Quote");

// Cosmetic promo — displayed only, real prices never changed
const LOCK_PROMO_LIFT = 1.10;
const lockViewers = (seed: string) => 2 + (seed.charCodeAt(0) * 3 + 7) % 12;
const lockSavingsPct = (seed: string) => 7 + (seed.charCodeAt(0) * 2 + 3) % 9;

const LockCard = ({ p, i }: { p: SmartLock; i: number }) => {
  const { add } = useCart();
  const [addedAnim, setAddedAnim] = useState(false);

  const pct = p.price ? lockSavingsPct(p.id) : null;
  const wasPrice = p.price ? Math.round(p.price * LOCK_PROMO_LIFT) : null;
  const savedAmount = p.price && wasPrice ? wasPrice - p.price : null;
  const viewers = lockViewers(p.id);

  const handleAdd = () => {
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

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut", delay: (i % 6) * 0.04 }}
    className="group relative rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col"
    id={`lock-${p.id}`}
  >
    <Link to={`/packages/lock/${p.id}`} className="relative h-48 overflow-hidden block">
      <img
        src={p.image}
        alt={p.name}
        loading="lazy"
        width={1024}
        height={768}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/55 to-midnight/20" />
      <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
        {p.model && (
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold bg-gold text-midnight px-2.5 py-1 rounded-full shadow">
            {p.model}
          </span>
        )}
        {pct && (
          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-red-500 text-white px-2.5 py-1 rounded-full shadow flex items-center gap-1">
            <TrendingDown size={10} /> Save {pct}%
          </span>
        )}
        {p.badge && (
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full shadow">
            {p.badge}
          </span>
        )}
      </div>
      {/* Viewer count */}
      <div className="absolute top-4 right-4">
        <span className="flex items-center gap-1 text-[10px] font-semibold bg-midnight/70 backdrop-blur-sm text-white px-2 py-1 rounded-full">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          {viewers} viewing
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/75 mb-1">
          {p.series}
        </p>
        <h3 className="text-lg font-display font-bold text-primary-foreground no-clip leading-tight">
          {p.name}
        </h3>
      </div>
    </Link>

    <div className="p-5 sm:p-6 flex flex-col flex-1">
      {/* Pricing */}
      <div className="mb-3 p-4 rounded-2xl bg-muted/40 border border-border/60">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
          {p.category === "hotel" ? "Investment" : "Bundle Price"}
        </p>
        <div className="flex items-end gap-3">
          <p className="text-2xl font-display font-bold text-foreground leading-none">{fmtLock(p)}</p>
          {wasPrice && savedAmount && (
            <div className="flex flex-col items-start pb-0.5">
              <span className="text-xs text-muted-foreground line-through">
                ₦{Math.round(wasPrice).toLocaleString("en-NG")}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Save ₦{Math.round(savedAmount).toLocaleString("en-NG")}
              </span>
            </div>
          )}
        </div>
        {p.tagline && <p className="text-xs text-muted-foreground mt-1">{p.tagline}</p>}
      </div>

      {p.features.length > 0 && (
        <ul className="space-y-1.5 mb-4 text-sm">
          {p.features.slice(0, 6).map((f) => (
            <li key={f} className="flex items-start gap-2 text-foreground">
              <Check size={14} className="text-primary mt-1 shrink-0" />
              <span className="text-[13px]">{f}</span>
            </li>
          ))}
          {p.features.length > 6 && (
            <li className="text-[12px] text-muted-foreground pl-6">
              + {p.features.length - 6} more
            </li>
          )}
        </ul>
      )}

      {(p.power_system || p.ideal_for) && (
        <div className="rounded-2xl bg-muted/40 p-3 mb-4 text-xs text-muted-foreground space-y-1 border border-border/50">
          {p.power_system && (
            <p><span className="text-foreground font-semibold">Power:</span> {p.power_system}</p>
          )}
          {p.ideal_for && (
            <p><span className="text-foreground font-semibold">Ideal for:</span> {p.ideal_for}</p>
          )}
        </div>
      )}

      {/* Urgency */}
      <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-4">
        <Flame size={12} className="shrink-0" />
        <span>Limited stock this month — reserve yours today</span>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <button
          onClick={handleAdd}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-3 text-xs font-semibold transition-all ${
            addedAnim
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          <ShoppingBag size={13} />
          {addedAnim ? "Added!" : "Add to Cart"}
        </button>
        <Link
          to={`/packages/lock/${p.id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
        >
          View Details <ArrowRight size={13} />
        </Link>
      </div>
      <div className="mt-2"><FlexiblePaymentButton itemName={p.name} itemType="lock" itemId={p.id} price={p.price ?? null} /></div>
      <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
        <Check size={10} /> 1-year warranty &middot; Pro installation included
      </p>
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

  if (loading || items.length === 0) return null;

  return (
    <section id="smart-locks" data-no-reveal className="section-padding scroll-mt-24">
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

        <div className="mb-8 sm:mb-10 -mx-4 px-4 overflow-x-auto scrollbar-hide no-scrollbar pb-1">
          <div className="flex justify-start sm:justify-center min-w-max sm:mx-auto">
            <div className="inline-flex p-1 sm:p-1.5 rounded-full bg-card border border-border shadow-sm gap-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`whitespace-nowrap px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all inline-flex items-center gap-1.5 ${
                    tab === key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div key={tab} className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <LockCard key={`${tab}-${p.id}`} p={p} i={i} />
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <Sparkles className="text-gold mx-auto mb-3" size={26} />
          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight mb-2 no-clip">
            Need help choosing the right lock?
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto mb-5 text-sm">
            Tell us your door type, users, and budget. We will recommend the perfect STAMA model, including hotel-scale deployments.
          </p>
          <button
            onClick={() => openLeadForm("smart_locks_custom")}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
          >
            <Sparkles size={16} /> Get my recommendation
          </button>
        </div>
      </div>
    </section>
  );
};

export default SmartLocksSection;
