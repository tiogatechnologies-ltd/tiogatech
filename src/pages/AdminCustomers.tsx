import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Search, Users as UsersIcon, Mail, Download, X, Tag as TagIcon, Loader2, Trash2 } from "lucide-react";

interface OrderLite { id: string; order_number: string | null; total: number | null; status: string | null; payment_status: string | null; created_at: string; user_id: string | null; email: string | null; }
interface NoteRow { id: string; user_id: string; body: string; pinned: boolean | null; created_at: string; }
interface TagRow { id: string; user_id: string; tag: string; }

interface Customer {
  id: string; email: string | null; full_name: string | null; phone: string | null; created_at: string;
  order_count: number; lifetime_value: number; last_order_at: string | null;
}

type Segment = "all" | "vip" | "repeat" | "at_risk" | "dormant" | "new";

const DAY = 86400000;

const segmentOf = (c: Customer): Segment[] => {
  const segs: Segment[] = [];
  const since = c.last_order_at ? (Date.now() - +new Date(c.last_order_at)) / DAY : null;
  if (c.lifetime_value >= 1_000_000) segs.push("vip");
  if (c.order_count >= 2) segs.push("repeat");
  if (since !== null && since > 90 && since <= 180) segs.push("at_risk");
  if (c.order_count === 0 || (since !== null && since > 180)) segs.push("dormant");
  if ((Date.now() - +new Date(c.created_at)) / DAY <= 30) segs.push("new");
  return segs;
};

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "all", label: "All" },
  { key: "vip", label: "VIP (₦1M+)" },
  { key: "repeat", label: "Repeat" },
  { key: "new", label: "New (30d)" },
  { key: "at_risk", label: "At risk" },
  { key: "dormant", label: "Dormant" },
];

