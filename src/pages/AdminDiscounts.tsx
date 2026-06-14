import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Tag, Copy } from "lucide-react";

interface Discount { id: string; code: string; description: string | null; type: string; value: number; min_cart_ngn: number; max_uses: number | null; per_customer_cap: number; starts_at: string | null; expires_at: string | null; applies_to: string; active: boolean; uses_count: number; }

const empty: Partial<Discount> = { code: "", description: "", type: "percent", value: 10, min_cart_ngn: 0, per_customer_cap: 1, applies_to: "all", active: true };

const AdminDiscounts = () => {
  const [rows, setRows] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Discount> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("discounts").select("*").order("created_at", { ascending: false });
    setRows((data || []) as any); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.code) return toast.error("Code required");
    const payload = { ...editing, code: editing.code!.toUpperCase().trim() };
    const { error } = editing.id
      ? await supabase.from("discounts").update(payload as any).eq("id", editing.id)
      : await supabase.from("discounts").insert(payload as any);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => { if (!confirm("Delete this code?")) return; await supabase.from("discounts").delete().eq("id", id); load(); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-bold">Discounts</h1><p className="text-sm text-muted-foreground">Coupon codes and promo rules.</p></div>
          <button onClick={() => setEditing(empty)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2"><Plus size={16} />New code</button>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Code</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Min cart</th><th className="px-4 py-3">Uses</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              rows.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No discount codes yet</td></tr> :
              rows.map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Tag size={13} className="text-primary" /><code className="font-mono font-semibold">{d.code}</code><button onClick={() => { navigator.clipboard.writeText(d.code); toast.success("Copied"); }}><Copy size={12} className="opacity-50 hover:opacity-100" /></button></div></td>
                  <td className="px-4 py-3 capitalize">{d.type}</td>
                  <td className="px-4 py-3">{d.type === "percent" ? `${d.value}%` : `₦${d.value.toLocaleString()}`}</td>
                  <td className="px-4 py-3">₦{Number(d.min_cart_ngn).toLocaleString()}</td>
                  <td className="px-4 py-3">{d.uses_count}{d.max_uses ? ` / ${d.max_uses}` : ""}</td>
                  <td className="px-4 py-3">{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${d.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{d.active ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><button onClick={() => setEditing(d)} className="p-1.5 rounded hover:bg-muted"><Edit2 size={14} /></button><button onClick={() => remove(d.id)} className="p-1.5 rounded hover:bg-muted text-destructive"><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-background rounded-2xl border border-border max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">{editing.id ? "Edit" : "New"} discount</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Code</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase" value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></div>
              <div><label className="text-xs font-medium">Type</label><select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}><option value="percent">Percent</option><option value="flat">Flat NGN</option></select></div>
              <div><label className="text-xs font-medium">Value</label><input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={editing.value} onChange={(e) => setEditing({ ...editing, value: +e.target.value })} /></div>
              <div><label className="text-xs font-medium">Min cart (NGN)</label><input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={editing.min_cart_ngn} onChange={(e) => setEditing({ ...editing, min_cart_ngn: +e.target.value })} /></div>
              <div><label className="text-xs font-medium">Max uses</label><input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={editing.max_uses || ""} onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? +e.target.value : null })} placeholder="Unlimited" /></div>
              <div><label className="text-xs font-medium">Per-customer cap</label><input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={editing.per_customer_cap} onChange={(e) => setEditing({ ...editing, per_customer_cap: +e.target.value })} /></div>
              <div><label className="text-xs font-medium">Starts at</label><input type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={editing.starts_at?.slice(0,16) || ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
              <div><label className="text-xs font-medium">Expires at</label><input type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={editing.expires_at?.slice(0,16) || ""} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
            </div>
            <div><label className="text-xs font-medium">Description</label><textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />Active</label>
            <div className="flex justify-end gap-2 pt-2"><button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button><button onClick={save} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Save</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDiscounts;
