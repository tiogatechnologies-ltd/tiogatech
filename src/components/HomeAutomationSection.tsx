import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles, Music, Home } from "lucide-react";
import { useHomeAutomationPackages, type HomeAutomationPackage } from "@/hooks/useHomeAutomationPackages";
import { openLeadForm } from "@/components/SiteHeader";

const fmt = (p: HomeAutomationPackage) =>
  p.price_label ?? (p.price ? `From ₦${(p.price / 1_000_000).toFixed(1)}M` : "On request");

const PackageCard = ({ p, i }: { p: HomeAutomationPackage; i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.08 }}
    className="group relative rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col"
  >
    <div className="relative h-48 overflow-hidden">
      <img
        src={p.image}
        alt={p.name}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/55 to-midnight/15" />
      {p.badge && (
        <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.18em] font-bold bg-gold text-midnight px-2.5 py-1 rounded-full shadow">
          {p.badge}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/75 mb-1">
          {p.tagline}
        </p>
        <h3 className="text-2xl font-display font-bold text-primary-foreground no-clip leading-tight">
          {p.name}
        </h3>
      </div>
    </div>

    <div className="p-6 flex flex-col flex-1">
      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Starting From</p>
        <p className="text-3xl font-display font-bold text-foreground">{fmt(p)}</p>
      </div>

      <p className="text-sm text-muted-foreground mb-5">{p.description}</p>

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
        <div className="mb-5 rounded-2xl bg-muted/40 p-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-accent-foreground mb-2 flex items-center gap-1.5">
            <Music size={12} /> Entertainment
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {p.entertainment.map((e) => (
              <li key={e} className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                <span className="text-foreground">{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => openLeadForm(`home_automation_${p.tier.toLowerCase()}`)}
        className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
      >
        Customize this package <ArrowRight size={14} />
      </button>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        <Check size={10} className="inline" /> Site survey & installation included
      </p>
    </div>
  </motion.div>
);

const HomeAutomationSection = () => {
  const { packages, loading } = useHomeAutomationPackages();

  if (loading || packages.length === 0) return null;

  return (
    <section id="home-automation" className="section-padding scroll-mt-24">
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p, i) => (
            <PackageCard key={p.id} p={p} i={i} />
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <Sparkles className="text-gold mx-auto mb-3" size={26} />
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
            <Sparkles size={16} /> Design my smart home
          </button>
        </div>
      </div>
    </section>
  );
};

export default HomeAutomationSection;
