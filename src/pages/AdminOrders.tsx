import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, Phone, Mail, MapPin, Package, Trash2, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  full_name: string;
  phone: string;
  email: string | null;
  location: string;
  notes: string | null;
  items_summary: string;
  item_count: number;
  status: string;
  source: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_type: string | null;
  price_label: string | null;
  quantity: number;
  image_url: string | null;
}

const STATUSES = ["new", "contacted", "confirmed", "fulfilled", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  contacted: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  confirmed: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  fulfilled: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [itemsById, setItemsById] = useState<Record<string, OrderItem[]>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
    setLoading(false);
    if (error) { toast.error("Failed to load orders"); return; }
    setOrders((data || []) as Order[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!itemsById[id]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", id);
      setItemsById((p) => ({ ...p, [id]: (data || []) as OrderItem[] }));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error("Could not update status"); return; }
    toast.success("Status updated");
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error("Could not delete"); return; }
    toast.success("Order deleted");
    setOrders((p) => p.filter((o) => o.id !== id));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.full_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    STATUSES.forEach((s) => (c[s] = 0));
    orders.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold text-foreground">Orders</h2>
          <span className="text-xs text-muted-foreground">{orders.length} total</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatusFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            All ({counts.all})
          </button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {s} ({counts[s] || 0})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by name, phone, email, order #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No orders match.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((o) => {
              const isOpen = expanded === o.id;
              return (
                <div key={o.id} className="rounded-2xl border border-border bg-card">
                  <div className="p-4 flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{o.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[o.status] || "bg-muted text-muted-foreground"}`}>{o.status}</span>
                        <span className="text-[11px] text-muted-foreground">{format(new Date(o.created_at), "MMM d, HH:mm")}</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">{o.full_name}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Phone size={11} />{o.phone}</span>
                        {o.email && <span className="inline-flex items-center gap-1"><Mail size={11} />{o.email}</span>}
                        <span className="inline-flex items-center gap-1"><MapPin size={11} />{o.location}</span>
                        <span className="inline-flex items-center gap-1"><Package size={11} />{o.item_count} item{o.item_count !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
                        {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                      <a href={`https://wa.me/${o.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20" title="WhatsApp"><MessageCircle size={14} /></a>
                      <button onClick={() => toggleExpand(o.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title={isOpen ? "Collapse" : "Expand"}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => deleteOrder(o.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-border p-4 bg-muted/30">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Items</h4>
                      <ul className="space-y-1.5 mb-3">
                        {(itemsById[o.id] || []).map((it) => (
                          <li key={it.id} className="flex justify-between gap-3 text-sm">
                            <span className="text-foreground">{it.product_name}{it.quantity > 1 ? <span className="text-muted-foreground"> × {it.quantity}</span> : null}</span>
                            {it.price_label && <span className="font-semibold text-primary">{it.price_label}</span>}
                          </li>
                        ))}
                        {(!itemsById[o.id] || itemsById[o.id].length === 0) && (
                          <li className="text-xs text-muted-foreground whitespace-pre-line">{o.items_summary}</li>
                        )}
                      </ul>
                      {o.notes && (
                        <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300"><strong>Notes:</strong> {o.notes}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
