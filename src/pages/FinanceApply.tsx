import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Wallet, ArrowRight, Loader2, ShieldCheck, Upload, Check } from "lucide-react";
import { toast } from "sonner";

const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

const RATES = { 3: 0.233, 6: 0.117, 12: 0.058 };

const FinanceApply = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, profile } = useAuth();

  const itemName = params.get("item") || "";
  const amount = Number(params.get("amount") || 0);
  const monthsParam = Number(params.get("months") || 6) as 3 | 6 | 12;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [docPath, setDocPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
    address: "",
    city: "",
    state: "Lagos",
    date_of_birth: "",
    occupation: "",
    employer: "",
    monthly_income_ngn: "" as any,
    id_type: "NIN",
    id_number: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    item_name: itemName,
    total_amount_ngn: amount as any,
    months: monthsParam as 3 | 6 | 12,
    consent: false,
  });

  const deposit = useMemo(() => Math.round(Number(form.total_amount_ngn || 0) * 0.3), [form.total_amount_ngn]);
  const financed = useMemo(() => Number(form.total_amount_ngn || 0) - deposit, [form.total_amount_ngn, deposit]);
  const monthly = useMemo(() => Math.round((financed / form.months) * (1 + RATES[form.months])), [financed, form.months]);

  const upload = async (file: File) => {
    setUploading(true);
    const folder = user?.id || "guest";
    const path = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("finance-docs").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) return toast.error(error.message);
    setDocPath(path); toast.success("ID uploaded");
  };

  const submit = async () => {
    if (!form.consent) return toast.error("Please consent to the terms");
    if (!form.full_name || !form.email || !form.phone) return toast.error("Fill required fields");
    setSubmitting(true);
    const { data, error } = await supabase.from("finance_applications").insert({
      user_id: user?.id || null,
      full_name: form.full_name, email: form.email, phone: form.phone,
      address: form.address, state: form.state, city: form.city,
      date_of_birth: form.date_of_birth || null,
      occupation: form.occupation, employer: form.employer,
      monthly_income_ngn: form.monthly_income_ngn ? Number(form.monthly_income_ngn) : null,
      id_type: form.id_type, id_number: form.id_number, id_document_url: docPath,
      next_of_kin_name: form.next_of_kin_name, next_of_kin_phone: form.next_of_kin_phone,
      item_name: form.item_name, total_amount_ngn: Number(form.total_amount_ngn),
      deposit_ngn: deposit, financed_ngn: financed, months: form.months, monthly_payment_ngn: monthly,
      consent: form.consent,
    } as any).select("id").maybeSingle();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted! We'll contact you within 24 hours.");
    navigate(`/finance/apply/success?id=${data?.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Apply for Flexible Payment — Tioga Technologies" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground mb-4">← Back</button>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Wallet className="text-primary" /> Flexible Payment Application</h1>
          <p className="text-sm text-muted-foreground mt-2">30% deposit, then 3, 6 or 12 monthly installments. Decision within 24 hours.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step > s ? <Check size={14} /> : s}</div>
              <span className={`text-xs ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>{["Plan", "Details", "Review"][s - 1]}</span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {step === 1 && (
            <>
              <h2 className="font-display text-lg font-bold">Choose your plan</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-semibold">Item</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">Total amount (NGN)</label><input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.total_amount_ngn} onChange={(e) => setForm({ ...form, total_amount_ngn: e.target.value })} /></div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-2">Plan length</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 6, 12].map((m) => (
                    <button key={m} onClick={() => setForm({ ...form, months: m as 3 | 6 | 12 })} className={`p-3 rounded-xl border text-sm font-semibold ${form.months === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                      {m} months
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 space-y-1.5 text-sm">
                <div className="flex justify-between"><span>Total</span><span>₦{Number(form.total_amount_ngn || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>30% deposit</span><span>₦{deposit.toLocaleString()}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Financed</span><span>₦{financed.toLocaleString()}</span></div>
                <div className="flex justify-between pt-2 border-t border-border font-display text-base font-bold"><span>Monthly</span><span className="text-primary">₦{monthly.toLocaleString()}</span></div>
              </div>
              <button onClick={() => setStep(2)} disabled={!form.total_amount_ngn} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">Continue <ArrowRight size={16} /></button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-lg font-bold">Personal details</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold">Full name *</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">Email *</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">Phone *</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">Date of birth</label><input type="date" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className="text-xs font-semibold">Address</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">City</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">State</label><select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>{NG_STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label className="text-xs font-semibold">Occupation</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">Employer</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">Monthly income (NGN)</label><input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.monthly_income_ngn} onChange={(e) => setForm({ ...form, monthly_income_ngn: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">ID type</label><select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })}><option>NIN</option><option>BVN</option><option>Driver's License</option><option>International Passport</option><option>Voter's Card</option></select></div>
                <div><label className="text-xs font-semibold">ID number</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} /></div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Upload ID document (PDF / image)</label>
                  <div className="mt-1 flex items-center gap-3">
                    <input type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="hidden" id="id-upload" />
                    <label htmlFor="id-upload" className="px-4 py-2.5 rounded-lg border border-dashed border-border hover:bg-muted text-sm flex items-center gap-2 cursor-pointer">{uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{docPath ? "Replace file" : "Choose file"}</label>
                    {docPath && <span className="text-xs text-green-600">✓ Uploaded</span>}
                  </div>
                </div>
                <div><label className="text-xs font-semibold">Next of kin name</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.next_of_kin_name} onChange={(e) => setForm({ ...form, next_of_kin_name: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">Next of kin phone</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.next_of_kin_phone} onChange={(e) => setForm({ ...form, next_of_kin_phone: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-border font-semibold">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2">Review <ArrowRight size={16} /></button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-lg font-bold">Review & submit</h2>
              <div className="p-4 rounded-xl bg-muted/40 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="font-semibold">{form.item_name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>₦{Number(form.total_amount_ngn).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{form.months} months × ₦{monthly.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Deposit due upfront</span><span className="font-semibold">₦{deposit.toLocaleString()}</span></div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1" />
                <span>I confirm the information provided is accurate and agree to Tioga Technologies' financing terms. I authorize verification of the provided ID and consent to email/SMS reminders.</span>
              </label>
              <div className="text-xs text-muted-foreground flex items-start gap-2"><ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />Your ID is stored in a private, encrypted bucket. Only Tioga admin can view it.</div>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-border font-semibold">Back</button>
                <button onClick={submit} disabled={submitting || !form.consent} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">{submitting ? <Loader2 size={16} className="animate-spin" /> : null}Submit application</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceApply;
