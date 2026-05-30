import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, MessageCircle, Minus, Plus, Loader2, Check, ShoppingBag } from "lucide-react";
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
  label: string;
  detail: string;
  unitPrice: number | null;
  qty: number;
  minQty?: number;
};

type LoadedPkg = {
  type: "solar" | "lock" | "automation";
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  basePrice: number | null;
  items: LineItem[];
  extras: { label: string; price: number | null }[];
  raw: any;
};

const parseLeadingQty = (s: string | null | undefined): number => {
  if (!s) return 1;
  const m = s.match(/^\s*(\d+)\s*[xX×]/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
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
          subtitle: d.tagline || (d.battery_type === "lithium" ? "Lithium LiFePO4" : "Tubular / Gel"),
          image: null,
          basePrice: d.total_price,
          items: [
            { key: "inverter", label: "Inverter", detail: d.inverter, unitPrice: d.inverter_price, qty: parseLeadingQty(d.inverter) },
            { key: "panels", label: "Solar Panels", detail: d.solar_panels, unitPrice: d.solar_panels_price, qty: parseLeadingQty(d.solar_panels) },
            { key: "battery", label: "Battery", detail: d.battery, unitPrice: d.battery_price, qty: parseLeadingQty(d.battery) },
            ...(d.charge_controller && d.charge_controller !== "NIL"
              ? [{ key: "controller", label: "Charge Controller", detail: d.charge_controller, unitPrice: d.charge_controller_price, qty: parseLeadingQty(d.charge_controller) }]
              : []),
          ],
          extras: [
            { label: "Accessories & cabling", price: d.accessories_price },
            { label: "Installation & setup", price: d.setup_fee },
          ],
          raw: d,
        });
      } else if (type === "lock") {
        setPkg({
          type: "lock",
          id: d.id,
          title: d.name,
          subtitle: d.series || d.model || "STAMA Smart Lock",
          image: null,
          basePrice: d.price,
          items: [
            { key: "unit", label: d.name, detail: d.tagline || d.model || "Smart lock unit", unitPrice: d.price, qty: 1, minQty: 1 },
          ],
          extras: [],
          raw: d,
        });
      } else {
        setPkg({
          type: "automation",
          id: d.id,
          title: `${d.name} — Home Automation`,
          subtitle: d.tagline || d.tier,
          image: null,
          basePrice: d.price,
          items: [
            { key: "package", label: `${d.name} Package`, detail: d.description?.slice(0, 90) || "Whole-home automation tier", unitPrice: d.price, qty: 1, minQty: 1 },
          ],
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
      `Items I want:`,
      ...items
        .filter((i) => i.qty > 0)
        .map((i) => `• ${i.qty} × ${i.label} — ${i.detail}${i.unitPrice ? ` (${ngn(i.unitPrice * i.qty)})` : ""}`),
    ];
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
    const summary = items
      .filter((i) => i.qty > 0)
      .map((i) => `${i.qty}× ${i.label}`)
      .join(", ");
    add({
      refId: pkg.id,
      type: "package",
      name: `${pkg.title} (Custom: ${summary})`,
      price: ngn(total),
      numericPrice: total,
      image: pkg.image ?? "",
      category: pkg.type,
    });
    trackConversion("cart_add", { source: "customize", type: pkg.type, id: pkg.id });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={pkg ? `Customize: ${pkg.title}` : "Customize your package"}
        description="Adjust quantities for inverters, panels, batteries and accessories — then send your custom build to our WhatsApp or AI advisor."
        path={`/customize/${type}/${id}`}
      />
      <SiteHeader />

      <PageHero
        eyebrow="Customize"
        title="Tailor this package to your needs"
        subtitle="Adjust quantities, add notes, then send the exact spec straight to our team on WhatsApp or get an AI-tuned recommendation."
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
              {/* Left: configurator */}
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
                    Use the steppers below to choose exactly how many of each component you need. Your total updates live.
                  </p>
                </motion.div>

                <div className="space-y-4">
                  {items.map((it, i) => (
                    <motion.div
                      key={it.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{it.label}</p>
                        <p className="font-semibold text-foreground">{it.detail}</p>
                        {it.unitPrice != null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Unit price: <span className="text-foreground font-medium">{ngn(it.unitPrice)}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <Stepper value={it.qty} onChange={(n) => setQty(it.key, n)} min={it.minQty ?? 0} />
                        <div className="text-right min-w-[90px]">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Subtotal</p>
                          <p className="font-display font-bold text-foreground">
                            {it.unitPrice ? ngn(it.unitPrice * it.qty) : "—"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

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
                    placeholder="e.g. I'd like to add a second battery, or my house is 2-storey…"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Right: sticky summary */}
              <aside className="lg:sticky lg:top-24 self-start">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Your custom total</p>
                  <p className="text-4xl font-display font-bold text-foreground mb-1">{ngn(total)}</p>
                  <p className="text-xs text-muted-foreground mb-5">
                    Final pricing confirmed after a quick site review.
                  </p>

                  <div className="space-y-2 text-xs mb-5 max-h-48 overflow-auto pr-1">
                    {items
                      .filter((i) => i.qty > 0)
                      .map((i) => (
                        <div key={i.key} className="flex justify-between gap-3">
                          <span className="text-muted-foreground truncate">{i.qty}× {i.label}</span>
                          <span className="text-foreground tabular-nums shrink-0">
                            {i.unitPrice ? ngn(i.unitPrice * i.qty) : "—"}
                          </span>
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
