import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Battery, Sun, Zap, Cpu, Check, ArrowRight, ShoppingBag, Users, Clock, Tag, TrendingDown, Flame } from "lucide-react";
import { useSolarPackages, type SolarPackage } from "@/hooks/useSolarPackages";
import { openLeadForm } from "@/components/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";

// Cosmetic discount - real price is always total_price. These multipliers
// generate a plausible "was" price for display only; nothing is stored or changed.
const PROMO_LIFT = 1.12; // implies ~11% bundle saving shown to user

const fmtPrice = (n: number | null) =>
  n == null ? "-" : `₦${Math.round(n).toLocaleString("en-NG")}`;

// Stable pseudo-random viewer count per package (3–18 range)
const viewerCount = (seed: number) => 3 + (seed * 7 + 11) % 16;

// Stable savings % per package (8–17 range)
const savingsPct = (seed: number) => 8 + (seed * 3 + 5) % 10;



const PackageCard = ({ p, i }: { p: SolarPackage; i: number }) => {
  const { add } = useCart();
  const [addedAnim, setAddedAnim] = useState(false);

  // Cosmetic promo values - real price is always p.total_price
  const pct = savingsPct(p.package_number);
  const wasPrice = Math.round(p.total_price * PROMO_LIFT);
  const savedAmount = wasPrice - p.total_price;
  const viewers = viewerCount(p.package_number);

  const handleAdd = () => {
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

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut", delay: (i % 4) * 0.05 }}
    className="group relative rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col"
    id={`pkg-${p.package_number}`}
  >
    {/* Image with Savings Badge - clicking opens detail page */}
    <Link to={`/packages/solar/${p.id}`} className="relative h-48 overflow-hidden block">
      <img
        src={p.image}
        alt={p.inverter}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      {/* Top badges row */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 flex-wrap max-w-[62%]">
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold bg-gold/90 backdrop-blur-md border border-gold/40 text-midnight px-2.5 py-0.5 rounded-full shadow-md">
          #{p.package_number}
        </span>
        {/* Promo savings pill */}
        <span className="text-[10px] uppercase tracking-wider font-extrabold bg-red-600/90 backdrop-blur-md border border-white/25 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <TrendingDown size={10} /> Save {pct}%
        </span>
        {p.badge && (
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold bg-primary/90 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-full shadow-md">
            {p.badge}
          </span>
        )}
      </div>

      {/* Live viewer count */}
      <div className="absolute top-3.5 right-3.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold bg-midnight/75 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-full shadow-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          {viewers} viewing
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 bg-midnight/65 backdrop-blur-md border-t border-white/10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/75 mb-1">
          {p.tagline || (p.battery_type === "lithium" ? "Lithium LiFePO4" : "Tubular / Gel")}
        </p>
        <h3 className="text-lg font-display font-bold text-primary-foreground no-clip leading-tight">
          {p.inverter}
        </h3>
      </div>
    </Link>

    <div className="p-5 sm:p-6 flex flex-col flex-1">

      {/* Pricing Block */}
      <div className="mb-4 p-4 rounded-2xl bg-muted/40 border border-border/60">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Bundle Price</p>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-display font-bold text-foreground leading-none">{fmtPrice(p.total_price)}</p>
          <div className="flex flex-col items-start pb-0.5">
            <span className="text-xs text-muted-foreground line-through">{fmtPrice(wasPrice)}</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">You save {fmtPrice(savedAmount)}</span>
          </div>
        </div>
        {/* Bundle vs. individual breakdown hint */}
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <Tag size={10} className="text-primary" />
          Bundle discount applied vs. buying components separately
        </p>
      </div>

      {/* Components */}
      <ul className="space-y-2 mb-4 text-sm">
        <li className="flex items-start gap-2.5">
          <Sun size={15} className="text-gold mt-0.5 shrink-0" />
          <span className="text-foreground"><span className="text-muted-foreground">Panels:</span> {p.solar_panels}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Battery size={15} className="text-primary mt-0.5 shrink-0" />
          <span className="text-foreground"><span className="text-muted-foreground">Battery:</span> {p.battery}</span>
        </li>
        {p.charge_controller && p.charge_controller !== "NIL" && (
          <li className="flex items-start gap-2.5">
            <Cpu size={15} className="text-primary mt-0.5 shrink-0" />
            <span className="text-foreground"><span className="text-muted-foreground">Controller:</span> {p.charge_controller}</span>
          </li>
        )}
        <li className="flex items-start gap-2.5">
          <Zap size={15} className="text-accent mt-0.5 shrink-0" />
          <span className="text-foreground"><span className="text-muted-foreground">Powers:</span> {p.appliances}</span>
        </li>
      </ul>

      {/* Price Breakdown */}
      <div className="rounded-2xl bg-muted/30 p-3 mb-4 text-xs text-muted-foreground space-y-1 border border-border/50">
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-1.5">Component Breakdown</p>
        <div className="flex justify-between"><span>Inverter</span><span className="text-foreground">{fmtPrice(p.inverter_price)}</span></div>
        <div className="flex justify-between"><span>Panels</span><span className="text-foreground">{fmtPrice(p.solar_panels_price)}</span></div>
        <div className="flex justify-between"><span>Battery</span><span className="text-foreground">{fmtPrice(p.battery_price)}</span></div>
        {p.charge_controller_price ? (
          <div className="flex justify-between"><span>Controller</span><span className="text-foreground">{fmtPrice(p.charge_controller_price)}</span></div>
        ) : null}
        <div className="flex justify-between"><span>Accessories</span><span className="text-foreground">{fmtPrice(p.accessories_price)}</span></div>
        <div className="flex justify-between"><span>Professional Setup</span><span className="text-foreground">{fmtPrice(p.setup_fee)}</span></div>
        <div className="flex justify-between border-t border-border/60 pt-1.5 mt-0.5">
          <span className="font-bold text-foreground">Bundle Total</span>
          <span className="font-bold text-primary">{fmtPrice(p.total_price)}</span>
        </div>
      </div>

      {/* Urgency strip */}
      <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-4">
        <Flame size={12} className="shrink-0" />
        <span>Bundle pricing valid for <strong>this week only</strong> - contact us to lock it in</span>
      </div>

      {/* CTA Buttons */}
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
          to={`/packages/solar/${p.id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
        >
          View Details <ArrowRight size={13} />
        </Link>
      </div>
      <div className="mt-2"><FlexiblePaymentButton itemName={`Solar Package #${p.package_number}`} itemType="package" itemId={p.id} price={p.total_price} /></div>
      <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
        <Check size={10} /> Installers available next week &middot; 5-yr warranty
      </p>
    </div>
  </motion.div>
  );
};

const SolarPackagesSection = () => {
  const { packages, loading } = useSolarPackages();
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

  if (loading || packages.length === 0) return null;

  return (
    <section id="solar-packages" data-no-reveal className="section-padding bg-muted/30 scroll-mt-24">
      <div className="section-container">

        {/* Promo Alert Banner */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <Flame size={20} className="shrink-0" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider">Mid-Month Bundle Deals - Up to 17% Off</p>
              <p className="text-[11px] text-primary-foreground/80 mt-0.5">Pre-engineered systems priced below individual component retail. Limited slots this month.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Tag size={14} />
            <span className="text-xs font-bold">Code: <span className="font-mono bg-primary-foreground/20 px-2 py-0.5 rounded">TIOGA2026</span></span>
          </div>
        </div>

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

        <div className="mb-8 sm:mb-10 -mx-4 px-4 overflow-x-auto scrollbar-none">
          <div className="inline-flex min-w-max p-1.5 rounded-full bg-card border border-border shadow-sm gap-1">
            {(["lithium", "tubular", "high_voltage"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all ${
                  tab === k
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k === "lithium" ? "Lithium (LiFePO4)" : k === "tubular" ? "Tubular / Gel" : "High Voltage (40KVA+)"}
              </button>
            ))}
          </div>
        </div>


        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <PackageCard key={p.id} p={p} i={i} />
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight mb-2 no-clip">
            None of these fit perfectly?
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto mb-5 text-sm">
            Tell us your load profile and budget. Our LumiVolt AI will design a custom package in under 2 minutes.
          </p>
          <button
            onClick={() => openLeadForm("solar_packages_custom")}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
          >
            Build my custom package
          </button>
        </div>
      </div>
    </section>
  );
};

export default SolarPackagesSection;
