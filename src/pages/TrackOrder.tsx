import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package, Search, Loader2, CheckCircle2, Truck, ClipboardList, AlertCircle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { breadcrumbJsonLd } from "@/lib/seoSchema";
import { useAuth } from "@/contexts/AuthContext";
import { PRODUCTS } from "@/data/products";
import { resolveProductImage } from "@/lib/productImages";

interface TrackedOrder {
  order_number: string;
  full_name: string;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  items_summary: string;
  item_count: number;
  subtotal: number | null;
  shipping_fee: number | null;
  discount_amount: number | null;
  total: number | null;
  location: string;
  shipping_method: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  fulfilled_at: string | null;
}

interface HistoryRow {
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
}

const STAGES = ["new", "confirmed", "processing", "shipped", "delivered"];

const naira = (n: number | null | undefined) =>
  typeof n === "number" ? `₦${n.toLocaleString("en-NG")}` : "-";

const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const findProductImg = (name: string): string | null => {
  if (!name) return null;
  const clean = name.replace(/^\d+[\.\)]\s*/, "").split("(")[0].split("x")[0].trim().toLowerCase();
  if (!clean) return null;
  const match = PRODUCTS.find((p) => {
    const pn = p.name.toLowerCase();
    return pn === clean || pn.includes(clean) || clean.includes(pn);
  });
  if (match?.image_url) return resolveProductImage(match.image_url, match.category);
  return null;
};

const parseTrackedItems = (summary: string) => {
  if (!summary) return [];
  return summary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, idx) => {
      const cleanLine = line.replace(/^\d+[\.\)]\s*/, "").trim();
      const priceMatch = cleanLine.match(/\((₦?[0-9,]+(\.[0-9]+)?)\)/);
      const price = priceMatch ? priceMatch[1] : null;
      let name = cleanLine.replace(/\s*\([^)]*\)/, "").trim();
      let qty = 1;
      const qtyMatch = name.match(/x(\d+)$/i);
      if (qtyMatch) {
        qty = parseInt(qtyMatch[1], 10) || 1;
        name = name.replace(/x\d+$/i, "").trim();
      }
      const img = findProductImg(name);
      return {
        id: idx,
        name,
        qty,
        price,
        img,
      };
    });
};

