import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { RefreshCw, Send, CheckCircle2, XCircle, Clock, Ban, Search } from "lucide-react";

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const RANGES = [
  { key: "24h", label: "Last 24h", hours: 24 },
  { key: "7d", label: "7 days", hours: 24 * 7 },
  { key: "30d", label: "30 days", hours: 24 * 30 },
] as const;

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  dlq: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
  bounced: "bg-destructive/10 text-destructive",
  complained: "bg-destructive/10 text-destructive",
  suppressed: "bg-muted text-muted-foreground",
};

const AdminEmailStatus = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("7d");
  const [template, setTemplate] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const hours = RANGES.find((r) => r.key === range)!.hours;
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data, error } = await supabase
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) toast.error(error.message);
    setRows((data as LogRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); setPage(0); /* eslint-disable-next-line */ }, [range]);

  // Deduplicate: latest row per message_id (rows without message_id stay as-is)
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    const out: LogRow[] = [];
    for (const r of rows) {
      if (r.message_id) {
        if (seen.has(r.message_id)) continue;
        seen.add(r.message_id);
      }
      out.push(r);
    }
    return out;
  }, [rows]);

  const templates = useMemo(
    () => Array.from(new Set(deduped.map((r) => r.template_name))).sort(),
    [deduped],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deduped.filter(
      (r) =>
        (template === "all" || r.template_name === template) &&
        (status === "all" || r.status === status) &&
        (!q || r.recipient_email.toLowerCase().includes(q)),
    );
  }, [deduped, template, status, search]);

  const stats = useMemo(() => {
    const base = deduped.filter((r) => template === "all" || r.template_name === template);
    const count = (s: string[]) => base.filter((r) => s.includes(r.status)).length;
    return {
      total: base.length,
      sent: count(["sent"]),
      pending: count(["pending"]),
      failed: count(["dlq", "failed", "bounced", "complained"]),
      suppressed: count(["suppressed"]),
    };
  }, [deduped, template]);

  const pageSize = 50;
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const sendTest = async () => {
    const to = testEmail.trim();
    if (!to.includes("@")) return toast.error("Enter a valid email address");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "test-email",
          recipientEmail: to,
          idempotencyKey: `delivery-test-${Date.now()}`,
          templateData: { note: `Test triggered from the admin panel on ${new Date().toLocaleString()}.` },
        },
      });
      if (error) throw error;
      if ((data as any)?.success === false) {
        toast.warning(`Not sent: ${(data as any).reason}`);
      } else {
        toast.success("Test email queued — refresh in a few seconds to see the result");
      }
      setTimeout(load, 4000);
    } catch (e: any) {
      toast.error(e?.message || "Failed to queue test email");
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    "rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">Email delivery status</h1>
            <p className="text-xs text-muted-foreground">Queued, sent and failed emails with failure reasons.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:border-primary/40">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: null },
            { label: "Sent", value: stats.sent, icon: CheckCircle2 },
            { label: "Pending", value: stats.pending, icon: Clock },
            { label: "Failed", value: stats.failed, icon: XCircle },
            { label: "Suppressed", value: stats.suppressed, icon: Ban },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Test send */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold text-card-foreground">Send a delivery test</p>
          <p className="text-xs text-muted-foreground">Verifies that notify.tiogatechnologies.com delivers successfully.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className={`${inputClass} flex-1`} placeholder="you@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
            <button onClick={sendTest} disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">
              <Send size={14} /> {sending ? "Queuing..." : "Send test"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 p-1 bg-muted rounded-xl text-xs">
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)} className={`px-3 py-1.5 rounded-lg font-medium ${range === r.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>{r.label}</button>
            ))}
          </div>
          <select className={inputClass} value={template} onChange={(e) => { setTemplate(e.target.value); setPage(0); }}>
            <option value="all">All templates</option>
            {templates.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="all">All statuses</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="dlq">Failed (dlq)</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
            <option value="suppressed">Suppressed</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className={`${inputClass} pl-9`} placeholder="Search recipient..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Template</th>
                <th className="text-left px-4 py-3 font-medium">Recipient</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Failure reason</th>
                <th className="text-left px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No emails in this range.</td></tr>
              ) : pageRows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-card-foreground">{r.template_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.recipient_email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_STYLES[r.status] || "bg-muted text-muted-foreground"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-destructive max-w-[280px] truncate" title={r.error_message || ""}>{r.error_message || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {page + 1} of {pages} · {filtered.length} emails</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40">Previous</button>
              <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEmailStatus;
