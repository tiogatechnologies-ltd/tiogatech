import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

const REPORTS: { table: string; title: string; description: string }[] = [
  { table: "leads", title: "Leads", description: "All captured leads with status, products, and budget." },
  { table: "orders", title: "Orders", description: "Order ledger with totals, payment and fulfilment status." },
  { table: "profiles", title: "Customers", description: "Registered customer profiles." },
  { table: "newsletter_subscribers", title: "Newsletter subscribers", description: "Email subscribers and subscription state." },
  { table: "affiliates", title: "Affiliates", description: "Active affiliate partners and codes." },
  { table: "finance_applications", title: "Finance applications", description: "Buy-now-pay-later applications and status." },
];

const AdminReports = () => {
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (table: string) => {
    setBusy(table);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error("Session expired — sign in again"); return; }
      const url = `https://yqeayhukgjtbptblvmhd.supabase.co/functions/v1/export-csv?table=${encodeURIComponent(table)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { toast.error(`Export failed (${res.status})`); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${table}-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success("Download started");
    } finally { setBusy(null); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><FileSpreadsheet size={22} />Reports</h1>
          <p className="text-sm text-muted-foreground">One-click CSV exports of operational data. Files are generated server-side and capped at 10,000 rows.</p>
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
