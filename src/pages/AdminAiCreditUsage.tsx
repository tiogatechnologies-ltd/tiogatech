import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { BarChart3, Search, Sparkles, CheckCircle2 } from "lucide-react";

interface UsageRow {
  id: string;
  user_id: string;
  feature: string;
  description: string | null;
  used_free_credit: boolean;
  subscription_plan: string | null;
  created_at: string;
  assessment_id: string | null;
}

const AdminAiCreditUsage = () => {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [users, setUsers] = useState<Record<string, { email: string; full_name: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("ai_credit_usage").select("*").order("created_at", { ascending: false }).limit(500);
      setRows((data as any) || []);
      if (data?.length) {
        const ids = Array.from(new Set(data.map((r: any) => r.user_id)));
        const { data: profs } = await supabase.from("profiles").select("id,email,full_name").in("id", ids);
        const map: Record<string, any> = {};
        (profs || []).forEach((p: any) => { map[p.id] = { email: p.email, full_name: p.full_name }; });
        setUsers(map);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (filter === "free" && !r.used_free_credit) return false;
    if (filter === "paid" && r.used_free_credit) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const u = users[r.user_id];
    return (u?.email || "").toLowerCase().includes(q) || (u?.full_name || "").toLowerCase().includes(q) || r.feature.toLowerCase().includes(q);
  });

  const totals = {
    all: rows.length,
    free: rows.filter((r) => r.used_free_credit).length,
    paid: rows.filter((r) => !r.used_free_credit).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><BarChart3 size={22} /> AI Credit Usage</h1>
          <p className="text-sm text-muted-foreground">Every AI report generated across the platform.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(["all", "free", "paid"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`p-4 rounded-2xl border text-left transition-colors ${filter === t ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t === "all" ? "All uses" : t === "free" ? "Free credit" : "Paid plan"}</div>
              <div className="font-display text-2xl font-bold">{totals[t]}</div>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user email, name, or feature…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Feature</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No usage records.</td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-xs">{users[r.user_id]?.full_name || "-"}</div>
                    <div className="text-[11px] text-muted-foreground">{users[r.user_id]?.email || r.user_id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{r.feature}</td>
                  <td className="px-4 py-3">
                    {r.used_free_credit ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-600"><Sparkles size={10} /> Free credit</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary"><CheckCircle2 size={10} /> {r.subscription_plan || "Plan"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[260px] truncate">{r.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAiCreditUsage;
