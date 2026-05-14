import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Lock, Sparkles, KeyRound, Building2 } from "lucide-react";
import { useSmartLocks, type SmartLock } from "@/hooks/useSmartLocks";
import { openLeadForm } from "@/components/SiteHeader";

const fmt = (item: SmartLock) =>
  item.price_label?.trim() ||
  (item.price ? `₦${Math.round(item.price).toLocaleString("en-NG")}` : "Quote");

const LockCard = ({ p, i }: { p: SmartLock; i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ type: "spring", stiffness: 100, damping: 20, delay: (i % 4) * 0.05 }}
    className="group relative rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col"
  >
    <div className="relative h-44 overflow-hidden">
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
        {p.badge && (
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full shadow">
            {p.badge}
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/75 mb-1">
          {p.series}
        </p>
        <h3 className="text-lg font-display font-bold text-primary-foreground no-clip leading-tight">
          {p.name}
        </h3>
      </div>
    </div>

    <div className="p-6 flex flex-col flex-1">
      <div className="mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {p.category === "hotel" ? "Investment" : "Price"}
        </p>
        <p className="text-2xl font-display font-bold text-foreground">{fmt(p)}</p>
        {p.tagline && (
          <p className="text-xs text-muted-foreground mt-1">{p.tagline}</p>
        )}
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
        <div className="rounded-2xl bg-muted/40 p-3 mb-5 text-xs text-muted-foreground space-y-1">
          {p.power_system && (
            <p><span className="text-foreground font-semibold">Power:</span> {p.power_system}</p>
          )}
          {p.ideal_for && (
            <p><span className="text-foreground font-semibold">Ideal for:</span> {p.ideal_for}</p>
          )}
        </div>
      )}

      <button
        onClick={() => openLeadForm(`smart_lock_${p.model || p.name}`)}
        className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
      >
        Order or get a quote <ArrowRight size={14} />
      </button>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        <Check size={10} className="inline" /> 1-year warranty · Pro installation included
      </p>
    </div>
  </motion.div>
);

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
    <section id="smart-locks" className="section-padding scroll-mt-24">
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

        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-full bg-card border border-border shadow-sm flex-wrap gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all inline-flex items-center gap-1.5 ${
                  tab === key
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <LockCard key={p.id} p={p} i={i} />
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
