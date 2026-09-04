import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Music, Home, ShoppingBag, TrendingDown, Flame, Tag } from "lucide-react";
import { useHomeAutomationPackages, type HomeAutomationPackage } from "@/hooks/useHomeAutomationPackages";
import { openLeadForm } from "@/components/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";

const fmtAuto = (p: HomeAutomationPackage) =>
  p.price_label ?? (p.price ? `From ₦${(p.price / 1_000_000).toFixed(1)}M` : "On request");

// Cosmetic promo - displayed only, real prices never changed
const AUTO_PROMO_LIFT = 1.13;
const autoViewers = (seed: string) => 4 + (seed.charCodeAt(0) * 5 + 9) % 14;
const autoSavingsPct = (seed: string) => 9 + (seed.charCodeAt(0) * 4 + 7) % 9;

const PackageCard = ({ p, i }: { p: HomeAutomationPackage; i: number }) => {
  const { add } = useCart();
  const [addedAnim, setAddedAnim] = useState(false);

  const pct = p.price ? autoSavingsPct(p.id) : null;
  const wasPrice = p.price ? Math.round(p.price * AUTO_PROMO_LIFT) : null;
  const savedAmount = p.price && wasPrice ? wasPrice - p.price : null;
  const viewers = autoViewers(p.id);

  const handleAdd = () => {
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

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut", delay: (i % 6) * 0.05 }}
    className="group relative rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col"
    id={`automation-${p.id}`}
  >
    <Link to={`/packages/automation/${p.id}`} className="relative h-52 overflow-hidden block">
      <img
        src={p.image}
        alt={p.name}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      {/* Badges */}
      <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
        {p.badge && (
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold bg-gold/90 backdrop-blur-md border border-gold/40 text-midnight px-2.5 py-1 rounded-full shadow-md">
            {p.badge}
          </span>
        )}
        {pct && (
          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-red-600/90 backdrop-blur-md border border-white/25 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <TrendingDown size={10} /> Save {pct}%
          </span>
        )}
      </div>

      {/* Viewer count */}
      <div className="absolute top-4 right-4">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold bg-midnight/75 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-full shadow-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          {viewers} viewing
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 bg-midnight/80 border-t border-white/10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/75 mb-1">
          {p.tagline}
        </p>
        <h3 className="text-2xl font-display font-bold text-primary-foreground no-clip leading-tight">
          {p.name}
        </h3>
      </div>
    </Link>

    <div className="p-5 sm:p-6 flex flex-col flex-1">
      {/* Pricing */}
      <div className="mb-4 p-4 rounded-2xl bg-muted/40 border border-border/60">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Package Investment</p>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-display font-bold text-foreground leading-none">{fmtAuto(p)}</p>
          {wasPrice && savedAmount && (
            <div className="flex flex-col items-start pb-0.5">
              <span className="text-xs text-muted-foreground line-through">
                From ₦{(wasPrice / 1_000_000).toFixed(1)}M
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Save ₦{Math.round(savedAmount).toLocaleString("en-NG")}
              </span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <Tag size={10} className="text-primary" />
          Full system price including devices, wiring &amp; setup
        </p>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{p.description}</p>

      {p.features.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-2 flex items-center gap-1.5">
            <Home size={12} /> Smart Home
          </p>
          <ul className="space-y-2 text-sm">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check size={15} className="text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {p.entertainment.length > 0 && (
        <div className="mb-4 rounded-2xl bg-muted/40 p-3 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider font-bold text-accent-foreground mb-2 flex items-center gap-1.5">
            <Music size={12} /> Entertainment
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {p.entertainment.map((e) => (
              <li key={e} className="flex items-start gap-2">
                <span className="text-gold mt-0.5">&bull;</span>
                <span className="text-foreground">{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Urgency */}
      <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-4">
        <Flame size={12} className="shrink-0" />
        <span>Installation slots filling up - <strong>book this month to lock the price</strong></span>
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
          to={`/packages/automation/${p.id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
        >
          View Details <ArrowRight size={13} />
        </Link>
      </div>
      <div className="mt-2"><FlexiblePaymentButton itemName={p.name} itemType="automation" itemId={p.id} price={p.price ?? null} /></div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        <Check size={10} className="inline" /> Site survey & installation included
      </p>
    </div>
  </motion.div>
  );
};

const HomeAutomationSection = () => {
  const { packages, loading } = useHomeAutomationPackages();

  if (loading || packages.length === 0) return null;

  return (
    <section id="home-automation" data-no-reveal className="section-padding scroll-mt-24">
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
