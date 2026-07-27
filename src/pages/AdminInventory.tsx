import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { AlertTriangle, Package, Plus, Minus, History, Search, Download, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";

interface Product { id: string; name: string; category: string | null; stock_qty: number | null; low_stock_threshold: number | null; price: string | null; is_active: boolean; }
interface Movement { id: string; product_id: string; delta: number; reason: string; note: string | null; created_at: string; }

const REASONS = ["restock", "sale", "return", "adjustment", "damage", "transfer"];

const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [adjust, setAdjust] = useState<{ product: Product; delta: number; reason: string; note: string } | null>(null);
  const [historyFor, setHistoryFor] = useState<Product | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkThreshold, setBulkThreshold] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("products").select("id, name, category, stock_qty, low_stock_threshold, price, is_active").order("name"),
      supabase.from("product_stock_movements").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setProducts((p || []) as any);
    setMovements((m || []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const s = Number(p.stock_qty ?? 0);
      const t = Number(p.low_stock_threshold ?? 5);
      if (filter === "low" && !(s > 0 && s <= t)) return false;
      if (filter === "out" && s !== 0) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, search, filter]);

  const stats = useMemo(() => {
    let low = 0, out = 0, units = 0;
    products.forEach((p) => {
      const s = Number(p.stock_qty ?? 0);
      const t = Number(p.low_stock_threshold ?? 5);
      units += s;
      if (s === 0) out++; else if (s <= t) low++;
    });
    return { low, out, units, total: products.length };
  }, [products]);

  const saveAdjustment = async () => {
    if (!adjust || !adjust.delta) return;
    const { error } = await supabase.from("product_stock_movements").insert({
      product_id: adjust.product.id,
      delta: adjust.delta,
      reason: adjust.reason,
      note: adjust.note || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Stock updated");
    setAdjust(null);
    load();
  };

  const productMovements = (id: string) => movements.filter((m) => m.product_id === id);

  const exportCsv = () => {
    const header = ["Product", "Category", "Price", "Stock", "Threshold", "Status", "Active"];
    const lines = filtered.map((p) => {
      const s = Number(p.stock_qty ?? 0);
      const t = Number(p.low_stock_threshold ?? 5);
      const status = s === 0 ? "out" : s <= t ? "low" : "ok";
      return [p.name, p.category ?? "", p.price ?? "", s, t, status, p.is_active ? "yes" : "no"]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    toast.success("Inventory exported");
  };

  const applyBulkThreshold = async () => {
    const value = parseInt(bulkThreshold || "", 10);
    if (Number.isNaN(value) || value < 0) return toast.error("Enter a valid threshold");
    const ids = filtered.map((p) => p.id);
    if (!ids.length) return toast.error("No products in the current view");
    const { error } = await supabase.from("products").update({ low_stock_threshold: value }).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`Threshold set to ${value} on ${ids.length} product(s)`);
    setBulkOpen(false); setBulkThreshold("");
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Inventory</h1>
            <p className="text-sm text-muted-foreground">Track stock levels, restocks, and movement history.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setBulkOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"><SlidersHorizontal size={14} />Bulk threshold</button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"><Download size={14} />Export CSV</button>
          </div>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Products", value: stats.total, color: "bg-primary/10 text-primary" },
            { label: "Units in stock", value: stats.units.toLocaleString(), color: "bg-blue-500/10 text-blue-600" },
            { label: "Low stock", value: stats.low, color: "bg-amber-500/10 text-amber-600" },
            { label: "Out of stock", value: stats.out, color: "bg-destructive/10 text-destructive" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}><Package size={16} /></div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm" />
          </div>
          {(["all", "low", "out"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{f === "all" ? "All" : f === "low" ? "Low stock" : "Out of stock"}</button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Threshold</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
                filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No products match</td></tr> :
                filtered.map((p) => {
                  const s = Number(p.stock_qty ?? 0);
                  const t = Number(p.low_stock_threshold ?? 5);
                  const status = s === 0 ? "out" : s <= t ? "low" : "ok";
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 font-mono">{s}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t}</td>
                      <td className="px-4 py-3">
                        {status === "out" ? <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold uppercase"><AlertTriangle size={10} />Out</span> :
                         status === "low" ? <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold uppercase"><AlertTriangle size={10} />Low</span> :
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-bold uppercase">OK</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setAdjust({ product: p, delta: 1, reason: "restock", note: "" })} className="p-1.5 rounded-lg hover:bg-muted text-green-600" title="Restock"><Plus size={14} /></button>
                          <button onClick={() => setAdjust({ product: p, delta: -1, reason: "adjustment", note: "" })} className="p-1.5 rounded-lg hover:bg-muted text-amber-600" title="Reduce"><Minus size={14} /></button>
                          <button onClick={() => setHistoryFor(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="History"><History size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {adjust && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setAdjust(null)}>
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">Adjust stock</h3>
            <p className="text-sm text-muted-foreground">{adjust.product.name} — current: <strong>{adjust.product.stock_qty ?? 0}</strong></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Change (+ / -)</label>
                <input type="number" value={adjust.delta} onChange={(e) => setAdjust({ ...adjust, delta: parseInt(e.target.value || "0") })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold">Reason</label>
                <select value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1 capitalize">
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold">Note (optional)</label>
              <input value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1" placeholder="PO number, supplier, etc." />
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              New stock will be <strong className="text-foreground">{Math.max(0, Number(adjust.product.stock_qty ?? 0) + (adjust.delta || 0))}</strong>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdjust(null)} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>
              <button onClick={saveAdjustment} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setHistoryFor(null)}>
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">{historyFor.name} — movements</h3>
            <div className="space-y-1.5">
              {productMovements(historyFor.id).length === 0 ? <p className="text-sm text-muted-foreground">No movements yet.</p> :
              productMovements(historyFor.id).map((m) => (
                <div key={m.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm">
                  <div>
                    <span className={`font-mono font-bold ${m.delta > 0 ? "text-green-600" : "text-destructive"}`}>{m.delta > 0 ? "+" : ""}{m.delta}</span>
                    <span className="ml-2 text-xs uppercase tracking-wider text-muted-foreground">{m.reason}</span>
                    {m.note && <p className="text-xs text-muted-foreground mt-0.5">{m.note}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(m.created_at), "MMM d, HH:mm")}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setHistoryFor(null)} className="w-full px-4 py-2 rounded-lg border border-border text-sm">Close</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInventory;
