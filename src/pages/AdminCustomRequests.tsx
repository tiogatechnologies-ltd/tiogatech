import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, Mail, Phone, MessageCircle, X, Download, Wrench } from "lucide-react";

interface RequestRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  requirements: string | null;
  status: string;
  admin_notes: string | null;
  assessment_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
}

const STATUSES = ["new", "contacted", "quoted", "won", "lost"];

const statusStyle: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-amber-500/10 text-amber-600",
  quoted: "bg-blue-500/10 text-blue-600",
  won: "bg-emerald-500/10 text-emerald-600",
  lost: "bg-destructive/10 text-destructive",
};

const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "").replace(/^0/, "234")}`;

const AdminCustomRequests = () => {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [active, setActive] = useState<RequestRow | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_solution_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setItems((data || []) as RequestRow[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const updateRow = async (id: string, patch: Partial<RequestRow>) => {
    const { error } = await supabase.from("custom_solution_requests").update(patch as any).eq("id", id);
    if (error) { toast.error(error.message); return false; }
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } as RequestRow : r)));
    return true;
  };

  const saveNotes = async () => {
    if (!active) return;
    setSaving(true);
    const ok = await updateRow(active.id, { admin_notes: notes });
    setSaving(false);
    if (ok) { toast.success("Notes saved"); setActive({ ...active, admin_notes: notes }); }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    STATUSES.forEach((s) => { c[s] = items.filter((r) => r.status === s).length; });
    return c;
  }, [items]);

  const filtered = useMemo(() => items.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!q) return true;
    const hay = `${r.full_name} ${r.email} ${r.phone} ${r.location} ${r.requirements}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [items, q, status]);

  const exportCsv = () => {
    const head = ["Name", "Email", "Phone", "Location", "Status", "Requirements", "Created"];
    const rows = filtered.map((r) => [r.full_name, r.email, r.phone, r.location, r.status, (r.requirements || "").replace(/\s+/g, " "), new Date(r.created_at).toISOString()]);
    const csv = [head, ...rows].map((line) => line.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `custom-requests-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const open = (r: RequestRow) => { setActive(r); setNotes(r.admin_notes || ""); };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2"><Wrench size={22} />Custom Solution Requests</h1>
            <p className="text-sm text-muted-foreground">{items.length} total · click a row to review and respond</p>
          </div>
          <button onClick={exportCsv} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted inline-flex items-center gap-1.5"><Download size={14} />Export CSV</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize ${status === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {s} <span className="opacity-60">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, requirements…" className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>

        {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div> : (
          <div className="bg-card rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Requirements</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => open(r)} className="border-t border-border hover:bg-muted/20 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.full_name || "-"}</div>
                      <div className="text-xs text-muted-foreground">{r.email} {r.phone ? `• ${r.phone}` : ""}</div>
                    </td>
                    <td className="px-4 py-3">{r.location || "-"}</td>
                    <td className="px-4 py-3 max-w-xs"><div className="text-xs text-muted-foreground line-clamp-2">{r.requirements}</div></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle[r.status] || "bg-muted"}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">No custom requests</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setActive(null)}>
          <aside onClick={(e) => e.stopPropagation()} className="w-full max-w-md h-full bg-background border-l border-border overflow-y-auto p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">{active.full_name || "Custom request"}</h2>
                <p className="text-xs text-muted-foreground">Submitted {new Date(active.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setActive(null)} className="p-1.5 rounded hover:bg-muted" aria-label="Close"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {active.email && <a href={`mailto:${active.email}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted"><Mail size={14} />Email</a>}
              {active.phone && <a href={`tel:${active.phone}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted"><Phone size={14} />Call</a>}
              {active.phone && <a href={waLink(active.phone)} target="_blank" rel="noopener noreferrer" className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm font-medium hover:bg-emerald-500/20"><MessageCircle size={14} />WhatsApp</a>}
            </div>

            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs uppercase text-muted-foreground">Email</dt><dd>{active.email || "-"}</dd></div>
              <div><dt className="text-xs uppercase text-muted-foreground">Phone</dt><dd>{active.phone || "-"}</dd></div>
              <div><dt className="text-xs uppercase text-muted-foreground">Location</dt><dd>{active.location || "-"}</dd></div>
              <div><dt className="text-xs uppercase text-muted-foreground">Requirements</dt><dd className="whitespace-pre-wrap">{active.requirements || "-"}</dd></div>
              {active.assessment_id && (
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Linked assessment</dt>
                  <dd><a className="text-primary underline" href={`/solar-assessment/${active.assessment_id}/full`} target="_blank" rel="noopener noreferrer">Open report</a></dd>
                </div>
              )}
            </dl>

            <div>
              <label className="text-xs uppercase text-muted-foreground">Status</label>
              <select
                value={active.status}
                onChange={async (e) => {
                  const v = e.target.value;
                  const ok = await updateRow(active.id, { status: v });
                  if (ok) { setActive({ ...active, status: v }); toast.success("Status updated"); }
                }}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase text-muted-foreground">Internal notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Quote sent, site visit booked, blockers…" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <button onClick={saveNotes} disabled={saving} className="mt-2 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
                {saving ? "Saving…" : "Save notes"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomRequests;
