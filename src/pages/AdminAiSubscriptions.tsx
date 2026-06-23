import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Zap, Plus, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  user_id: string;
  plan: "free" | "starter" | "business";
  status: "active" | "expired" | "pending" | "revoked";
  started_at: string;
  expires_at: string | null;
  monthly_price_ngn: number;
  notes: string | null;
  created_at: string;
}

const STATUS_TABS = ["active", "pending", "expired", "revoked"] as const;

const AdminAiSubscriptions = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [users, setUsers] = useState<Record<string, { email: string; full_name: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof STATUS_TABS[number]>("active");
  const [openGrant, setOpenGrant] = useState(false);
  const [granting, setGranting] = useState(false);
  const [form, setForm] = useState({ email: "", plan: "starter" as Row["plan"], months: 1, monthly_price_ngn: 2500, notes: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("ai_subscriptions").select("*").order("created_at", { ascending: false });
    setRows((data || []) as any);
    if (data?.length) {
      const ids = Array.from(new Set(data.map((r: any) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id,email,full_name").in("id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.id] = { email: p.email, full_name: p.full_name }; });
      setUsers(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const grant = async () => {
    if (!form.email) return toast.error("Email required");
    setGranting(true);
    const { data: prof } = await supabase.from("profiles").select("id").eq("email", form.email.trim().toLowerCase()).maybeSingle();
    if (!prof) { setGranting(false); return toast.error("User not found. They must sign up first."); }
    const expires_at = form.months > 0 ? new Date(Date.now() + form.months * 30 * 24 * 60 * 60 * 1000).toISOString() : null;
    const { data: existing } = await supabase.from("ai_subscriptions").select("id").eq("user_id", prof.id).maybeSingle();
    const payload = {
      user_id: prof.id, plan: form.plan, status: "active" as const, monthly_price_ngn: form.monthly_price_ngn,
      expires_at, started_at: new Date().toISOString(), notes: form.notes || null,
    };
    const op = existing
      ? supabase.from("ai_subscriptions").update(payload).eq("id", existing.id)
      : supabase.from("ai_subscriptions").insert(payload);
    const { error } = await op;
    setGranting(false);
    if (error) return toast.error(error.message);
    toast.success(`Granted ${form.plan} to ${form.email}`);
    setOpenGrant(false); setForm({ email: "", plan: "starter", months: 1, monthly_price_ngn: 2500, notes: "" });
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this subscription?")) return;
    await supabase.from("ai_subscriptions").update({ status: "revoked", expires_at: new Date().toISOString() }).eq("id", id);
    toast.success("Revoked"); load();
  };

  const filtered = rows.filter((r) => r.status === tab);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Zap size={22} /> AI Subscriptions</h1>
            <p className="text-sm text-muted-foreground">Manually activate, extend, or revoke paid AI plans after off-platform payment.</p>
          </div>
          <button onClick={() => setOpenGrant(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus size={14} /> Grant subscription</button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-border">
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t} <span className="ml-1 text-xs opacity-60">({rows.filter((r) => r.status === t).length})</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-4 py-3">User</th><th className="text-left px-4 py-3">Plan</th><th className="text-left px-4 py-3">Price</th><th className="text-left px-4 py-3">Started</th><th className="text-left px-4 py-3">Expires</th><th className="text-left px-4 py-3">Notes</th><th /></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No {tab} subscriptions</td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{users[r.user_id]?.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{users[r.user_id]?.email || r.user_id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3 capitalize"><span className={`text-xs px-2 py-1 rounded-full ${r.plan === "business" ? "bg-accent/20 text-accent-foreground" : r.plan === "starter" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{r.plan}</span></td>
                  <td className="px-4 py-3">₦{Number(r.monthly_price_ngn).toLocaleString()}/mo</td>
                  <td className="px-4 py-3 text-xs">{new Date(r.started_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs">{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "active" && <button onClick={() => revoke(r.id)} className="text-xs text-red-600 hover:underline">Revoke</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openGrant && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpenGrant(false)}>
          <div className="bg-background w-full sm:max-w-md sm:rounded-2xl border-t sm:border border-border max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Grant AI subscription</h2>
                <button onClick={() => setOpenGrant(false)} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-semibold">User email</label>
                  <input className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="customer@example.com" />
                  <p className="text-[11px] text-muted-foreground mt-1">User must have signed up already.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Plan</label>
                    <select className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as any, monthly_price_ngn: e.target.value === "business" ? 10000 : 2500 })}>
                      <option value="starter">Starter</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Duration (months)</label>
                    <select className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.months} onChange={(e) => setForm({ ...form, months: Number(e.target.value) })}>
                      <option value={1}>1 month</option>
                      <option value={3}>3 months</option>
                      <option value={6}>6 months</option>
                      <option value={12}>12 months</option>
                      <option value={0}>No expiry</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold">Monthly price (NGN)</label>
                  <input type="number" className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.monthly_price_ngn} onChange={(e) => setForm({ ...form, monthly_price_ngn: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-semibold">Notes (payment reference, etc.)</label>
                  <textarea className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <button onClick={grant} disabled={granting} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {granting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Activate subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAiSubscriptions;
