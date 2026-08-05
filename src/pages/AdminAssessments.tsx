import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import BriefWorkflow from "@/components/admin/BriefWorkflow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, X, Save, Download, Wrench } from "lucide-react";
import { downloadReportPdf } from "@/lib/reportPdf";
import { assessmentToReport, stageClass, stageLabel } from "@/lib/briefData";


const AdminAssessments = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("tier") || "all";
  const setFilter = (f: string) => {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("tier"); else next.set("tier", f);
    setSearchParams(next, { replace: true });
  };
  const [selected, setSelected] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("solar_assessments" as any).select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const openDrawer = (a: any) => {
    setSelected(a);
    setNotes(a.engineer_notes || "");
    setStatus(a.status);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await (supabase.from("solar_assessments" as any).update({ engineer_notes: notes, status }).eq("id", selected.id) as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setSelected(null);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-display font-bold">Solar Assessments</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="basic">Basic only</option>
            <option value="full">Full unlocked</option>
            <option value="reviewed">Engineer reviewed</option>
            <option value="quoted">Quoted</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading ? <Loader2 className="animate-spin" /> : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3 text-left">Customer</th><th className="text-left">System</th><th className="text-left">Location</th><th className="text-left">Status</th><th className="text-left">Date</th><th /></tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </td>
                    <td>{a.recommendation?.inverter_kva}kVA / {a.recommendation?.battery_kwh}kWh</td>
                    <td>{a.location}</td>
                    <td><span className={`text-xs px-2 py-1 rounded ${a.status === "full" ? "bg-primary/20 text-primary" : a.status === "reviewed" ? "bg-green-100 text-green-700" : "bg-muted"}`}>{a.status}</span></td>
                    <td className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td><button onClick={() => openDrawer(a)} className="p-2 text-primary"><Eye size={16} /></button></td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No assessments</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl bg-background h-full overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-3">
              <div>
                <h2 className="font-display font-bold text-xl">{selected.full_name}</h2>
                <p className="text-sm text-muted-foreground">{selected.email} • {selected.phone}</p>
                <p className="text-xs text-muted-foreground">Ref AS-{String(selected.id).slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => downloadReportPdf(assessmentToReport(selected), `tioga-assessment-${String(selected.id).slice(0, 8).toUpperCase()}.pdf`)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"><Download size={14} /> Customer PDF</button>
              <button onClick={() => downloadReportPdf(assessmentToReport(selected, { internal: true }), `tioga-brief-${String(selected.id).slice(0, 8).toUpperCase()}.pdf`)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Wrench size={14} /> Engineering PDF</button>
            </div>


            <div className="grid grid-cols-2 gap-2 text-xs">
              <Info label="Location" value={selected.location} />
              <Info label="Building" value={selected.building_type} />
              <Info label="Occupants" value={selected.occupants} />
              <Info label="Daily kWh" value={selected.daily_kwh} />
              <Info label="Peak load" value={`${selected.peak_load_w} W`} />
              <Info label="Monthly bill" value={selected.monthly_bill_ngn ? `₦${selected.monthly_bill_ngn}` : "—"} />
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-1">Recommended system</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Inverter" value={selected.recommendation?.inverter_kva ? `${selected.recommendation.inverter_kva} kVA` : "—"} />
                <Info label="Battery" value={selected.recommendation?.battery_kwh ? `${selected.recommendation.battery_kwh} kWh` : "—"} />
                <Info label="Panels" value={selected.recommendation ? `${selected.recommendation.panel_count} × ${selected.recommendation.panel_w} W` : "—"} />
                <Info label="Backup" value={selected.recommendation?.backup_hours ? `${selected.recommendation.backup_hours} h` : "—"} />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-1">Appliances</h3>
              <div className="rounded-xl border border-border divide-y divide-border text-xs">
                {Array.isArray(selected.appliances) && selected.appliances.length > 0 ? selected.appliances.map((a: any, i: number) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                    <span>{a.name || "Appliance"} <span className="text-muted-foreground">· qty {a.qty ?? 1} · {a.watts}W · {a.hours ?? 0}h</span></span>
                    <span className="font-semibold">{Math.round((Number(a.watts) || 0) * (Number(a.qty) || 1) * (Number(a.hours) || 0))} Wh</span>
                  </div>
                )) : <div className="px-3 py-2 text-muted-foreground">No appliances recorded.</div>}
              </div>
            </div>

            {selected.full_report && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold">Full engineering report (raw)</summary>
                <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto max-h-96 mt-2">{JSON.stringify(selected.full_report, null, 2)}</pre>
              </details>
            )}


            <div className="space-y-2">
              <label className="text-sm font-semibold">Engineer notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
              <label className="text-sm font-semibold">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                {["basic", "full", "reviewed", "quoted", "closed"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Save size={14} /> {saving ? "Saving..." : "Save"}</button>
            </div>

            <BriefWorkflow entityType="assessment" row={selected} onSaved={(patch) => { setSelected((s: any) => ({ ...s, ...patch })); setItems((its) => its.map((i) => (i.id === selected.id ? { ...i, ...patch } : i))); }} />

          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const Info = ({ label, value }: { label: string; value: any }) => (
  <div className="rounded-lg bg-muted/40 px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="font-medium">{value ?? "—"}</div>
  </div>
);

export default AdminAssessments;
