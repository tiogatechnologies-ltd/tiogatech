import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { toast } from "sonner";
import WarrantyClaimDialog from "@/components/WarrantyClaimDialog";
import {
  Package,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Truck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const PAGE_SIZE = 10;
const STAGES = ["new", "confirmed", "processing", "shipped", "delivered"];

const naira = (n: number | null | undefined) =>
  typeof n === "number" ? `₦${n.toLocaleString("en-NG")}` : "—";

const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const parsePrice = (label: string | null) => {
  if (!label) return null;
  const digits = label.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
};

const StatusPill = ({ status }: { status: string }) => {
  const tone =
    status === "delivered" || status === "paid"
      ? "bg-emerald-500/10 text-emerald-600"
      : status === "cancelled" || status === "failed"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{pretty(status)}</span>;
};

const AccountOrders = () => {
  const { user } = useAuth();
  const { add, setOpen } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, { items: any[]; history: any[] }>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [serials, setSerials] = useState<Record<string, any[]>>({});
  const [claimSerial, setClaimSerial] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const { data, count } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (cancelled) return;
      setOrders(data || []);
      setTotal(count || 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggle = async (orderId: string) => {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    if (details[orderId]) return;
    setDetailLoading(true);
    const [{ data: items }, { data: history }, { data: serialRows }] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", orderId),
      supabase.from("order_status_history").select("*").eq("order_id", orderId).order("created_at"),
      supabase.from("device_serials" as any).select("*").eq("order_id", orderId).order("created_at"),
    ]);
    setDetails((d) => ({ ...d, [orderId]: { items: items || [], history: history || [] } }));
    setSerials((s) => ({ ...s, [orderId]: ((serialRows as any) || []) as any[] }));
    setDetailLoading(false);
  };

  const reorder = async (orderId: string) => {
    let items = details[orderId]?.items;
    if (!items) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      items = data || [];
      setDetails((d) => ({ ...d, [orderId]: { items: items!, history: d[orderId]?.history || [] } }));
    }
    if (!items.length) {
      toast.error("No items found on this order");
      return;
    }
    items.forEach((it) =>
      add({
        refId: it.id,
        type: (it.product_type === "package" ? "package" : "product") as "package" | "product",
        name: it.product_name,
        price: it.price_label,
        numericPrice: parsePrice(it.price_label),
        image: it.image_url,
        quantity: it.quantity || 1,
      }),
    );
    setOpen(true);
    toast.success(`${items.length} item(s) added back to your cart`);
  };

  const empty = !loading && orders.length === 0;

  const lifetime = useMemo(
    () => orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + Number(o.total || 0), 0),
    [orders],
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="My Orders — Tioga Technologies"
        description="View your full Tioga Technologies order history, track delivery progress and reorder past purchases."
        path="/account/orders"
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-28 sm:pt-32">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">My orders</h1>
            <p className="text-sm text-muted-foreground">
              {total} order{total === 1 ? "" : "s"} · {naira(lifetime)} paid on this page
            </p>
          </div>
          <Link to="/account" className="text-sm font-semibold text-primary">
            Back to account
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
              <Loader2 className="mr-2 animate-spin" size={16} /> Loading orders…
            </div>
          )}

          {empty && (
            <div className="rounded-2xl border border-border bg-card py-16 text-center">
              <Package className="mx-auto mb-3 text-muted-foreground" size={28} />
              <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
              <Link to="/catalog" className="mt-3 inline-block font-semibold text-primary underline">
                Start shopping
              </Link>
            </div>
          )}

          {orders.map((o) => {
            const isOpen = expanded === o.id;
            const d = details[o.id];
            const stage = Math.max(0, STAGES.indexOf(o.status));
            return (
              <div key={o.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  onClick={() => toggle(o.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left hover:bg-muted/40 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{o.order_number}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.items_summary || `${o.item_count} item(s)`}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{naira(Number(o.total || 0))}</p>
                      <div className="mt-1 flex justify-end gap-1">
                        <StatusPill status={o.status} />
                        <StatusPill status={o.payment_status || "pending"} />
                      </div>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5">
                    {detailLoading && !d ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">Loading details…</div>
                    ) : (
                      <div className="space-y-5">
                        {/* Progress */}
                        {o.status !== "cancelled" && (
                          <div className="flex items-center">
                            {STAGES.map((s, i) => (
                              <div key={s} className="flex flex-1 items-center last:flex-none">
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                                      i <= stage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {i + 1}
                                  </span>
                                  <span className="hidden text-[10px] text-muted-foreground sm:block">{pretty(s)}</span>
                                </div>
                                {i < STAGES.length - 1 && (
                                  <div className={`mx-1 h-0.5 flex-1 ${i < stage ? "bg-primary" : "bg-border"}`} />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Items */}
                        <div>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Items</p>
                          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                            {(d?.items || []).map((it) => (
                              <li key={it.id} className="flex items-center gap-3 px-3 py-2.5">
                                {it.image_url ? (
                                  <img src={it.image_url} alt={it.product_name} loading="lazy" className="h-10 w-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <Package size={14} className="text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-foreground">{it.product_name}</p>
                                  <p className="text-xs text-muted-foreground">Qty {it.quantity}</p>
                                </div>
                                <p className="shrink-0 text-sm text-muted-foreground">{it.price_label || "—"}</p>
                              </li>
                            ))}
                            {d && d.items.length === 0 && (
                              <li className="px-3 py-4 text-center text-xs text-muted-foreground">No line items recorded.</li>
                            )}
                          </ul>
                        </div>

                        {/* Totals */}
                        <div className="grid gap-1.5 rounded-xl border border-border bg-card p-3 text-sm sm:max-w-xs">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{naira(Number(o.subtotal || 0))}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Delivery</span>
                            <span>{Number(o.shipping_fee || 0) === 0 ? "Free" : naira(Number(o.shipping_fee))}</span>
                          </div>
                          {Number(o.discount_amount || 0) > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Discount</span>
                              <span>−{naira(Number(o.discount_amount))}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-border pt-1.5 font-bold text-foreground">
                            <span>Total</span>
                            <span>{naira(Number(o.total || 0))}</span>
                          </div>
                        </div>

                        {/* Serial numbers & warranty */}
                        {!!(serials[o.id] || []).length && (
                          <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              Serial numbers & warranty
                            </p>
                            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                              {(serials[o.id] || []).map((sn: any) => {
                                const inW = !sn.warranty_until || new Date(sn.warranty_until) >= new Date();
                                return (
                                  <li key={sn.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-foreground">{sn.product_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Serial {sn.serial}
                                        {sn.warranty_until
                                          ? ` · warranty ${inW ? "until" : "expired"} ${new Date(sn.warranty_until).toLocaleDateString("en-NG")}`
                                          : ""}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => setClaimSerial(sn)}
                                      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                                    >
                                      <ShieldCheck size={13} /> Raise warranty claim
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Timeline */}
                        {!!d?.history?.length && (
                          <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Timeline</p>
                            <ul className="space-y-2">
                              {d.history.map((h) => (
                                <li key={h.id} className="flex items-start gap-2.5">
                                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    {h.to_status === "delivered" ? <CheckCircle2 size={13} /> : <Truck size={13} />}
                                  </span>
                                  <div>
                                    <p className="text-sm text-foreground">
                                      {h.from_status ? `${pretty(h.from_status)} → ` : ""}
                                      {pretty(h.to_status)}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {new Date(h.created_at).toLocaleString("en-NG")}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => reorder(o.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
                          >
                            <RefreshCw size={14} /> Reorder
                          </button>
                          <Link
                            to={`/track?order=${encodeURIComponent(o.order_number)}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                          >
                            <Truck size={14} /> Track order
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>

      {user && (
        <WarrantyClaimDialog
          serial={claimSerial}
          open={!!claimSerial}
          onOpenChange={(v) => !v && setClaimSerial(null)}
          customer={{ id: user.id, email: user.email || "", name: (user.user_metadata as any)?.full_name, phone: null }}
        />
      )}

      <SiteFooter />
    </div>
  );
};

export default AccountOrders;