const TrackOrder = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (orderNumber.trim()) next.set("order", orderNumber.trim().toUpperCase());
    else next.delete("order");
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  // Automatically check recent local orders or user orders if order param is given
  useEffect(() => {
    const ref = (params.get("order") || "").trim().toUpperCase();
    if (!ref) return;

    try {
      const local = JSON.parse(localStorage.getItem(`tioga_order_${ref}`) || "null");
      if (local && (local.order_number || local.tracking_id)) {
        setOrder(local);
        if (local.phone || local.email) setContact(local.phone || local.email);
        return;
      }

      const recent: any[] = JSON.parse(localStorage.getItem("tioga_recent_orders") || "[]");
      const found = recent.find((o) =>
        o.order_number?.toUpperCase() === ref ||
        o.tracking_id?.toUpperCase() === ref ||
        o.tracking_number?.toUpperCase() === ref
      );
      if (found) {
        setOrder(found);
        if (found.phone || found.email) setContact(found.phone || found.email);
        return;
      }
    } catch {}

    if (user) {
      (async () => {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .or(`order_number.eq.${ref},tracking_id.eq.${ref},tracking_number.eq.${ref}`)
          .maybeSingle();
        if (data) {
          setOrder(data as TrackedOrder);
        }
      })();
    }
  }, [params, user]);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = orderNumber.trim().toUpperCase();
    const who = contact.trim();
    if (!ref || !who) {
      setError("Enter your order number or tracking ID, and the email or phone used at checkout.");
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    setHistory([]);

    // 1. Check local storage cache
    try {
      const normWho = who.toLowerCase().replace(/\D/g, "");
      const local = JSON.parse(localStorage.getItem(`tioga_order_${ref}`) || "null");
      if (local) {
        const localPhone = (local.phone || "").replace(/\D/g, "");
        const localEmail = (local.email || "").toLowerCase();
        if (localEmail.includes(who.toLowerCase()) || (normWho.length >= 7 && localPhone.endsWith(normWho)) || localPhone === normWho) {
          setOrder(local);
          setLoading(false);
          return;
        }
      }

      const recent: any[] = JSON.parse(localStorage.getItem("tioga_recent_orders") || "[]");
      const found = recent.find((o) =>
        o.order_number?.toUpperCase() === ref ||
        o.tracking_id?.toUpperCase() === ref ||
        o.tracking_number?.toUpperCase() === ref
      );
      if (found) {
        const fPhone = (found.phone || "").replace(/\D/g, "");
        const fEmail = (found.email || "").toLowerCase();
        if (fEmail.includes(who.toLowerCase()) || (normWho.length >= 7 && fPhone.endsWith(normWho)) || fPhone === normWho) {
          setOrder(found);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // 2. If authenticated user, check database directly
    if (user) {
      try {
        const { data: dbOrder } = await supabase
          .from("orders")
          .select("*")
          .or(`order_number.eq.${ref},tracking_id.eq.${ref},tracking_number.eq.${ref}`)
          .maybeSingle();
        if (dbOrder) {
          setOrder(dbOrder as TrackedOrder);
          setLoading(false);
          return;
        }
      } catch {}
    }

    // 3. Try edge function if available
    try {
      const { data, error: fnError } = await supabase.functions.invoke("track-order", {
        body: { order_number: ref, contact: who },
      });
      if (!fnError && (data as any)?.found && (data as any)?.order) {
        setOrder((data as any).order);
        setHistory((data as any).history ?? []);
        setLoading(false);
        return;
      }
    } catch {}

    // 4. Fallback: check database directly for matching order_number and contact phone/email
    try {
      const { data: dbMatches } = await supabase
        .from("orders")
        .select("*")
        .maybeSingle();

      if (dbMatches) {
        const phoneDigits = (dbMatches.phone || "").replace(/\D/g, "");
        const contactDigits = who.replace(/\D/g, "");
        const matchesContact =
          (dbMatches.email && dbMatches.email.toLowerCase() === who.toLowerCase()) ||
          (contactDigits.length >= 7 && phoneDigits.endsWith(contactDigits));

        if (matchesContact) {
          setOrder(dbMatches as TrackedOrder);
          setLoading(false);
          return;
        }
      }
    } catch {}

    setLoading(false);
    setError("No order matches that reference and contact. Please verify your order number and phone/email.");
  };

  const currentStage = order ? Math.max(0, STAGES.indexOf(order.status)) : 0;
  const cancelled = order?.status === "cancelled";

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Track Your Order"
        description="Check the live status of your Tioga Technologies solar, security or smart home order using your order number and the email or phone you checked out with."
        path="/track"
        jsonLd={breadcrumbJsonLd([{ name: "Track Order", path: "/track" }])}
      />
      <SiteHeader />

      <main className="flex-1 pt-[96px] sm:pt-[112px] pb-16">
        <section className="section-container max-w-3xl">
          <div className="space-y-2 mb-6">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Package size={14} /> Order tracking
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Track your order</h1>
            <p className="text-sm text-muted-foreground">
              No account needed. Enter your order number and the email or phone number you used at checkout.
            </p>
          </div>

          <form onSubmit={lookup} className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="order-number" className="text-xs font-semibold text-foreground">Order number</label>
                <input
                  id="order-number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="TIO-1024"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono uppercase outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="order-contact" className="text-xs font-semibold text-foreground">Email or phone</label>
                <input
                  id="order-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@email.com or 0803..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60 transition-all w-full sm:w-auto"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Track order
            </button>

            {error && (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}
          </form>

          {order && (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-sm font-bold text-foreground">{order.order_number}</p>
                      {(order.tracking_id || order.tracking_number) && (
                        <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold">
                          Tracking: {order.tracking_id || order.tracking_number}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-lg font-bold">Hi {order.full_name.split(" ")[0]}, here's your order</h2>
                    <p className="text-xs text-muted-foreground">
                      Placed {new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                      {pretty(order.status)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${order.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      Payment: {pretty(order.payment_status ?? "pending")}
                    </span>
                  </div>
                </div>

                {!cancelled && (
                  <ol className="grid grid-cols-5 gap-1 pt-2">
                    {STAGES.map((s, i) => (
                      <li key={s} className="flex flex-col items-center gap-1.5 text-center">
                        <span
                          className={`h-2 w-full rounded-full ${i <= currentStage ? "bg-primary" : "bg-muted"}`}
                          aria-hidden
                        />
                        <span className={`text-[10px] sm:text-xs ${i <= currentStage ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {pretty(s)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Order Items ({order.item_count})
                  </p>
                  <div className="space-y-2">
                    {parseTrackedItems(order.items_summary).map((it) => (
                      <div key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background shadow-xs">
                        {it.img ? (
                          <img src={it.img} alt={it.name} className="h-11 w-11 rounded-lg object-contain bg-muted p-1 shrink-0" />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Package size={16} /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm leading-tight truncate">{it.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Quantity: <span className="font-semibold text-foreground">{it.qty}</span></p>
                        </div>
                        {it.price && (
                          <span className="font-semibold text-primary text-sm shrink-0">{it.price}</span>
                        )}
                      </div>
                    ))}
                    {parseTrackedItems(order.items_summary).length === 0 && (
                      <p className="text-sm text-foreground whitespace-pre-line">{order.items_summary}</p>
                    )}
                  </div>
                </div>

                <dl className="grid gap-2 sm:grid-cols-2 text-sm pt-2 border-t border-border">
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground text-xs">Delivery to</dt>
                    <dd className="font-medium text-right sm:text-left">{order.location}</dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground text-xs">Payment method</dt>
                    <dd className="font-medium capitalize text-right sm:text-left">{order.payment_method || "Online"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground text-xs">Delivery fee</dt>
                    <dd className="font-medium text-right sm:text-left">{order.shipping_fee ? naira(order.shipping_fee) : "Free"}</dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground text-xs">Total</dt>
                    <dd className="font-semibold text-accent text-right sm:text-left">{naira(order.total)}</dd>
                  </div>
                  {order.tracking_number && (
                    <div className="flex justify-between gap-3 sm:block">
                      <dt className="text-muted-foreground text-xs">Courier tracking</dt>
                      <dd className="font-mono font-medium text-right sm:text-left">{order.tracking_number}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
                  <ClipboardList size={16} className="text-primary" /> Status timeline
                </h3>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No updates yet - we'll move this along shortly.</p>
                ) : (
                  <ul className="space-y-3">
                    {history.map((h, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1 text-primary">
                          {h.to_status === "delivered" ? <CheckCircle2 size={14} /> : <Truck size={14} />}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {h.from_status ? `${pretty(h.from_status)} → ` : ""}{pretty(h.to_status)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.created_at).toLocaleString("en-NG")}
                            {h.note ? ` · ${h.note}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Something wrong with this order?{" "}
                <Link to="/contact" className="text-primary font-medium hover:underline">Contact support</Link>.
              </p>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TrackOrder;
