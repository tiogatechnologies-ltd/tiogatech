import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { ScrollText, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface Row {
  id: string;
  actor_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  diff: any;
  ip: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

const AdminAuditLog = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [entity, setEntity] = useState("all");
  const [actor, setActor] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      // Paginate past the PostgREST 1000-row cap so older activity is included.
      const all: Row[] = [];
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .range(i * 1000, i * 1000 + 999);
        const batch = (data || []) as unknown as Row[];
        all.push(...batch);
        if (batch.length < 1000) break;
      }
      setRows(all);
      setLoading(false);
    })();
  }, []);

  const entities = useMemo(() => Array.from(new Set(rows.map((r) => r.entity).filter(Boolean))).sort() as string[], [rows]);
  const actors = useMemo(() => Array.from(new Set(rows.map((r) => r.actor_email).filter(Boolean))).sort() as string[], [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (entity !== "all" && r.entity !== entity) return false;
    if (actor !== "all" && r.actor_email !== actor) return false;
    if (from && new Date(r.created_at) < new Date(from)) return false;
    if (to && new Date(r.created_at) > new Date(`${to}T23:59:59`)) return false;
    if (!filter) return true;
    const f = filter.toLowerCase();
    return r.action.toLowerCase().includes(f) || (r.actor_email || "").toLowerCase().includes(f) || (r.entity || "").toLowerCase().includes(f) || (r.entity_id || "").toLowerCase().includes(f);
  }), [rows, filter, entity, actor, from, to]);

  useEffect(() => { setPage(0); }, [filter, entity, actor, from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const exportCsv = () => {
    const head = ["When", "Actor", "Action", "Entity", "Entity ID", "IP", "Diff"];
    const body = filtered.map((r) => [new Date(r.created_at).toISOString(), r.actor_email, r.action, r.entity, r.entity_id, r.ip, JSON.stringify(r.diff ?? {})]);
    const csv = [head, ...body].map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFilter(""); setEntity("all"); setActor("all"); setFrom(""); setTo(""); };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2"><ScrollText size={22} /> Audit Log</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} of {rows.length} entries · track who changed what.</p>
          </div>
          <button onClick={exportCsv} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted inline-flex items-center gap-1.5"><Download size={14} />Export CSV</button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative min-w-[220px] flex-1">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search actor, action, entity, id…" className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
          </div>
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="all">All entities</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={actor} onChange={(e) => setActor(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm max-w-[220px]">
            <option value="all">All actors</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="From date" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="To date" />
          <button onClick={reset} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted">Reset</button>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-4 py-3">When</th><th className="text-left px-4 py-3">Who</th><th className="text-left px-4 py-3">Action</th><th className="text-left px-4 py-3">Entity</th><th className="text-left px-4 py-3">Details</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              shown.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No activity matches these filters</td></tr> :
              shown.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20 align-top">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.actor_email || "system"}</td>
                  <td className="px-4 py-3"><code className="text-xs px-1.5 py-0.5 rounded bg-muted">{r.action}</code></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}</td>
                  <td className="px-4 py-3"><details><summary className="cursor-pointer text-xs">View</summary><pre className="text-[10px] mt-2 p-2 bg-muted rounded max-w-xl overflow-x-auto">{JSON.stringify(r.diff, null, 2)}</pre></details></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page + 1} of {pageCount}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 inline-flex items-center gap-1"><ChevronLeft size={14} />Prev</button>
              <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 inline-flex items-center gap-1">Next<ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLog;
