import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Battery, Sun, Zap, Cpu, Check, ArrowRight, Sparkles, ShoppingBag } from "lucide-react";
import { useSolarPackages, type SolarPackage } from "@/hooks/useSolarPackages";
import { openLeadForm } from "@/components/SiteHeader";
import { useCart } from "@/contexts/CartContext";
import { trackConversion } from "@/lib/tracking";

const fmt = (n: number | null) =>
  n == null ? "—" : `₦${Math.round(n).toLocaleString("en-NG")}`;

const PackageCard = ({ p, i }: { p: SolarPackage; i: number }) => {
  const { add } = useCart();
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut", delay: (i % 4) * 0.05 }}
    className="group relative rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col"
  >
    <div className="relative h-44 overflow-hidden">
      <img
        src={p.image}
        alt={p.inverter}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/55 to-midnight/20" />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold bg-gold text-midnight px-2.5 py-1 rounded-full shadow">
          #{p.package_number}
        </span>
        {p.badge && (
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full shadow">
            {p.badge}
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/75 mb-1">
          {p.tagline || (p.battery_type === "lithium" ? "Lithium LiFePO4" : "Tubular / Gel")}
        </p>
        <h3 className="text-lg font-display font-bold text-primary-foreground no-clip leading-tight">
          {p.inverter}
        </h3>
      </div>
    </div>

    <div className="p-6 flex flex-col flex-1">
      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Package</p>
        <p className="text-3xl font-display font-bold text-foreground">{fmt(p.total_price)}</p>
      </div>

      <ul className="space-y-2.5 mb-5 text-sm">
        <li className="flex items-start gap-2.5">
          <Sun size={16} className="text-gold mt-0.5 shrink-0" />
          <span className="text-foreground"><span className="text-muted-foreground">Panels:</span> {p.solar_panels}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Battery size={16} className="text-primary mt-0.5 shrink-0" />
          <span className="text-foreground"><span className="text-muted-foreground">Battery:</span> {p.battery}</span>
        </li>
        {p.charge_controller && p.charge_controller !== "NIL" && (
          <li className="flex items-start gap-2.5">
            <Cpu size={16} className="text-primary mt-0.5 shrink-0" />
            <span className="text-foreground"><span className="text-muted-foreground">Controller:</span> {p.charge_controller}</span>
          </li>
        )}
        <li className="flex items-start gap-2.5">
          <Zap size={16} className="text-accent mt-0.5 shrink-0" />
          <span className="text-foreground"><span className="text-muted-foreground">Powers:</span> {p.appliances}</span>
        </li>
      </ul>

      <div className="rounded-2xl bg-muted/40 p-3 mb-5 text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between"><span>Inverter</span><span className="text-foreground">{fmt(p.inverter_price)}</span></div>
        <div className="flex justify-between"><span>Panels</span><span className="text-foreground">{fmt(p.solar_panels_price)}</span></div>
        <div className="flex justify-between"><span>Battery</span><span className="text-foreground">{fmt(p.battery_price)}</span></div>
        {p.charge_controller_price ? (
          <div className="flex justify-between"><span>Controller</span><span className="text-foreground">{fmt(p.charge_controller_price)}</span></div>
        ) : null}
        <div className="flex justify-between"><span>Accessories</span><span className="text-foreground">{fmt(p.accessories_price)}</span></div>
        <div className="flex justify-between"><span>Setup</span><span className="text-foreground">{fmt(p.setup_fee)}</span></div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            add({
              refId: p.id,
              type: "package",
              name: `Solar Package #${p.package_number} — ${p.inverter}`,
              price: fmt(p.total_price),
              numericPrice: p.total_price,
              image: p.image,
              category: "solar",
            });
            trackConversion("cart_add", { source: "solar_package", id: p.package_number });
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary bg-primary/10 text-primary px-4 py-3 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <ShoppingBag size={13} /> Add to Cart
        </button>
        <Link
          to={`/customize/solar/${p.id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
        >
          Customize <ArrowRight size={13} />
        </Link>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        <Check size={10} className="inline" /> Valid 2 weeks · Installation included
      </p>
    </div>
  </motion.div>
  );
};

const SolarPackagesSection = () => {
  const { packages, loading } = useSolarPackages();
  const [tab, setTab] = useState<"lithium" | "tubular" | "high_voltage">("lithium");

  const filtered = useMemo(
    () => packages.filter((p) => p.battery_type === tab),
    [packages, tab]
  );

  if (loading || packages.length === 0) return null;

  return (
    <section id="solar-packages" data-no-reveal className="section-padding bg-muted/30 scroll-mt-24">
      <div className="section-container">
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

        <div className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap p-1.5 rounded-full bg-card border border-border shadow-sm gap-1">
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


        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <PackageCard key={p.id} p={p} i={i} />
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <Sparkles className="text-gold mx-auto mb-3" size={26} />
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
            <Sparkles size={16} /> Build my custom package
          </button>
        </div>
      </div>
    </section>
  );
};

export default SolarPackagesSection;