const AdminCustomers = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [active, setActive] = useState<Customer | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    // Single pass: profiles + all orders + tags + notes, then aggregate client-side (no N+1).
    const [profRes, orderRes, tagRes, noteRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, phone, created_at").order("created_at", { ascending: false }),
      supabase.from("orders").select("id, order_number, total, status, payment_status, created_at, user_id, email").order("created_at", { ascending: false }).limit(1000),
      supabase.from("customer_tags").select("id, user_id, tag"),
      supabase.from("customer_notes").select("id, user_id, body, pinned, created_at").order("created_at", { ascending: false }),
    ]);

    const allOrders = (orderRes.data || []) as OrderLite[];
    const byUser = new Map<string, OrderLite[]>();
    const byEmail = new Map<string, OrderLite[]>();
    allOrders.forEach((o) => {
      if (o.user_id) byUser.set(o.user_id, [...(byUser.get(o.user_id) || []), o]);
      else if (o.email) byEmail.set(o.email.toLowerCase(), [...(byEmail.get(o.email.toLowerCase()) || []), o]);
    });

    const enriched: Customer[] = (profRes.data || []).map((p: any) => {
      const list = [...(byUser.get(p.id) || []), ...(p.email ? byEmail.get(String(p.email).toLowerCase()) || [] : [])];
      const total = list.reduce((s, o) => s + Number(o.total || 0), 0);
      const last = list[0];
      return { ...p, order_count: list.length, lifetime_value: total, last_order_at: last?.created_at || null };
    });

    setOrders(allOrders);
    setTags((tagRes.data || []) as TagRow[]);
    setNotes((noteRes.data || []) as NoteRow[]);
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (segment !== "all" && !segmentOf(r).includes(segment)) return false;
    if (!q) return true;
    const f = q.toLowerCase();
    return (r.email || "").toLowerCase().includes(f) || (r.full_name || "").toLowerCase().includes(f) || (r.phone || "").includes(q);
  }), [rows, q, segment]);

  const segmentCount = (s: Segment) => (s === "all" ? rows.length : rows.filter((r) => segmentOf(r).includes(s)).length);

  const customerOrders = (c: Customer) => orders.filter((o) => o.user_id === c.id || (c.email && o.email?.toLowerCase() === c.email.toLowerCase()));
  const customerTags = (id: string) => tags.filter((t) => t.user_id === id);
  const customerNotes = (id: string) => notes.filter((n) => n.user_id === id);

  const addTag = async () => {
    if (!active || !tagDraft.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("customer_tags").insert({ user_id: active.id, tag: tagDraft.trim(), created_by: user?.id ?? null }).select().maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data) setTags((t) => [...t, data as TagRow]);
    setTagDraft("");
  };

  const removeTag = async (id: string) => {
    const { error } = await supabase.from("customer_tags").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTags((t) => t.filter((x) => x.id !== id));
  };

  const addNote = async () => {
    if (!active || !noteDraft.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("customer_notes").insert({ user_id: active.id, body: noteDraft.trim(), author_id: user?.id ?? null }).select().maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data) setNotes((n) => [data as NoteRow, ...n]);
    setNoteDraft("");
    toast.success("Note added");
  };

  const removeNote = async (id: string) => {
    const { error } = await supabase.from("customer_notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setNotes((n) => n.filter((x) => x.id !== id));
  };

  const exportCsv = () => {
    const head = ["Name", "Email", "Phone", "Orders", "LTV", "Last order", "Joined", "Tags"];
    const body = filtered.map((c) => [c.full_name, c.email, c.phone, c.order_count, c.lifetime_value, c.last_order_at || "", c.created_at, customerTags(c.id).map((t) => t.tag).join(" | ")]);
    const csv = [head, ...body].map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const emailSegment = () => {
    const list = filtered.map((c) => c.email).filter(Boolean).join(",");
    if (!list) return toast.error("No email addresses in this segment");
    window.location.href = `mailto:?bcc=${encodeURIComponent(list)}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2"><UsersIcon size={22} />Customers</h1>
            <p className="text-sm text-muted-foreground">{rows.length} total · LTV based on paid + pending orders</p>
          </div>
          <div className="flex gap-2">
            <button onClick={emailSegment} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted inline-flex items-center gap-1.5"><Mail size={14} />Email segment</button>
            <button onClick={exportCsv} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted inline-flex items-center gap-1.5"><Download size={14} />Export CSV</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SEGMENTS.map((s) => (
            <button key={s.key} onClick={() => setSegment(s.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${segment === s.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {s.label} <span className="opacity-60">{segmentCount(s.key)}</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Customer</th><th className="text-left px-4 py-3">Phone</th><th className="text-left px-4 py-3">Tags</th><th className="text-left px-4 py-3">Orders</th><th className="text-left px-4 py-3">LTV</th><th className="text-left px-4 py-3">Last order</th><th className="text-left px-4 py-3">Joined</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="animate-spin inline" /></td></tr> :
              filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No customers</td></tr> :
              filtered.map((c) => (
                <tr key={c.id} onClick={() => setActive(c)} className="border-t border-border hover:bg-muted/20 cursor-pointer">
                  <td className="px-4 py-3"><div className="font-semibold">{c.full_name || "—"}</div><div className="text-xs text-muted-foreground">{c.email}</div></td>
                  <td className="px-4 py-3 text-xs">{c.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {customerTags(c.id).slice(0, 3).map((t) => <span key={t.id} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{t.tag}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.order_count}</td>
                  <td className="px-4 py-3 font-semibold">₦{c.lifetime_value.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setActive(null)}>
          <aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md h-full bg-background border-l border-border overflow-y-auto p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">{active.full_name || "Customer"}</h2>
                <p className="text-xs text-muted-foreground">{active.email} {active.phone ? `· ${active.phone}` : ""}</p>
              </div>
              <button onClick={() => setActive(null)} className="p-1.5 rounded hover:bg-muted" aria-label="Close"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border p-3"><div className="text-lg font-bold">{active.order_count}</div><div className="text-[11px] text-muted-foreground">Orders</div></div>
              <div className="rounded-xl border border-border p-3"><div className="text-lg font-bold">₦{Math.round(active.lifetime_value).toLocaleString()}</div><div className="text-[11px] text-muted-foreground">LTV</div></div>
              <div className="rounded-xl border border-border p-3"><div className="text-lg font-bold">{active.order_count ? `₦${Math.round(active.lifetime_value / active.order_count).toLocaleString()}` : "—"}</div><div className="text-[11px] text-muted-foreground">Avg order</div></div>
            </div>

            <div>
              <h3 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-1.5"><TagIcon size={12} />Tags</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {customerTags(active.id).map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                    {t.tag}<button onClick={() => removeTag(t.id)} aria-label={`Remove ${t.tag}`}><X size={10} /></button>
                  </span>
                ))}
                {customerTags(active.id).length === 0 && <span className="text-xs text-muted-foreground">No tags yet</span>}
              </div>
              <div className="flex gap-2">
                <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="Add a tag…" className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
                <button onClick={addTag} disabled={busy} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-60">Add</button>
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase text-muted-foreground mb-2">Order history</h3>
              <div className="space-y-2">
                {customerOrders(active).slice(0, 20).map((o) => (
                  <div key={o.id} className="rounded-lg border border-border p-2.5 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{o.order_number || o.id.slice(0, 8)}</div>
                      <div className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · {o.status} · {o.payment_status}</div>
                    </div>
                    <div className="font-semibold">₦{Number(o.total || 0).toLocaleString()}</div>
                  </div>
                ))}
                {customerOrders(active).length === 0 && <p className="text-xs text-muted-foreground">No orders yet</p>}
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase text-muted-foreground mb-2">Internal notes</h3>
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3} placeholder="Call summary, preferences, follow-ups…" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={addNote} disabled={busy} className="mt-2 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">Add note</button>
              <div className="mt-3 space-y-2">
                {customerNotes(active.id).map((n) => (
                  <div key={n.id} className="rounded-lg border border-border p-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap">{n.body}</p>
                      <button onClick={() => removeNote(n.id)} className="text-destructive shrink-0" aria-label="Delete note"><Trash2 size={12} /></button>
                    </div>
                    <p className="text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomers;
