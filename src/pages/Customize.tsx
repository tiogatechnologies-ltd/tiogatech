import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, MessageCircle, Minus, Plus, Loader2, Check, ShoppingBag, Info } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { trackConversion } from "@/lib/tracking";
import bgCustomize from "@/assets/feature-control-panel.jpg";

const WA_NUMBER = "2348178000023";

const ngn = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Math.round(n).toLocaleString("en-NG")}`;

type LineItem = {
  key: string;
  group: "core" | "addon";
  label: string;         // e.g. "Solar Panel"
  detail: string;        // e.g. "450W Panel"
  unitPrice: number | null;
  qty: number;
  defaultQty: number;
  minQty: number;
  unit?: string;         // e.g. "panel", "battery"
  note?: string;
};

type LoadedPkg = {
  type: "solar" | "lock" | "automation";
  id: string;
  title: string;
  subtitle: string;
  basePrice: number | null;
  items: LineItem[];
  extras: { label: string; price: number | null }[];
  raw: any;
};

// Parse component spec strings into { name, qty }.
// Handles trailing qty "450W Panels x 8", leading qty "60 x 600W Solar Panels",
// and bare strings like "60kWh Lithium Battery" or "Hybrid 3.5KVA 24V" (qty 1).
const parseSpec = (s: string | null | undefined): { name: string; qty: number } => {
  if (!s) return { name: "", qty: 1 };
  const trimmed = s.trim();
  // Trailing qty: "450W Panels x 8"
  let m = trimmed.match(/^(.*?)\s*[xX×]\s*(\d+)\s*$/);
  if (m) {
    const name = m[1].trim().replace(/Panels$/i, "Panel").replace(/Batteries$/i, "Battery");
    return { name, qty: Math.max(1, parseInt(m[2], 10)) };
  }
  // Leading qty: "60 x 600W Solar Panels"
  m = trimmed.match(/^(\d+)\s*[xX×]\s*(.+)$/);
  if (m) {
    const name = m[2].trim().replace(/Panels$/i, "Panel").replace(/Batteries$/i, "Battery");
    return { name, qty: Math.max(1, parseInt(m[1], 10)) };
  }
  return { name: trimmed, qty: 1 };
};

const buildSolarItems = (d: any): LineItem[] => {
  const items: LineItem[] = [];

  const inv = parseSpec(d.inverter);
  items.push({
    key: "inverter",
    group: "core",
    label: "Inverter",
    detail: inv.name,
    unitPrice: d.inverter_price != null && inv.qty ? d.inverter_price / inv.qty : d.inverter_price,
    qty: inv.qty,
    defaultQty: inv.qty,
    minQty: 1,
    unit: "inverter",
  });

  const pan = parseSpec(d.solar_panels);
  items.push({
    key: "panels",
    group: "core",
    label: "Solar Panels",
    detail: pan.name,
    unitPrice: d.solar_panels_price != null && pan.qty ? d.solar_panels_price / pan.qty : d.solar_panels_price,
    qty: pan.qty,
    defaultQty: pan.qty,
    minQty: 0,
    unit: "panel",
    note: "Add more to generate extra daytime power, or reduce if your roof space is limited.",
  });

  const bat = parseSpec(d.battery);
  items.push({
    key: "battery",
    group: "core",
    label: "Battery Storage",
    detail: bat.name,
    unitPrice: d.battery_price != null && bat.qty ? d.battery_price / bat.qty : d.battery_price,
    qty: bat.qty,
    defaultQty: bat.qty,
    minQty: 1,
    unit: "battery",
    note: "Add more batteries for longer night-time backup.",
  });

  if (d.charge_controller && d.charge_controller.toUpperCase() !== "NIL") {
    const cc = parseSpec(d.charge_controller);
    items.push({
      key: "controller",
      group: "core",
      label: "Charge Controller",
      detail: cc.name,
      unitPrice: d.charge_controller_price != null && cc.qty ? d.charge_controller_price / cc.qty : d.charge_controller_price,
      qty: cc.qty,
      defaultQty: cc.qty,
      minQty: 1,
      unit: "controller",
    });
  }

  return items;
};

const buildLockItems = (d: any): LineItem[] => {
  const items: LineItem[] = [
    {
      key: "lock_unit",
      group: "core",
      label: d.name,
      detail: d.tagline || d.series || "Smart lock unit",
      unitPrice: d.price,
      qty: 1,
      defaultQty: 1,
      minQty: 1,
      unit: "unit",
      note: "Increase quantity if you have multiple doors.",
    },
  ];

  const features: string[] = Array.isArray(d.features) ? d.features : [];
  features.forEach((f, i) => {
    items.push({
      key: `feature_${i}`,
      group: "addon",
      label: f,
      detail: "Included feature — adjust if you need extra capacity",
      unitPrice: null,
      qty: 1,
      defaultQty: 1,
      minQty: 0,
      unit: "unit",
    });
  });

  return items;
};

const buildAutomationItems = (d: any): LineItem[] => {
  const items: LineItem[] = [
    {
      key: "package_base",
      group: "core",
      label: `${d.name} Package — Base Setup`,
      detail: d.description?.slice(0, 120) || `${d.tier} whole-home automation`,
      unitPrice: d.price,
      qty: 1,
      defaultQty: 1,
      minQty: 1,
      unit: "package",
    },
  ];

  const features: string[] = Array.isArray(d.features) ? d.features : [];
  features.forEach((f, i) => {
    items.push({
      key: `feature_${i}`,
      group: "addon",
      label: f,
      detail: "Smart device included — increase qty for extra rooms or zones",
      unitPrice: null,
      qty: 1,
      defaultQty: 1,
      minQty: 0,
      unit: "zone",
    });
  });

  const ent: string[] = Array.isArray(d.entertainment) ? d.entertainment : [];
  ent.forEach((f, i) => {
    items.push({
      key: `ent_${i}`,
      group: "addon",
      label: f,
      detail: "Entertainment add-on — adjust to taste",
      unitPrice: null,
      qty: 1,
      defaultQty: 1,
      minQty: 0,
      unit: "unit",
    });
  });

  return items;
};

const useLoadPackage = (type: string | undefined, id: string | undefined) => {
  const [pkg, setPkg] = useState<LoadedPkg | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) {
      setError("Invalid package");
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const table =
        type === "solar"
          ? "solar_packages"
          : type === "lock"
          ? "smart_locks"
          : type === "automation"
          ? "home_automation_packages"
          : null;
      if (!table) {
        setError("Unknown package type");
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from(table as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      if (err || !data) {
        setError("Package not found");
        setLoading(false);
        return;
      }
      const d: any = data;
      if (type === "solar") {
        setPkg({
          type: "solar",
          id: d.id,
          title: `Solar Package #${d.package_number} — ${d.inverter}`,
          subtitle: d.tagline || (d.battery_type === "lithium" ? "Lithium LiFePO4 system" : "Tubular / Gel system"),
          basePrice: d.total_price,
          items: buildSolarItems(d),
          extras: [
            { label: "Accessories & cabling", price: d.accessories_price },
            { label: "Installation & setup", price: d.setup_fee },
          ].filter((e) => e.price != null),
          raw: d,
        });
      } else if (type === "lock") {
        setPkg({
          type: "lock",
          id: d.id,
          title: d.name,
          subtitle: d.series || d.model || "STAMA Smart Lock",
          basePrice: d.price,
          items: buildLockItems(d),
          extras: [],
          raw: d,
        });
      } else {
        setPkg({
          type: "automation",
          id: d.id,
          title: `${d.name} — Home Automation`,
          subtitle: d.tagline || d.tier,
          basePrice: d.price,
          items: buildAutomationItems(d),
          extras: [],
          raw: d,
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [type, id]);

  return { pkg, loading, error };
};

const Stepper = ({ value, onChange, min = 0 }: { value: number; onChange: (n: number) => void; min?: number }) => (
  <div className="inline-flex items-center rounded-full border border-border bg-card overflow-hidden">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      className="px-3 py-2 text-foreground hover:bg-muted transition-colors disabled:opacity-40"
      disabled={value <= min}
      aria-label="Decrease"
    >
      <Minus size={14} />
    </button>
    <span className="px-4 text-sm font-semibold tabular-nums w-12 text-center">{value}</span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      className="px-3 py-2 text-foreground hover:bg-muted transition-colors"
      aria-label="Increase"
    >
      <Plus size={14} />
    </button>
  </div>
);

const ItemCard = ({ item, onChange, index }: { item: LineItem; onChange: (n: number) => void; index: number }) => {
  const changed = item.qty !== item.defaultQty;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className={`rounded-2xl border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${
        changed ? "border-primary/50 ring-1 ring-primary/20" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
          {changed && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {item.qty > item.defaultQty ? `+${item.qty - item.defaultQty}` : `${item.qty - item.defaultQty}`}
            </span>
          )}
        </div>
        <p className="font-semibold text-foreground leading-snug">{item.detail}</p>
        {item.unitPrice != null && (
          <p className="text-xs text-muted-foreground mt-1">
            {ngn(item.unitPrice)} per {item.unit ?? "unit"}
          </p>
        )}
        {item.unitPrice == null && item.group === "addon" && (
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <Info size={11} /> Quoted with package
          </p>
        )}
        {item.note && (
          <p className="text-[11px] text-muted-foreground mt-1.5 italic">{item.note}</p>
        )}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        <Stepper value={item.qty} onChange={onChange} min={item.minQty} />
        <div className="text-right min-w-[90px]">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Subtotal</p>
          <p className="font-display font-bold text-foreground tabular-nums">
            {item.unitPrice != null ? ngn(item.unitPrice * item.qty) : "—"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const Customize = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { pkg, loading, error } = useLoadPackage(type, id);

  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (pkg) setItems(pkg.items);
  }, [pkg]);

  const coreItems = useMemo(() => items.filter((i) => i.group === "core"), [items]);
  const addonItems = useMemo(() => items.filter((i) => i.group === "addon"), [items]);

  const itemsSubtotal = useMemo(
    () => items.reduce((sum, it) => sum + (it.unitPrice ? it.unitPrice * it.qty : 0), 0),
    [items]
  );
  const extrasSubtotal = useMemo(
    () => (pkg?.extras ?? []).reduce((s, e) => s + (e.price ?? 0), 0),
    [pkg]
  );
  const total = itemsSubtotal + extrasSubtotal;

  const setQty = (key: string, qty: number) => {
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, qty } : it)));
  };

  const buildMessage = () => {
    if (!pkg) return "";
    const lines = [
      `Hello Tioga! I'd like to customize this package:`,
      ``,
      `*${pkg.title}*`,
      `(${pkg.subtitle})`,
      ``,
      `My configuration:`,
      ...coreItems
        .filter((i) => i.qty > 0)
        .map((i) => {
          const diff = i.qty !== i.defaultQty ? ` [changed from ${i.defaultQty}]` : "";
          return `• ${i.qty} × ${i.detail}${i.unitPrice ? ` — ${ngn(i.unitPrice * i.qty)}` : ""}${diff}`;
        }),
    ];

    const adjustedAddons = addonItems.filter((i) => i.qty !== i.defaultQty || i.qty > 1);
    if (adjustedAddons.length) {
      lines.push("", "Add-on adjustments:");
      adjustedAddons.forEach((i) =>
        lines.push(`• ${i.qty} × ${i.label}${i.qty !== i.defaultQty ? ` [was ${i.defaultQty}]` : ""}`)
      );
    }

    if (pkg.extras.length) {
      lines.push("", "Included:");
      pkg.extras.forEach((e) => lines.push(`• ${e.label}${e.price ? ` (${ngn(e.price)})` : ""}`));
    }
    lines.push("", `Estimated total: *${ngn(total)}*`);
    if (notes.trim()) lines.push("", `Notes: ${notes.trim()}`);
    lines.push("", `Please confirm availability and next steps. Thanks!`);
    return lines.join("\n");
  };

  const handleWhatsApp = () => {
    trackConversion("whatsapp_click", { source: "customize", type: pkg?.type, id: pkg?.id });
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAddToCart = () => {
    if (!pkg) return;
    const summary = coreItems
      .filter((i) => i.qty > 0)
      .map((i) => `${i.qty}× ${i.detail}`)
      .join(", ");
    add({
      refId: pkg.id,
      type: "package",
      name: `${pkg.title} (Custom: ${summary})`,
      price: ngn(total),
      numericPrice: total,
      image: "",
      category: pkg.type,
    });
    trackConversion("cart_add", { source: "customize", type: pkg.type, id: pkg.id });
  };

  const resetToDefault = () => {
    setItems((arr) => arr.map((i) => ({ ...i, qty: i.defaultQty })));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={pkg ? `Customize: ${pkg.title}` : "Customize your package"}
        description="Adjust quantities for inverters, panels, batteries, smart-lock features and more — then send your exact spec to our team."
        path={`/customize/${type}/${id}`}
      />
      <SiteHeader />

      <PageHero
        eyebrow="Customize"
        title="Tailor every component to your needs"
        subtitle="Increase or decrease quantities for each part of the package. Your total updates live, and we'll confirm the final spec with you."
        backgroundImage={bgCustomize}
        backgroundAlt="Tailor your solar, security or automation package"
      >
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/15 transition-all"
        >
          <ArrowLeft size={14} /> Back to packages
        </button>
      </PageHero>

      <section className="section-padding">
        <div className="section-container max-w-5xl">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-24">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link to="/packages" className="text-primary font-semibold hover:underline">← Back to all packages</Link>
            </div>
          )}

          {pkg && !loading && (
            <div className="grid lg:grid-cols-[1fr_360px] gap-8">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)] mb-6"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">{pkg.subtitle}</p>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight no-clip mb-2">
                    {pkg.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Use the steppers below to choose exactly how many of each component you need.
                    {coreItems.some((i) => i.unitPrice) && " Your total updates live."}
                  </p>
                </motion.div>

                {coreItems.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-baseline justify-between mb-3 px-1">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Core components</h2>
                      <button
                        onClick={resetToDefault}
                        className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        Reset to default
                      </button>
                    </div>
                    <div className="space-y-3">
                      {coreItems.map((it, i) => (
                        <ItemCard key={it.key} item={it} index={i} onChange={(n) => setQty(it.key, n)} />
                      ))}
                    </div>
                  </div>
                )}

                {addonItems.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-1 px-1">
                      {pkg.type === "lock" ? "Features & capacity" : "Add-ons & devices"}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-3 px-1">
                      {pkg.type === "lock"
                        ? "These features come with the lock. Increase any quantity to request extra capacity or additional units."
                        : "Devices included with the package. Adjust quantities to match your home."}
                    </p>
                    <div className="space-y-3">
                      {addonItems.map((it, i) => (
                        <ItemCard key={it.key} item={it} index={i} onChange={(n) => setQty(it.key, n)} />
                      ))}
                    </div>
                  </div>
                )}

                {pkg.extras.length > 0 && (
                  <div className="mt-6 rounded-2xl bg-muted/40 border border-border p-5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-foreground mb-3">Always included</p>
                    <ul className="space-y-2 text-sm">
                      {pkg.extras.map((e) => (
                        <li key={e.label} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-foreground">
                            <Check size={14} className="text-primary" /> {e.label}
                          </span>
                          <span className="text-muted-foreground">{ngn(e.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6">
                  <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Anything else we should know? (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. I want the lock fitted on a metal door, or my house has 3 bedrooms upstairs…"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Sticky summary */}
              <aside className="lg:sticky lg:top-24 self-start">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Your custom total</p>
                  <p className="text-4xl font-display font-bold text-foreground mb-1 tabular-nums">{ngn(total)}</p>
                  <p className="text-xs text-muted-foreground mb-5">
                    Final pricing confirmed after a quick site review.
                  </p>

                  <div className="space-y-2 text-xs mb-5 max-h-56 overflow-auto pr-1">
                    {coreItems
                      .filter((i) => i.qty > 0)
                      .map((i) => (
                        <div key={i.key} className="flex justify-between gap-3">
                          <span className="text-muted-foreground truncate">{i.qty}× {i.detail}</span>
                          <span className="text-foreground tabular-nums shrink-0">
                            {i.unitPrice ? ngn(i.unitPrice * i.qty) : "—"}
                          </span>
                        </div>
                      ))}
                    {addonItems.filter((i) => i.qty !== i.defaultQty).map((i) => (
                      <div key={i.key} className="flex justify-between gap-3 text-primary">
                        <span className="truncate">{i.qty}× {i.label}</span>
                        <span className="tabular-nums shrink-0">adj.</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={handleWhatsApp}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:brightness-110 active:scale-[0.98] transition-all text-white px-5 py-3 text-sm font-semibold shadow-md"
                    >
                      <MessageCircle size={16} /> Send to WhatsApp
                    </button>
                    <button
                      onClick={() => openLeadForm(`customize_${pkg.type}_${pkg.id}`)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground hover:brightness-110 active:scale-[0.98] transition-all px-5 py-3 text-sm font-semibold shadow-md shadow-accent/30"
                    >
                      <Sparkles size={16} /> Get AI Recommendation
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all px-5 py-3 text-sm font-semibold"
                    >
                      <ShoppingBag size={16} /> Add custom build to cart
                    </button>
                  </div>

                  <Link
                    to="/packages"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft size={12} /> Browse other packages <ArrowRight size={12} />
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Customize;
