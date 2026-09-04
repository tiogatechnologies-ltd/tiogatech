import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { applianceDatabase } from "@/data/applianceWatts";
import { ArrowRight, Loader2, Plus, Minus, Trash2, Sun, Zap, Battery, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

interface ApplianceRow { name: string; qty: number; watts: number; hours: number; }

const SolarAssessment = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
    location: "Lagos",
    building_type: "residential" as "residential" | "office" | "commercial" | "industrial",
    occupants: 4,
    current_power_situation: "grid_generator",
    monthly_bill_ngn: "" as any,
  });

  const [appliances, setAppliances] = useState<ApplianceRow[]>([
    { name: "LED Bulb", qty: 6, watts: 10, hours: 6 },
    { name: "Fridge (Double Door)", qty: 1, watts: 200, hours: 10 },
    { name: "TV (43\")", qty: 1, watts: 70, hours: 5 },
    { name: "Standing Fan", qty: 2, watts: 55, hours: 8 },
  ]);

  const load = useMemo(() => {
    const peak = appliances.reduce((s, a) => s + a.watts * a.qty, 0);
    const daily = appliances.reduce((s, a) => s + (a.watts * a.qty * a.hours) / 1000, 0);
    return { peak: Math.round(peak), daily: Math.round(daily * 100) / 100 };
  }, [appliances]);

  const addAppliance = (name: string, watts: number) => {
    if (appliances.some((a) => a.name === name)) return toast.info("Already added - adjust quantity");
    setAppliances([...appliances, { name, qty: 1, watts, hours: 4 }]);
  };

  const updateRow = (i: number, patch: Partial<ApplianceRow>) =>
    setAppliances(appliances.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  const removeRow = (i: number) => setAppliances(appliances.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!form.full_name || !form.email || appliances.length === 0) {
      toast.error("Please fill name, email and add appliances");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("solar-assess", {
        body: {
          mode: "basic",
          ...form,
          monthly_bill_ngn: Number(form.monthly_bill_ngn) || null,
          appliances,
        },
      });
      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate recommendation");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const r = result.recommendation;
    return (
      <div className="min-h-screen flex flex-col">
        <SEO title="Your Solar Recommendation - Tioga Technologies" description="AI-generated solar system recommendation tailored to your home and usage." path="/solar-assessment" />
        <SiteHeader />
        <main className="flex-1 pt-24 sm:pt-28 pb-12 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3"><Sun size={26} /></div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold">Your Recommended System</h1>
              <p className="text-muted-foreground mt-2">Based on {result.daily_kwh} kWh/day and {result.peak_load_w} W peak load.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                { icon: Zap, label: "Inverter", value: `${r.inverter_kva}kVA Hybrid` },
                { icon: Sun, label: "Solar Panels", value: `${r.panel_count} × ${r.panel_w}W` },
                { icon: Battery, label: "Battery", value: `${r.battery_kwh} kWh Lithium` },
                { icon: Clock, label: "Estimated Backup", value: `${r.backup_hours} hours` },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-1"><c.icon size={18} className="text-primary" /><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</span></div>
                  <div className="text-xl font-display font-bold">{c.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8 text-center">
              <h2 className="text-xl font-display font-bold mb-2">Want the full engineering report?</h2>
              <p className="text-sm text-muted-foreground mb-5">Unlock the complete specification: load analysis, cable sizing, bill of materials, PDF download, and matching packages.</p>
              <button
                onClick={() => navigate(user ? `/solar-assessment/${result.assessment_id}/full` : `/auth?next=/solar-assessment/${result.assessment_id}/full`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110"
              >
                View Full System Specification <ArrowRight size={16} />
              </button>
              {!user && <p className="text-[11px] text-muted-foreground mt-3">Free - sign up to use one of your 3 free analyses.</p>}
            </div>

            <div className="text-center mt-6">
              <button onClick={() => { setResult(null); setStep(1); }} className="text-sm text-muted-foreground underline">Start over</button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Free Solar Assessment - Tioga Technologies" description="Get a personalized solar system recommendation based on your home appliances and energy usage. Free instant analysis for Nigerian homes." path="/solar-assessment" />
      <SiteHeader />
      <main className="flex-1 pt-24 sm:pt-28 pb-10 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-display font-bold">Solar Energy Assessment</h1>
            <p className="text-muted-foreground mt-2">Tell us about your home to get a tailored solar recommendation.</p>
          </div>

          <div className="flex gap-2 mb-6 justify-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 w-16 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 space-y-4">
            {step === 1 && (
              <>
                <h2 className="font-display font-bold text-lg">Contact details</h2>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
                  {NG_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display font-bold text-lg">Building</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(["residential", "office", "commercial", "industrial"] as const).map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, building_type: t })} className={`py-3 rounded-xl text-sm font-medium border ${form.building_type === t ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background"}`}>{t}</button>
                  ))}
                </div>
                <label className="text-sm text-muted-foreground">Occupants / users</label>
                <input type="number" min={1} value={form.occupants} onChange={(e) => setForm({ ...form, occupants: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                <label className="text-sm text-muted-foreground">Current power situation</label>
                <select value={form.current_power_situation} onChange={(e) => setForm({ ...form, current_power_situation: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
                  <option value="grid_only">Grid only</option>
                  <option value="grid_generator">Grid + generator</option>
                  <option value="generator_only">Generator dependent</option>
                  <option value="existing_solar">Existing solar (upgrade)</option>
                  <option value="no_power">No power</option>
                </select>
                <label className="text-sm text-muted-foreground">Monthly electricity bill (₦, optional)</label>
                <input type="number" value={form.monthly_bill_ngn} onChange={(e) => setForm({ ...form, monthly_bill_ngn: e.target.value })} placeholder="e.g. 25000" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display font-bold text-lg">Appliances</h2>
                <p className="text-sm text-muted-foreground">Adjust quantity and daily hours. Add more from the picker below.</p>

                <div className="rounded-xl border border-border bg-muted/30 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                  {applianceDatabase.map((a) => (
                    <button key={a.name} onClick={() => addAppliance(a.name, a.avgWatts)} className="text-xs text-left px-3 py-2 rounded-lg bg-background hover:bg-primary/10 border border-border">
                      <span className="mr-1">{a.icon}</span>{a.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mt-3">
                  {appliances.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.watts}W</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateRow(i, { qty: Math.max(1, a.qty - 1) })} className="p-1 rounded bg-muted"><Minus size={12} /></button>
                        <span className="text-xs w-6 text-center">{a.qty}</span>
                        <button onClick={() => updateRow(i, { qty: a.qty + 1 })} className="p-1 rounded bg-muted"><Plus size={12} /></button>
                      </div>
                      <input type="number" min={0} max={24} value={a.hours} onChange={(e) => updateRow(i, { hours: Number(e.target.value) })} className="w-12 text-xs text-center rounded border border-border bg-background py-1" />
                      <span className="text-[10px] text-muted-foreground">hrs</span>
                      <button onClick={() => removeRow(i)} className="p-1 text-destructive"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-primary/10 p-3 text-sm font-medium flex justify-between">
                  <span>Daily energy: <strong>{load.daily} kWh</strong></span>
                  <span>Peak: <strong>{load.peak} W</strong></span>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              {step > 1 ? <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium">Back</button> : <div />}
              {step < 3 ? (
                <button onClick={() => setStep(step + 1)} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Next <ArrowRight size={14} /></button>
              ) : (
                <button onClick={submit} disabled={submitting} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sun size={14} />}
                  {submitting ? "Analyzing..." : "Get my recommendation"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default SolarAssessment;
