import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package, Search, Loader2, CheckCircle2, Truck, ClipboardList, AlertCircle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { breadcrumbJsonLd } from "@/lib/seoSchema";

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

const TrackOrder = () => {
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

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) {
      setError("Enter your order number and the email or phone used at checkout.");
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    setHistory([]);
    const { data, error: fnError } = await supabase.functions.invoke("track-order", {
      body: { order_number: orderNumber.trim(), contact: contact.trim() },
    });
    setLoading(false);
    if (fnError) {
      setError("We couldn't reach the tracking service. Please try again.");
      return;
    }
    const payload = data as { found?: boolean; message?: string; order?: TrackedOrder; history?: HistoryRow[] };
    if (!payload?.found || !payload.order) {
      setError(payload?.message ?? "No order matches that reference and contact.");
      return;
    }
    setOrder(payload.order);
    setHistory(payload.history ?? []);
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
                    <p className="font-mono text-sm text-muted-foreground">{order.order_number}</p>
                    <h2 className="font-display text-lg font-bold">Hi {order.full_name.split(" ")[0]}, here's your order</h2>
                    <p className="text-xs text-muted-foreground">
                      Placed {new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                      {pretty(order.status)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${order.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
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

                <dl className="grid gap-2 sm:grid-cols-2 text-sm pt-2">
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground text-xs">Items</dt>
                    <dd className="font-medium text-right sm:text-left">{order.items_summary} ({order.item_count})</dd>
                  </div>
                  <div className="flex justify-between gap-3 sm:block">
                    <dt className="text-muted-foreground text-xs">Delivery to</dt>
                    <dd className="font-medium text-right sm:text-left">{order.location}</dd>
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
