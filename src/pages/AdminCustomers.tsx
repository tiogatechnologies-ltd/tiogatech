import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Search, Users as UsersIcon, Mail } from "lucide-react";

interface Customer { id: string; email: string | null; full_name: string | null; phone: string | null; created_at: string; order_count?: number; lifetime_value?: number; last_order_at?: string | null; }

const AdminCustomers = () => {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase.from("profiles").select("id, email, full_name, phone, created_at").order("created_at", { ascending: false });
      const enriched: Customer[] = [];
      for (const p of profiles || []) {
        const { data: orders } = await supabase.from("orders").select("total, created_at").eq("user_id", p.id);
        const total = (orders || []).reduce((s, o: any) => s + Number(o.total || 0), 0);
        const last = (orders || []).sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))[0];
        enriched.push({ ...p, order_count: (orders || []).length, lifetime_value: total, last_order_at: last?.created_at || null });
      }
      setRows(enriched); setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => !q || (r.email || "").toLowerCase().includes(q.toLowerCase()) || (r.full_name || "").toLowerCase().includes(q.toLowerCase()) || (r.phone || "").includes(q)), [rows, q]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="font-display text-2xl font-bold flex items-center gap-2"><UsersIcon size={22} />Customers</h1><p className="text-sm text-muted-foreground">{rows.length} total · LTV based on paid + pending orders</p></div>
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm w-72" /></div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Customer</th><th className="text-left px-4 py-3">Phone</th><th className="text-left px-4 py-3">Orders</th><th className="text-left px-4 py-3">LTV</th><th className="text-left px-4 py-3">Last order</th><th className="text-left px-4 py-3">Joined</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No customers</td></tr> :
              filtered.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3"><div className="font-semibold">{c.full_name || "—"}</div><div className="text-xs text-muted-foreground">{c.email}</div></td>
                  <td className="px-4 py-3 text-xs">{c.phone || "—"}</td>
                  <td className="px-4 py-3">{c.order_count}</td>
                  <td className="px-4 py-3 font-semibold">₦{(c.lifetime_value || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">{c.email && <a href={`mailto:${c.email}`} className="p-1.5 rounded hover:bg-muted inline-block" title="Email"><Mail size={14} /></a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
