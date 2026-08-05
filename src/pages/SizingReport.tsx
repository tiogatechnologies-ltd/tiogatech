import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { Loader2, Download, Share2, Sun } from "lucide-react";
import { downloadReportPdf, whatsappShareUrl } from "@/lib/reportPdf";
import { sizingToReport } from "@/lib/briefData";

const SizingReport = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke("sizing-report", { body: { token } });
      if (!error && (data as any)?.report) setRow((data as any).report);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!row) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center px-4 pt-28">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold">Report not found</h1>
            <p className="text-sm text-muted-foreground mt-2">This report link is invalid or has expired.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const report = sizingToReport(row);
  const share = whatsappShareUrl(
    `My Tioga solar sizing: ${(Number(row.daily_energy_wh || 0) / 1000).toFixed(2)} kWh/day, ${Math.round(Number(row.recommended_panel_w || row.solar_panel_w || 0))}W panels, ${Number(row.battery_kwh || 0).toFixed(2)}kWh battery. View: ${window.location.href}`,
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Your Solar Sizing Report — Tioga Technologies" description="Your saved solar system sizing summary from Tioga Technologies." path={`/sizing/${token}`} />
      <SiteHeader />
      <main className="flex-1 pt-24 sm:pt-28 pb-12 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider mb-1"><Sun size={14} /> Solar Sizing Report</div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold">{row.full_name || "Your"} solar system</h1>
              <p className="text-sm text-muted-foreground">{row.location || "Nigeria"} · {new Date(row.created_at).toLocaleDateString()} · Ref {report.reference}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => downloadReportPdf(report, `tioga-sizing-${report.reference}.pdf`)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Download size={16} /> PDF</button>
              <a href={share} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold"><Share2 size={16} /> Share</a>
            </div>
          </div>

          <Card title="Energy summary" rows={report.summary} />
          <Card title="Recommended system" rows={report.system} />

          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
            <h2 className="font-display font-bold text-lg mb-3">Appliance load profile</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                  <tr><th className="text-left py-2">Appliance</th><th>Qty</th><th>Watts</th><th>Hrs/day</th><th className="text-right">Daily Wh</th></tr>
                </thead>
                <tbody>
                  {report.appliances.map((a: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2">{a.name || "Appliance"}</td>
                      <td className="text-center">{a.qty ?? 1}</td>
                      <td className="text-center">{a.watts}</td>
                      <td className="text-center">{a.hours}</td>
                      <td className="text-right font-medium">{Number(a.wh ?? (a.watts || 0) * (a.qty || 1) * (a.hours || 0)).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

const Card = ({ title, rows }: { title: string; rows: { label: string; value: string }[] }) => (
  <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
    <h2 className="font-display font-bold text-lg mb-3">{title}</h2>
    <div className="grid sm:grid-cols-2 gap-3">
      {rows.map((r) => (
        <div key={r.label} className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.label}</div>
          <div className="text-sm font-medium">{r.value}</div>
        </div>
      ))}
    </div>
  </div>
);

export default SizingReport;
