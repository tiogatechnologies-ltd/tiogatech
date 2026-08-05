import { useMemo, useState } from "react";
import { Plus, Trash2, HelpCircle, Save, Sun, Plug, BatteryCharging, Cpu, Calculator, Printer, ArrowLeft, Eye, EyeOff, CheckCircle2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { applianceDatabase } from "@/data/applianceWatts";
import { downloadReportPdf, whatsappShareUrl } from "@/lib/reportPdf";
import { sizingToReport } from "@/lib/briefData";


type Row = { id: string; name: string; qty: number; watts: number; hours: number };

const BATTERY_TYPES = [
  { value: "lithium", label: "Lithium-ion (90% DoD)", dod: 0.9 },
  { value: "tubular", label: "Tubular / Gel (50% DoD)", dod: 0.5 },
  { value: "lead_acid", label: "Lead-acid (80% DoD)", dod: 0.8 },
];

const VOLTAGES = [12, 24, 48];

const newRow = (name = ""): Row => ({ id: crypto.randomUUID(), name, qty: 1, watts: 0, hours: 0 });

function Tip({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Help: ${title}`} className="text-primary hover:text-primary/80">
        <HelpCircle size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="rounded-2xl bg-card p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-display font-bold text-lg mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{body}</p>
            <div className="text-right mt-4">
              <button onClick={() => setOpen(false)} className="text-primary font-semibold">Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const LumiVoltSizer = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([newRow("Television")]);
  const [days, setDays] = useState(1);
  const [voltage, setVoltage] = useState(48);
  const [batteryType, setBatteryType] = useState("lithium");
  const [sun, setSun] = useState(5);
  const [showResults, setShowResults] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [contact, setContact] = useState({ full_name: "", email: "", phone: "", location: "" });


  const dod = useMemo(() => BATTERY_TYPES.find((b) => b.value === batteryType)?.dod ?? 0.9, [batteryType]);

  const computed = useMemo(() => {
    const valid = rows.filter((r) => r.watts > 0 && r.qty > 0);
    const totalLoad = valid.reduce((s, r) => s + r.watts * r.qty, 0);
    const dailyWh = valid.reduce((s, r) => s + r.watts * r.qty * r.hours, 0);
    const losses = 1.2; // 20% system losses
    const solarPanelW = (dailyWh * losses) / Math.max(sun, 1);
    const batteryWh = (dailyWh * days) / Math.max(dod, 0.1);
    const batteryAh = batteryWh / Math.max(voltage, 1);
    const recommendedPanelW = (batteryWh / Math.max(sun, 1)) * losses;
    const inverterW = totalLoad * 2; // safety factor
    const chargeCtrlA = solarPanelW / Math.max(voltage, 1);
    const breakdown = valid.map((r) => ({ ...r, wh: r.watts * r.qty * r.hours }));
    return { totalLoad, dailyWh, batteryWh, batteryAh, solarPanelW, recommendedPanelW, inverterW, chargeCtrlA, breakdown };
  }, [rows, days, voltage, dod, sun]);

  const updateRow = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const canContinue = computed.dailyWh > 0;

  const reportData = useMemo(() => sizingToReport({
    id: savedId || "draft-0000",
    full_name: user?.user_metadata?.full_name || contact.full_name,
    email: user?.email || contact.email,
    phone: contact.phone,
    location: contact.location,
    appliances: computed.breakdown,
    total_load_w: computed.totalLoad,
    daily_energy_wh: computed.dailyWh,
    days_autonomy: days,
    battery_voltage: voltage,
    battery_type: BATTERY_TYPES.find((b) => b.value === batteryType)?.label || batteryType,
    battery_dod: dod,
    sunlight_hours: sun,
    solar_panel_w: computed.solarPanelW,
    recommended_panel_w: computed.recommendedPanelW,
    inverter_w: computed.inverterW,
    battery_ah: computed.batteryAh,
    battery_kwh: computed.batteryWh / 1000,
    charge_controller_a: computed.chargeCtrlA,
    created_at: new Date().toISOString(),
  }), [savedId, user, contact, computed, days, voltage, batteryType, dod, sun]);

  const downloadPdf = () => downloadReportPdf(reportData, `tioga-solar-sizing-${reportData.reference}.pdf`);

  const shareWhatsApp = () => {
    const link = shareToken ? `${window.location.origin}/sizing/${shareToken}` : "";
    const msg = `My Tioga solar sizing: ${(computed.dailyWh / 1000).toFixed(2)} kWh/day, ${Math.round(computed.recommendedPanelW).toLocaleString()}W panels, ${(computed.batteryWh / 1000).toFixed(2)}kWh battery, ${Math.round(computed.inverterW).toLocaleString()}W inverter.${link ? ` View the full report: ${link}` : ""}`;
    window.open(whatsappShareUrl(msg), "_blank");
  };

  const save = async () => {
    if (!canContinue) {
      toast.error("Add at least one appliance with watts and hours");
      return;
    }
    if (!user && (!contact.full_name || !contact.email)) {
      toast.error("Please enter your name and email to save");
      return;
    }
    setSaving(true);
    const token = crypto.randomUUID().replace(/-/g, "");
    const { data: inserted, error } = await supabase.from("lumivolt_sizings").insert({
      user_id: user?.id ?? null,
      full_name: user?.user_metadata?.full_name || contact.full_name || null,
      email: user?.email || contact.email || null,
      phone: contact.phone || null,
      location: contact.location || null,
      appliances: computed.breakdown,
      total_load_w: computed.totalLoad,
      daily_energy_wh: computed.dailyWh,
      days_autonomy: days,
      battery_voltage: voltage,
      battery_type: batteryType,
      battery_dod: dod,
      sunlight_hours: sun,
      solar_panel_w: computed.solarPanelW,
      recommended_panel_w: computed.recommendedPanelW,
      inverter_w: computed.inverterW,
      battery_ah: computed.batteryAh,
      battery_kwh: computed.batteryWh / 1000,
      charge_controller_a: computed.chargeCtrlA,
      share_token: token,
    } as any).select("id").maybeSingle();
    setSaving(false);
    if (error) {
      toast.error("Could not save: " + error.message);
      return;
    }
    setSavedId((inserted as any)?.id || null);
    setShareToken(token);
    // Fire-and-forget admin notification
    try {
      await supabase.functions.invoke("notify-new-lead", {
        body: {
          source: "lumivolt_sizer",
          full_name: contact.full_name || user?.user_metadata?.full_name || "Guest",
          email: contact.email || user?.email,
          phone: contact.phone,
          location: contact.location,
          summary: `Load ${Math.round(computed.totalLoad)}W · ${(computed.dailyWh / 1000).toFixed(1)}kWh/day · ${Math.round(computed.solarPanelW)}W panels · ${(computed.batteryWh / 1000).toFixed(1)}kWh battery`,
        },
      });
    } catch {}
    toast.success("Your sizing was saved. Our team will reach out.");
  };


  if (showResults) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button onClick={() => setShowResults(false)} className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={downloadPdf} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
              <Download size={14} /> Download PDF
            </button>
            <button onClick={shareWhatsApp} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary/40 transition-colors">
              <Share2 size={14} /> Share
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {shareToken && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <p className="font-semibold text-foreground mb-1">Your saved report link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate text-muted-foreground">{`${window.location.origin}/sizing/${shareToken}`}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sizing/${shareToken}`); toast.success("Link copied"); }}
                className="rounded-full border border-border bg-background px-2.5 py-1 font-semibold"
              >
                Copy
              </button>
            </div>
          </div>
        )}


        <div>
          <h3 className="text-2xl font-display font-bold text-foreground no-clip">Your Solar System Summary</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Days of Autonomy: {days} · Battery Voltage: {voltage} V · {BATTERY_TYPES.find((b) => b.value === batteryType)?.label}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-foreground">Appliance Breakdown:</h4>
          <button onClick={() => setShowBreakdown((s) => !s)} className="inline-flex items-center gap-1 text-sm text-primary font-semibold">
            {showBreakdown ? <EyeOff size={15} /> : <Eye size={15} />} {showBreakdown ? "Hide" : "Show"}
          </button>
        </div>

        {showBreakdown && (
          <div className="space-y-2">
            {computed.breakdown.map((b) => (
              <div key={b.id} className="rounded-2xl bg-primary/5 border border-primary/10 p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">{b.name || "Appliance"}</p>
                  <p className="text-xs text-muted-foreground">Qty: {b.qty} × {b.watts}W × {b.hours.toFixed(1)}h</p>
                </div>
                <p className="font-bold text-primary text-sm">{b.wh.toFixed(2)} Wh</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border" />

        <ResultCard color="green" icon={<Sun size={20} />} title="Solar Panel" value={`${Math.round(computed.solarPanelW).toLocaleString()} W`} note={`Based on total energy of ${computed.dailyWh.toFixed(2)} Wh (with 20% system losses).`} />
        <ResultCard color="teal" icon={<Sun size={20} />} title="Solar Panel (Recommended)" value={`${Math.round(computed.recommendedPanelW).toLocaleString()} W`} note={`Sized to fully recharge battery capacity of ${computed.batteryWh.toFixed(2)} Wh within available sunlight hours.`} />
        <ResultCard color="orange" icon={<Plug size={20} />} title="Inverter" value={`${Math.round(computed.inverterW).toLocaleString()} W`} note={`Handles total appliance load of ${Math.round(computed.totalLoad).toLocaleString()} W.`} />
        <ResultCard color="blue" icon={<BatteryCharging size={20} />} title="Battery Bank" value={`${computed.batteryAh.toFixed(2)} Ah  (${(computed.batteryWh / 1000).toFixed(2)} kWh)`} note={`Capacity calculated for ${days} day(s) autonomy at ${voltage}V using ${BATTERY_TYPES.find((b) => b.value === batteryType)?.label}.`} />
        <ResultCard color="purple" icon={<Cpu size={20} />} title="Charge Controller" value={`${computed.chargeCtrlA.toFixed(2)} A`} note={`Derived from ${Math.round(computed.solarPanelW).toLocaleString()} W solar panel and ${voltage} V battery system.`} />

        {!user && (
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Get a quote from our engineers</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Full name *" value={contact.full_name} onChange={(e) => setContact({ ...contact, full_name: e.target.value })} />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Email *" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Phone (WhatsApp)" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Location (city, state)" value={contact.location} onChange={(e) => setContact({ ...contact, location: e.target.value })} />
            </div>
          </div>
        )}

        <button
          disabled={saving}
          onClick={save}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20 disabled:opacity-60"
        >
          {saving ? "Saving..." : <><Save size={16} /> Save & Request Quote</>}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Please enter appliance details:</h3>
        <span className="text-xs text-muted-foreground">{rows.length} item{rows.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-3 space-y-2">
            <div className="flex items-start gap-2">
              <input
                value={r.name}
                onChange={(e) => updateRow(r.id, { name: e.target.value })}
                placeholder="Appliance Name (e.g. Fridge)"
                className="flex-1 bg-transparent border-b border-border focus:border-primary outline-none text-sm py-1.5 font-medium text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={() => removeRow(r.id)} className="text-destructive hover:text-destructive/80" aria-label="Remove">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Qty" value={r.qty} onChange={(v) => updateRow(r.id, { qty: v })} />
              <Field label="Watt (W)" value={r.watts} onChange={(v) => updateRow(r.id, { watts: v })} />
              <Field label="Hrs/Day" value={r.hours} onChange={(v) => updateRow(r.id, { hours: v })} step={0.5} />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setRows((rs) => [...rs, newRow()])}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 border border-primary/30 text-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary/20 transition-all"
      >
        <Plus size={16} /> Add Appliance
      </button>

      {/* Quick Add Common Appliance */}
      <div className="rounded-2xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={14} className="text-primary" />
          <p className="text-xs font-semibold text-foreground">Quick Add Common Appliance</p>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Tap any item below to add it with typical wattage.</p>
        <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
          {applianceDatabase.map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() =>
                setRows((rs) => [
                  ...rs,
                  { id: crypto.randomUUID(), name: a.name, qty: 1, watts: a.avgWatts, hours: 4 },
                ])
              }
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:border-primary/50 hover:bg-primary/5 transition-colors"
              title={`${a.avgWatts}W (typical)`}
            >
              <span>{a.icon}</span>
              <span className="font-medium text-foreground">{a.name}</span>
              <span className="text-muted-foreground">· {a.avgWatts}W</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        💡 Tip: Use the wattage on your appliance label for accurate sizing.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <NumField icon={<Calculator size={16} />} label="Days of Autonomy" value={days} onChange={setDays} step={1} tip={{ title: "Days of Autonomy", body: "How many days you want your battery to power your appliances when there is little or no sunlight.\n\nExample: Enter 2 if you want the system to keep running for 2 cloudy days without enough solar charging." }} />
        <SelectField icon={<BatteryCharging size={16} />} label="Battery Voltage (V)" value={voltage} onChange={setVoltage} options={VOLTAGES.map((v) => ({ value: v, label: `${v} V` }))} tip={{ title: "Battery Voltage", body: "The system voltage of your battery bank. Small systems use 12V, medium use 24V, and large systems use 48V for better efficiency." }} />
        <SelectField icon={<BatteryCharging size={16} />} label="Battery Type" value={batteryType} onChange={setBatteryType} options={BATTERY_TYPES.map((b) => ({ value: b.value, label: b.label }))} tip={{ title: "Battery Type", body: "This tells the calculator how much of the battery capacity should be treated as usable.\n\nExample: Lithium-ion uses 90% depth of discharge. Lead-acid uses 80%. Tubular/Gel uses 50%." }} />
        <NumField icon={<Sun size={16} />} label="Average Sunlight Hours per Day" value={sun} onChange={setSun} step={0.5} tip={{ title: "Average Sunlight Hours", body: "The average number of strong sunlight hours your solar panels receive in one day.\n\nExample: Enter 5 if your location gets about 5 good hours of sunlight daily." }} />
      </div>

      <button
        onClick={() => setShowResults(true)}
        disabled={!canContinue}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20 disabled:opacity-50"
      >
        <CheckCircle2 size={16} /> Continue to Summary
      </button>
    </div>
  );
};

const Field = ({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-wide text-muted-foreground block mb-1">{label}</span>
    <input
      type="number"
      min={0}
      step={step}
      value={value === 0 ? "" : value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
    />
  </label>
);

const NumField = ({ icon, label, value, onChange, step, tip }: { icon: React.ReactNode; label: string; value: number; onChange: (v: number) => void; step?: number; tip: { title: string; body: string } }) => (
  <div className="rounded-2xl border border-border bg-background p-3">
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">{icon} {label}</label>
      <Tip title={tip.title} body={tip.body} />
    </div>
    <input type="number" min={0} step={step ?? 1} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-base font-semibold focus:outline-none" />
  </div>
);

const SelectField = ({ icon, label, value, onChange, options, tip }: { icon: React.ReactNode; label: string; value: any; onChange: (v: any) => void; options: { value: any; label: string }[]; tip: { title: string; body: string } }) => (
  <div className="rounded-2xl border border-border bg-background p-3">
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">{icon} {label}</label>
      <Tip title={tip.title} body={tip.body} />
    </div>
    <select value={value} onChange={(e) => onChange(isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))} className="w-full bg-transparent text-base font-semibold focus:outline-none">
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const ResultCard = ({ color, icon, title, value, note }: { color: string; icon: React.ReactNode; title: string; value: string; note: string }) => {
  const map: Record<string, { bg: string; ic: string; tx: string }> = {
    green: { bg: "bg-emerald-100/60 dark:bg-emerald-900/20", ic: "bg-emerald-600 text-white", tx: "text-emerald-700 dark:text-emerald-400" },
    teal: { bg: "bg-teal-100/60 dark:bg-teal-900/20", ic: "bg-teal-700 text-white", tx: "text-teal-700 dark:text-teal-400" },
    orange: { bg: "bg-orange-100/60 dark:bg-orange-900/20", ic: "bg-orange-500 text-white", tx: "text-orange-600 dark:text-orange-400" },
    blue: { bg: "bg-blue-100/60 dark:bg-blue-900/20", ic: "bg-blue-600 text-white", tx: "text-blue-700 dark:text-blue-400" },
    purple: { bg: "bg-purple-100/60 dark:bg-purple-900/20", ic: "bg-purple-600 text-white", tx: "text-purple-700 dark:text-purple-400" },
  };
  const c = map[color] || map.green;
  return (
    <div className={`rounded-2xl ${c.bg} p-4 flex items-start gap-3`}>
      <div className={`w-11 h-11 rounded-full ${c.ic} flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold ${c.tx} text-sm`}>{title}</p>
        <p className="text-xl font-display font-bold text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{note}</p>
      </div>
    </div>
  );
};

export default LumiVoltSizer;
