import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Sun, Battery, Zap, Cpu, Check, ShoppingBag, ArrowRight, Calculator, TrendingDown, Flame, Tag } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useSolarPackages, type SolarPackage } from "@/hooks/useSolarPackages";
import { useCart } from "@/contexts/CartContext";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";
import bgResidential from "@/assets/bg-lumivolt-residential.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";
import { PROMO_LIFT, viewerCount, savingsPct } from "@/lib/promoDisplay";

const fmtPrice = (n: number | null) =>
  n == null ? "Price on Request" : `₦${Math.round(n).toLocaleString("en-NG")}`;

const PackageCard = ({ pkg, i }: { pkg: SolarPackage; i: number }) => {
  const { add } = useCart();
  const [addedAnim, setAddedAnim] = useState(false);

  const pct = savingsPct(pkg.package_number);
  const wasPrice = Math.round(pkg.total_price * PROMO_LIFT);
  const savedAmount = wasPrice - pkg.total_price;
  const viewers = viewerCount(pkg.package_number);

  const handleAdd = () => {
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

  return (
    <div className="group rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col transition-all">
      {/* Image with Savings Badge - clicking opens detail page */}
      <Link to={`/packages/solar/${pkg.id}`} className="relative h-52 overflow-hidden block">
        <img
          src={pkg.image}
          alt={pkg.inverter}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-midnight/90" />

        {/* Top-left badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 flex-wrap max-w-[62%]">
          <span className="text-[10px] uppercase tracking-wider font-bold bg-gold text-midnight px-2 py-0.5 rounded-full shadow-sm">
            #{pkg.package_number}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-red-500 text-white px-2.5 py-1 rounded-full shadow flex items-center gap-1">
            <TrendingDown size={10} /> Save {pct}%
          </span>
          {pkg.badge && (
            <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full shadow-sm">
              {pkg.badge}
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
          <p className="text-[10px] uppercase tracking-widest text-primary-foreground/80 mb-1">
            {pkg.tagline || (pkg.battery_type === "lithium" ? "Lithium LiFePO4" : "Tubular Backup")}
          </p>
          <h3 className="text-xl font-display font-bold text-primary-foreground leading-tight">
            {pkg.inverter}
          </h3>
        </div>
      </Link>

      {/* Body */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">

        {/* Price block */}
        <div className="mb-4 p-4 rounded-2xl bg-muted/40 border border-border/60">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Bundle Price</p>
          <div className="flex items-end gap-3">
            <p className="text-2xl font-display font-bold text-foreground leading-none">{fmtPrice(pkg.total_price)}</p>
            <div className="flex flex-col items-start pb-0.5">
              <span className="text-xs text-muted-foreground line-through">{fmtPrice(wasPrice)}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">You save {fmtPrice(savedAmount)}</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Tag size={10} className="text-primary" />
            Bundle discount vs. buying components separately
          </p>
        </div>

        {/* Component specs */}
        <ul className="space-y-2 mb-4 text-xs flex-1">
          <li className="flex items-start gap-2 text-foreground/90">
            <Sun size={14} className="text-gold mt-0.5 shrink-0" />
            <span><span className="text-muted-foreground">Panels:</span> {pkg.solar_panels}</span>
          </li>
          <li className="flex items-start gap-2 text-foreground/90">
            <Battery size={14} className="text-emerald-500 mt-0.5 shrink-0" />
            <span><span className="text-muted-foreground">Battery:</span> {pkg.battery}</span>
          </li>
          {pkg.charge_controller && pkg.charge_controller !== "NIL" && (
            <li className="flex items-start gap-2 text-foreground/90">
              <Cpu size={14} className="text-primary mt-0.5 shrink-0" />
              <span><span className="text-muted-foreground">Controller:</span> {pkg.charge_controller}</span>
            </li>
          )}
          <li className="flex items-start gap-2 text-foreground/90">
            <Zap size={14} className="text-primary mt-0.5 shrink-0" />
            <span><span className="text-muted-foreground">Powers:</span> {pkg.appliances}</span>
          </li>
        </ul>

        {/* Urgency */}
        <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-4">
          <Flame size={12} className="shrink-0" />
          <span>Bundle pricing valid for <strong>this week only</strong> - contact us to lock it in</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          {pkg.total_price ? (
            <button
              onClick={handleAdd}
              className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${
                addedAnim
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-primary-foreground hover:brightness-110 shadow-sm"
              }`}
            >
              <ShoppingBag size={14} />
              {addedAnim ? "Added to Cart!" : "Add System to Cart"}
            </button>
          ) : (
            <button
              onClick={() => openLeadForm(`solar_pkg_${pkg.package_number}`)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold text-midnight text-xs font-bold hover:brightness-110 shadow-sm transition-all"
            >
              Request System Sizing
            </button>
          )}

          <div className="flex items-center gap-2">
            <Link
              to={`/packages/solar/${pkg.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 border border-primary text-[11px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              View Details <ArrowRight size={11} />
            </Link>
            {pkg.total_price && pkg.total_price > 500_000 && (
              <div className="flex-1">
                <FlexiblePaymentButton
                  itemName={`${pkg.inverter} Solar System`}
                  itemType="package"
                  itemId={pkg.id}
                  price={pkg.total_price}
                />
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Check size={10} /> 5-yr warranty &middot; Installers available next week
          </p>
        </div>
      </div>
    </div>
  );
};

export const SolarPackages = () => {
  const { packages, loading } = useSolarPackages(); // ✅ fixed: was "items"
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
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20 transition-all"
          >
            <Calculator size={16} /> Free Load Sizing Calculator
          </Link>
          <button
            type="button"
            onClick={() => openLeadForm("solar_packages_hero")}
            className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/20 transition-all"
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
            <div className="inline-flex p-1.5 rounded-full bg-card border border-border shadow-sm gap-1">
              {(["all", "lithium", "tubular", "high_voltage"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    filter === k
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k === "all" ? "All" : k === "lithium" ? "Lithium" : k === "tubular" ? "Tubular / Gel" : "High Voltage"}
                </button>
              ))}
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
