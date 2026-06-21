import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Sun, Loader2, Mail, Phone, MapPin, Calendar, X } from "lucide-react";

type Sizing = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  appliances: any;
  total_load_w: number;
  daily_energy_wh: number;
  days_autonomy: number;
  battery_voltage: number;
  battery_type: string;
  sunlight_hours: number;
  solar_panel_w: number | null;
  recommended_panel_w: number | null;
  inverter_w: number | null;
  battery_ah: number | null;
  battery_kwh: number | null;
  charge_controller_a: number | null;
  source: string | null;
  created_at: string;
};

const AdminLumiVoltSizings = () => {
  const [rows, setRows] = useState<Sizing[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Sizing | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("lumivolt_sizings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setRows(data as any);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sun className="text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">LumiVolt Sizings</h1>
            <p className="text-sm text-muted-foreground">Calculator submissions from the LumiVolt page</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" size={18} /> Loading...</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No sizings yet.</div>
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
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.full_name || "Guest"}</td>
                      <td className="px-4 py-3 text-xs">
                        <div>{r.email || "—"}</div>
                        <div className="text-muted-foreground">{r.phone || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{r.location || "—"}</td>
                      <td className="px-4 py-3">{Math.round(r.total_load_w).toLocaleString()} W</td>
                      <td className="px-4 py-3">{(r.daily_energy_wh / 1000).toFixed(2)}</td>
                      <td className="px-4 py-3">{r.solar_panel_w ? Math.round(r.solar_panel_w).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3">{r.battery_kwh ? `${r.battery_kwh.toFixed(2)} kWh` : "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setOpen(r)} className="text-primary text-xs font-semibold hover:underline">View</button>
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
          <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
              <h3 className="font-display font-bold text-lg">Sizing Details</h3>
              <button onClick={() => setOpen(null)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={<Calendar size={14} />} label="Submitted" value={new Date(open.created_at).toLocaleString()} />
                <Info icon={<MapPin size={14} />} label="Location" value={open.location || "—"} />
                <Info icon={<Mail size={14} />} label="Email" value={open.email || "—"} />
                <Info icon={<Phone size={14} />} label="Phone" value={open.phone || "—"} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Load" value={`${Math.round(open.total_load_w)} W`} />
                <Stat label="Daily" value={`${(open.daily_energy_wh / 1000).toFixed(2)} kWh`} />
                <Stat label="Autonomy" value={`${open.days_autonomy} day(s)`} />
                <Stat label="Sunlight" value={`${open.sunlight_hours} h`} />
                <Stat label="Solar panel" value={`${open.solar_panel_w ? Math.round(open.solar_panel_w) : "—"} W`} />
                <Stat label="Recommended" value={`${open.recommended_panel_w ? Math.round(open.recommended_panel_w) : "—"} W`} />
                <Stat label="Inverter" value={`${open.inverter_w ? Math.round(open.inverter_w) : "—"} W`} />
                <Stat label="Battery" value={`${open.battery_ah ? open.battery_ah.toFixed(0) : "—"} Ah @ ${open.battery_voltage}V`} />
                <Stat label="Battery kWh" value={`${open.battery_kwh ? open.battery_kwh.toFixed(2) : "—"}`} />
                <Stat label="Battery type" value={open.battery_type} />
                <Stat label="Controller" value={`${open.charge_controller_a ? open.charge_controller_a.toFixed(1) : "—"} A`} />
                <Stat label="Source" value={open.source || "—"} />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Appliances</h4>
                <div className="rounded-xl border border-border divide-y divide-border text-sm">
                  {Array.isArray(open.appliances) && open.appliances.length > 0 ? open.appliances.map((a: any, i: number) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between">
                      <span>{a.name || "Appliance"} <span className="text-muted-foreground text-xs">· qty {a.qty} · {a.watts}W · {a.hours}h</span></span>
                      <span className="font-semibold">{(a.wh ?? a.watts * a.qty * a.hours).toFixed(0)} Wh</span>
                    </div>
                  )) : <div className="px-3 py-2 text-muted-foreground">No appliances recorded.</div>}
                </div>
              </div>
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
      <p className="font-medium text-foreground">{value}</p>
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
