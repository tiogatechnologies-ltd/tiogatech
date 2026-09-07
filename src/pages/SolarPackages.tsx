import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Battery, Zap, Cpu, Check, ShoppingBag, ArrowRight, Calculator, TrendingDown, Flame, Tag, Star, ShoppingCart, Heart, Eye, Users } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useSolarPackages, type SolarPackage } from "@/hooks/useSolarPackages";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";
import bgResidential from "@/assets/bg-lumivolt-residential.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";
import { PROMO_LIFT, savingsPct, soldCount, wasPrice as calcWasPrice } from "@/lib/promoDisplay";
import { AnimatedCounter } from "@/components/AnimatedCounter";

const fmtPrice = (n: number | null) =>
  n == null ? "Price on Request" : `₦${Math.round(n).toLocaleString("en-NG")}`;

const PackageCard = ({ pkg, i }: { pkg: SolarPackage; i: number }) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const isSaved = isInWishlist(pkg.id);

  const pct = savingsPct(pkg.package_number);
  const wasPriceVal = calcWasPrice(pkg.total_price);
  const savedAmount = wasPriceVal - pkg.total_price;
  const sold = soldCount(pkg.package_number);
  const monthlyEst = Math.round(pkg.total_price / 3);

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    add({
      refId: pkg.id,
      type: "package",
      name: `Solar Package #${pkg.package_number} - ${pkg.inverter}`,
      price: fmtPrice(pkg.total_price),
      numericPrice: pkg.total_price,
      image: pkg.image,
      category: "solar",
    });
    trackConversion("cart_add", { source: "solar_packages_page", id: pkg.package_number });
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(pkg.id, `Solar Package #${pkg.package_number} - ${pkg.inverter}`);
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
      id={`pkg-${pkg.package_number}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
        <Link to={`/packages/solar/${pkg.id}`} className="block w-full h-full">
          <img
            src={pkg.image}
            alt={pkg.inverter}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Top-left Promo / Status Badge (single clean badge) */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          {pct ? (
            <span className="px-2.5 py-1 rounded-full bg-red-600/95 backdrop-blur-md border border-white/25 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
              <TrendingDown size={11} /> Save {pct}%
            </span>
          ) : pkg.badge ? (
            <span className="px-2.5 py-1 rounded-full bg-primary/95 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              {pkg.badge}
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
            to={`/packages/solar/${pkg.id}`}
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
            Package #{pkg.package_number}{pkg.badge ? ` · ${pkg.badge}` : ""}{pkg.tagline ? ` · ${pkg.tagline}` : ""}
          </span>
          <div className="flex items-center gap-1 font-medium text-amber-500 shrink-0">
            <Star size={13} fill="currentColor" />
            <span className="text-foreground font-bold">5.0</span>
            <span className="text-muted-foreground text-[10px]">({12 + (pkg.package_number * 3) % 15})</span>
          </div>
        </div>

        {/* Product Title */}
        <Link
          to={`/packages/solar/${pkg.id}`}
          className="font-display font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-2"
        >
          {pkg.inverter}
        </Link>

        {/* Highlights / Specs Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium flex items-center gap-1 max-w-full">
            <Sun size={11} className="text-gold shrink-0" />
            <span className="truncate">Panels: <strong className="text-foreground">{(pkg.solar_panels?.split("+") || [])[0]?.trim() || pkg.solar_panels || "Standard Panels"}</strong></span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium flex items-center gap-1 max-w-full">
            <Battery size={11} className="text-emerald-500 shrink-0" />
            <span className="truncate">Battery: <strong className="text-foreground">{(pkg.battery?.split("(") || [])[0]?.trim() || pkg.battery || "Compatible Battery"}</strong></span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium flex items-center gap-1 max-w-full">
            <Zap size={11} className="text-primary shrink-0" />
            <span className="truncate">Powers: <strong className="text-foreground">{pkg.appliances ? pkg.appliances.split(",").slice(0, 2).join(", ") : "Essential Appliances"}</strong></span>
          </span>
        </div>

        {/* Social Proof Urgency */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3 flex-wrap">
          <Users size={11} className="text-emerald-500 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{sold} installed this month</span>
          <span className="opacity-50">·</span>
          <Flame size={11} className="text-amber-500 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400 font-semibold">In demand</span>
        </div>

        {/* Price & Financing */}
        <div className="mt-auto pt-3 border-t border-border/60">
          <div className="flex items-start justify-between gap-1.5 mb-1.5 flex-wrap">
            <div className="min-w-0 flex-1">
              {/* Main Price */}
              <p className="text-base sm:text-lg font-display font-bold text-foreground leading-tight">
                {pkg.total_price != null ? (
                  <AnimatedCounter target={pkg.total_price} prefix="₦" />
                ) : (
                  "Price on Request"
                )}
              </p>
              {/* Was Price (slashed) */}
              {wasPriceVal && savedAmount && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    {fmtPrice(wasPriceVal)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 whitespace-nowrap">
                    <Tag size={9} /> Save <AnimatedCounter target={savedAmount} prefix="₦" />
                  </span>
                </div>
              )}
              {monthlyEst && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Or from <strong className="text-primary"><AnimatedCounter target={monthlyEst} prefix="₦" suffix="/mo" /></strong>
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
              to={`/packages/solar/${pkg.id}`}
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
            <FlexiblePaymentButton itemName={`Solar Package #${pkg.package_number}`} itemType="package" itemId={pkg.id} price={pkg.total_price} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const SolarPackages = () => {
  const { packages, loading } = useSolarPackages();
  const [filter, setFilter] = useState<"all" | "lithium" | "tubular" | "high_voltage">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return packages;
    return packages.filter((p) => p.battery_type === filter);
  }, [packages, filter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Turnkey Solar Power Packages Nigeria - 3kVA, 5kVA, 10kVA Hybrid Systems"
        description="Browse certified turnkey solar packages featuring Deye hybrid inverters, Felicity LiFePO4 lithium batteries, and Longi Tier-1 panels with 5-year warranty."
        path="/solar-packages"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Solar Packages", path: "/solar-packages" }]),
          serviceJsonLd({
            name: "Tioga Turnkey Solar Power System Installation",
            description: "Turnkey hybrid inverter and lithium battery installations for Nigerian homes and commercial offices.",
            path: "/solar-packages",
            serviceType: "Solar system installation and integration",
          }),
        ]}
      />
      <SiteHeader />

      <PageHero
        eyebrow="Turnkey Energy Infrastructure · LumiVolt"
        title="Guaranteed 24/7 Clean Solar Energy Systems"
        subtitle="Pre-engineered hybrid inverters, high-cycle lithium iron phosphate batteries, and Tier-1 solar panels designed to power your essential appliances with zero flicker."
        backgroundImage={bgResidential}
        backgroundAlt="Modern Nigerian home powered by rooftop solar inverters and battery backup"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/energy-calculator"
            className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary/90 backdrop-blur-xl border border-primary/60 border-t-white/40 px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.25)]"
          >
            <Calculator size={16} /> Free Load Sizing Calculator
          </Link>
          <button
            type="button"
            onClick={() => openLeadForm("solar_packages_hero")}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
          >
            Request Custom Engineering
          </button>
        </div>
      </PageHero>

      <main className="flex-1 section-padding py-12">
        <div className="section-container">

          {/* Promo banner */}
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

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-2">Engineered Packages</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
                Turnkey Solar Configurations
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-xl">
                Every package includes tier-1 hybrid inverter, matched battery bank, high-yield panels, surge protection, DC breakers, and professional installation.
              </p>
            </div>

            {/* Filter tabs */}
            <div className="overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 min-w-max">
                {(["all", "lithium", "tubular", "high_voltage"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-full border transition-all shrink-0 ${
                      filter === k
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {k === "all" ? "All" : k === "lithium" ? "Lithium" : k === "tubular" ? "Tubular / Gel" : "High Voltage"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading packages…</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((pkg, i) => (
                <PackageCard key={pkg.id} pkg={pkg} i={i} />
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SolarPackages;
