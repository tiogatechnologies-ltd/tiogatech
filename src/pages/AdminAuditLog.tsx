import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { ScrollText, Filter } from "lucide-react";

interface Row { id: string; actor_email: string | null; action: string; entity: string | null; entity_id: string | null; diff: any; created_at: string; }

const AdminAuditLog = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500);
      setRows((data || []) as any); setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => !filter || r.action.includes(filter) || (r.actor_email || "").includes(filter) || (r.entity || "").includes(filter));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="font-display text-2xl font-bold flex items-center gap-2"><ScrollText size={22} /> Audit Log</h1><p className="text-sm text-muted-foreground">Track who changed what in your admin.</p></div>
          <div className="relative"><Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by actor, action, entity…" className="rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm w-72" /></div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-4 py-3">When</th><th className="text-left px-4 py-3">Who</th><th className="text-left px-4 py-3">Action</th><th className="text-left px-4 py-3">Entity</th><th className="text-left px-4 py-3">Details</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No activity yet</td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
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
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLog;
