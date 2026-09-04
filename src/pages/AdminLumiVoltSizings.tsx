import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import BriefWorkflow from "@/components/admin/BriefWorkflow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sun, Loader2, Mail, Phone, MapPin, Calendar, X, Download, Search, Wrench, Save, Link2 } from "lucide-react";
import { downloadReportPdf } from "@/lib/reportPdf";
import { sizingToReport, PIPELINE_STAGES, stageClass, stageLabel, effective } from "@/lib/briefData";

const REVISABLE: { key: string; label: string; unit: string }[] = [
  { key: "solar_panel_w", label: "Solar array (energy match)", unit: "W" },
  { key: "recommended_panel_w", label: "Solar array (recommended)", unit: "W" },
  { key: "inverter_w", label: "Inverter", unit: "W" },
  { key: "battery_ah", label: "Battery bank", unit: "Ah" },
  { key: "battery_kwh", label: "Battery capacity", unit: "kWh" },
  { key: "charge_controller_a", label: "Charge controller", unit: "A" },
];

const AdminLumiVoltSizings = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [revised, setRevised] = useState<Record<string, string>>({});
  const [savingRev, setSavingRev] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lumivolt_sizings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setRows(data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!open) return;
    const r = (open.revised || {}) as Record<string, any>;
    setRevised(Object.fromEntries(REVISABLE.map((f) => [f.key, r[f.key] !== undefined && r[f.key] !== null ? String(r[f.key]) : ""])));
  }, [open?.id]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (stageFilter !== "all" && (r.pipeline_status || "new") !== stageFilter) return false;
      if (!term) return true;
      return [r.full_name, r.email, r.phone, r.location].some((v) => String(v || "").toLowerCase().includes(term));
    });
  }, [rows, q, stageFilter]);

  const patchRow = (id: string, patch: Record<string, any>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setOpen((o: any) => (o && o.id === id ? { ...o, ...patch } : o));
  };

  const saveRevision = async () => {
    if (!open) return;
    setSavingRev(true);
    const payload: Record<string, number> = {};
    for (const f of REVISABLE) {
      const v = revised[f.key];
      if (v !== "" && v !== undefined && !isNaN(Number(v))) payload[f.key] = Number(v);
    }
    const next = Object.keys(payload).length ? payload : null;
    const { error } = await (supabase.from("lumivolt_sizings" as any).update({ revised: next }).eq("id", open.id) as any);
    setSavingRev(false);
    if (error) return toast.error(error.message);
    patchRow(open.id, { revised: next });
    toast.success("Engineering revision saved");
  };

  const exportBrief = (row: any) => {
    const data = sizingToReport(row, { internal: true });
    downloadReportPdf(data, `tioga-brief-${data.reference}.pdf`);
  };

  const exportCustomer = (row: any) => {
    const data = sizingToReport(row);
    downloadReportPdf(data, `tioga-sizing-${data.reference}.pdf`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sun className="text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">LumiVolt Sizings</h1>
              <p className="text-sm text-muted-foreground">Calculator submissions - sales and engineering briefs</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, location" className="rounded-xl border border-border bg-background pl-8 pr-3 py-2 text-sm w-56" />
            </div>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option value="all">All stages</option>
              {PIPELINE_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" size={18} /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No sizings match your filters.</div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Load</th>
                    <th className="px-4 py-3">Daily kWh</th>
                    <th className="px-4 py-3">Solar (W)</th>
                    <th className="px-4 py-3">Battery</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.full_name || "Guest"}</td>
                      <td className="px-4 py-3 text-xs">
                        <div>{r.email || "-"}</div>
                        <div className="text-muted-foreground">{r.phone || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{r.location || "-"}</td>
                      <td className="px-4 py-3">{Math.round(r.total_load_w).toLocaleString()} W</td>
                      <td className="px-4 py-3">{(r.daily_energy_wh / 1000).toFixed(2)}</td>
                      <td className="px-4 py-3">{effective(r, "solar_panel_w") ? Math.round(Number(effective(r, "solar_panel_w"))).toLocaleString() : "-"}</td>
                      <td className="px-4 py-3">{effective(r, "battery_kwh") ? `${Number(effective(r, "battery_kwh")).toFixed(2)} kWh` : "-"}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-1 rounded-full border ${stageClass(r.pipeline_status)}`}>{stageLabel(r.pipeline_status)}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setOpen(r)} className="text-primary text-xs font-semibold hover:underline">Open brief</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-card rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h3 className="font-display font-bold text-lg">{open.full_name || "Guest"} - sizing brief</h3>
                <p className="text-xs text-muted-foreground">Ref SZ-{String(open.id).slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportCustomer(open)} className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"><Download size={14} /> Customer PDF</button>
                <button onClick={() => exportBrief(open)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Wrench size={14} /> Engineering PDF</button>
                <button onClick={() => setOpen(null)}><X size={18} /></button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={<Calendar size={14} />} label="Submitted" value={new Date(open.created_at).toLocaleString()} />
                <Info icon={<MapPin size={14} />} label="Location" value={open.location || "-"} />
                <Info icon={<Mail size={14} />} label="Email" value={open.email || "-"} />
                <Info icon={<Phone size={14} />} label="Phone" value={open.phone || "-"} />
              </div>

              {open.share_token && (
                <a href={`/sizing/${open.share_token}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Link2 size={13} /> Customer report link
                </a>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Load" value={`${Math.round(open.total_load_w)} W`} />
                <Stat label="Daily" value={`${(open.daily_energy_wh / 1000).toFixed(2)} kWh`} />
                <Stat label="Autonomy" value={`${open.days_autonomy} day(s)`} />
                <Stat label="Sunlight" value={`${open.sunlight_hours} h`} />
                <Stat label="Solar panel" value={`${effective(open, "solar_panel_w") ? Math.round(Number(effective(open, "solar_panel_w"))) : "-"} W`} />
                <Stat label="Recommended" value={`${effective(open, "recommended_panel_w") ? Math.round(Number(effective(open, "recommended_panel_w"))) : "-"} W`} />
                <Stat label="Inverter" value={`${effective(open, "inverter_w") ? Math.round(Number(effective(open, "inverter_w"))) : "-"} W`} />
                <Stat label="Battery" value={`${effective(open, "battery_ah") ? Number(effective(open, "battery_ah")).toFixed(0) : "-"} Ah @ ${open.battery_voltage}V`} />
                <Stat label="Battery kWh" value={`${effective(open, "battery_kwh") ? Number(effective(open, "battery_kwh")).toFixed(2) : "-"}`} />
                <Stat label="Battery type" value={open.battery_type} />
                <Stat label="Controller" value={`${effective(open, "charge_controller_a") ? Number(effective(open, "charge_controller_a")).toFixed(1) : "-"} A`} />
                <Stat label="Source" value={open.source || "-"} />
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Appliances</h4>
                <div className="rounded-xl border border-border divide-y divide-border text-sm">
                  {Array.isArray(open.appliances) && open.appliances.length > 0 ? open.appliances.map((a: any, i: number) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between">
                      <span>{a.name || "Appliance"} <span className="text-muted-foreground text-xs">· qty {a.qty} · {a.watts}W · {a.hours}h</span></span>
                      <span className="font-semibold">{Number(a.wh ?? a.watts * a.qty * a.hours).toFixed(0)} Wh</span>
                    </div>
                  )) : <div className="px-3 py-2 text-muted-foreground">No appliances recorded.</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm">Engineer revision</h4>
                  {open.revised && <span className="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Revised</span>}
                </div>
                <p className="text-xs text-muted-foreground">Leave blank to keep the system recommendation. Revised values are used on all exports.</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {REVISABLE.map((f) => (
                    <label key={f.key} className="block">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.label} ({f.unit})</span>
                      <input
                        type="number"
                        value={revised[f.key] ?? ""}
                        placeholder={open[f.key] !== null && open[f.key] !== undefined ? String(Math.round(Number(open[f.key]) * 100) / 100) : "-"}
                        onChange={(e) => setRevised((r) => ({ ...r, [f.key]: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      />
                    </label>
                  ))}
                </div>
                <button onClick={saveRevision} disabled={savingRev} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold disabled:opacity-60">
                  {savingRev ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save revision
                </button>
              </div>

              <BriefWorkflow entityType="sizing" row={open} onSaved={(patch) => patchRow(open.id, patch)} />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground mt-0.5">{icon}</span>
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground break-all">{value}</p>
    </div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-muted/40 p-3">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="font-bold text-foreground text-sm mt-0.5">{value}</p>
  </div>
);

export default AdminLumiVoltSizings;
