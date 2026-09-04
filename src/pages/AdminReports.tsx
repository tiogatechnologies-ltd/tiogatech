import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileSpreadsheet, Loader2, CalendarRange } from "lucide-react";
import { toast } from "sonner";

const REPORTS: { table: string; title: string; description: string }[] = [
  { table: "leads", title: "Leads", description: "All captured leads with status, products, and budget." },
  { table: "orders", title: "Orders", description: "Order ledger with totals, payment and fulfilment status." },
  { table: "profiles", title: "Customers", description: "Registered customer profiles." },
  { table: "newsletter_subscribers", title: "Newsletter subscribers", description: "Email subscribers and subscription state." },
  { table: "affiliates", title: "Affiliates", description: "Active affiliate partners and codes." },
  { table: "finance_applications", title: "Finance applications", description: "Flexible payment applications and status." },
];

const PRESETS = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: 0 },
] as const;

const iso = (d: Date) => d.toISOString().slice(0, 10);

interface Summary { orders: number; revenue: number; leads: number; apps: number; subscribers: number; }

const AdminReports = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("30d");
  const [from, setFrom] = useState<string>(iso(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState<string>(iso(new Date()));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = PRESETS.find((x) => x.key === key);
    if (!p) return;
    setTo(iso(new Date()));
    setFrom(p.days ? iso(new Date(Date.now() - p.days * 86400000)) : "2020-01-01");
  };

  const range = useMemo(() => ({ gte: `${from}T00:00:00Z`, lte: `${to}T23:59:59Z` }), [from, to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSummary(true);
      const inRange = (q: any) => q.gte("created_at", range.gte).lte("created_at", range.lte);
      const [orders, leads, apps, subs] = await Promise.all([
        inRange(supabase.from("orders").select("total, payment_status")),
        inRange(supabase.from("leads").select("id", { count: "exact", head: true })),
        inRange(supabase.from("finance_applications").select("id", { count: "exact", head: true })),
        inRange(supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true })),
      ]);
      if (cancelled) return;
      const orderRows = (orders.data || []) as { total: number | null; payment_status: string | null }[];
      setSummary({
        orders: orderRows.length,
        revenue: orderRows.filter((o) => o.payment_status === "paid").reduce((s, o) => s + Number(o.total || 0), 0),
        leads: leads.count || 0,
        apps: apps.count || 0,
        subscribers: subs.count || 0,
      });
      setLoadingSummary(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const download = async (table: string) => {
    setBusy(table);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error("Session expired - sign in again"); return; }
      const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-csv`;
      const url = `${base}?table=${encodeURIComponent(table)}&from=${from}&to=${to}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { toast.error(`Export failed (${res.status})`); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${table}-${from}_to_${to}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success("Download started");
    } finally { setBusy(null); }
  };

  const kpis = [
    { label: "Orders", value: summary ? summary.orders.toLocaleString() : "-" },
    { label: "Paid revenue", value: summary ? `₦${summary.revenue.toLocaleString()}` : "-" },
    { label: "Leads", value: summary ? summary.leads.toLocaleString() : "-" },
    { label: "Finance applications", value: summary ? summary.apps.toLocaleString() : "-" },
    { label: "New subscribers", value: summary ? summary.subscribers.toLocaleString() : "-" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><FileSpreadsheet size={22} />Reports</h1>
          <p className="text-sm text-muted-foreground">Period summary plus CSV exports. Exports respect the selected date range and are capped at 10,000 rows.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange size={16} className="text-muted-foreground" />
            {PRESETS.map((p) => (
              <button key={p.key} onClick={() => applyPreset(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${preset === p.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>{p.label}</button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs" />
              <span className="text-xs text-muted-foreground">to</span>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border p-3">
                <p className="text-lg font-bold">{loadingSummary ? "…" : k.value}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {REPORTS.map((r) => (
            <div key={r.table} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
              </div>
              <button onClick={() => download(r.table)} disabled={busy === r.table}
                className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {busy === r.table ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
