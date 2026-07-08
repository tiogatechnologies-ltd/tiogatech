import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Wallet, ArrowRight, Loader2, ShieldCheck, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { calcPlan, formatNGN, DEFAULT_FINANCE_CONFIG, normalizeFinanceConfig, type FinanceConfig } from "@/lib/financeCalc";

const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

const FinanceApply = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, profile } = useAuth();

  const itemName = params.get("item") || "";
  const amount = Number(params.get("amount") || 0);
  const monthsParam = [3, 6, 12, 24].includes(Number(params.get("months"))) ? Number(params.get("months")) : 12;
  const packageSlug = params.get("package") || "";
  const assessmentId = params.get("assessment") || null;

  const [config, setConfig] = useState<FinanceConfig>(DEFAULT_FINANCE_CONFIG);
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
    item_name: itemName || (packageSlug ? `Flex package ${packageSlug}` : ""),
    total_amount_ngn: amount as any,
    months: monthsParam as number,
    consent: false,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "finance").maybeSingle();
      if (data?.value) setConfig(normalizeFinanceConfig(data.value as any));

      // Prefill from assessment if logged in
      if (assessmentId && user?.id) {
        const { data: a } = await supabase.from("solar_assessments").select("full_name,email,phone,location").eq("id", assessmentId).eq("user_id", user.id).maybeSingle();
        if (a) setForm((f) => ({
          ...f,
          full_name: f.full_name || a.full_name,
          email: f.email || a.email,
          phone: f.phone || a.phone || "",
          address: f.address || a.location || "",
        }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId, user?.id]);

  const tenures = config.tenures_months?.length ? config.tenures_months : [3, 6, 12, 24];
  const breakdown = useMemo(() => calcPlan(Number(form.total_amount_ngn || 0), form.months, config), [form.total_amount_ngn, form.months, config]);

  const upload = async (file: File) => {
    setUploading(true);
    const folder = user?.id || "guest";
    const path = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("finance-docs").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) return toast.error(error.message);
    setDocPath(path); toast.success("Document uploaded");
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitError(null);
    if (!form.consent) return toast.error("Please consent to the terms");
    if (!form.full_name?.trim() || !form.email?.trim() || !form.phone?.trim()) return toast.error("Fill your name, email and phone");
    if (!form.total_amount_ngn || Number(form.total_amount_ngn) < 1_000_000) return toast.error("Minimum financed amount is ₦1,000,000");

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        user_id: user?.id ?? null,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address || null,
        state: form.state,
        city: form.city || null,
        date_of_birth: form.date_of_birth || null,
        occupation: form.occupation || null,
        employer: form.employer || null,
        monthly_income_ngn: form.monthly_income_ngn ? Number(form.monthly_income_ngn) : null,
        id_type: form.id_type,
        id_number: form.id_number || null,
        id_document_url: docPath,
        next_of_kin_name: form.next_of_kin_name || null,
        next_of_kin_phone: form.next_of_kin_phone || null,
        item_name: form.item_name || "Easy Flex",
        total_amount_ngn: breakdown.total,
        deposit_ngn: breakdown.deposit,
        financed_ngn: breakdown.financed,
        months: breakdown.tenure_months,
        monthly_payment_ngn: breakdown.monthly_payment,
        interest_rate_pct: breakdown.interest_rate,
        insurance_fee_ngn: breakdown.insurance_fee,
        management_fee_ngn: breakdown.management_fee,
        total_repayment_ngn: breakdown.total_repayment,
        package_slug: packageSlug || null,
        assessment_id: assessmentId,
        consent: form.consent,
      };

      const { data, error } = await supabase
        .from("finance_applications")
        .insert(payload as any)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      try {
        await supabase.functions.invoke("notify-new-lead", {
          body: {
            source: "finance_application",
            application_id: data?.id,
            full_name: payload.full_name,
            email: payload.email,
            phone: payload.phone,
            summary: `${payload.item_name} · ${formatNGN(breakdown.total)} · ${breakdown.tenure_months}mo`,
          },
        });
      } catch { /* non-fatal */ }

      toast.success("Application submitted! We'll contact you within 24 hours.");
      navigate(`/account/finance`);
    } catch (e: any) {
      const msg = e?.message || "Failed to submit application. Please try again.";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Apply for Easy Flex — Tioga Technologies" description="Apply for Lease-to-Own solar financing in Nigeria. 30% deposit, 3, 6, 12 or 24 month repayments, bank-partner approval." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground mb-4">← Back</button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2"><Wallet className="text-primary shrink-0" /> Easy Flex Application</h1>
          <p className="text-sm text-muted-foreground mt-2">30% deposit, then 3, 6, 12 or 24 fixed monthly installments. Decision within 24 hours.</p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 mb-8 overflow-x-auto pb-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step > s ? <Check size={14} /> : s}</div>
              <span className={`text-[11px] sm:text-xs ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>{["Plan", "Details", "Review"][s - 1]}</span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5">
          {step === 1 && (
            <>
              <h2 className="font-display text-lg font-bold">Choose your plan</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-semibold">Item / Package</label><input className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} /></div>
                <div><label className="text-xs font-semibold">Total amount (NGN)</label><input type="number" min={1000000} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.total_amount_ngn} onChange={(e) => setForm({ ...form, total_amount_ngn: e.target.value })} /></div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-2">Plan length</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tenures.map((m) => (
                    <button key={m} onClick={() => setForm({ ...form, months: m })} className={`p-3 rounded-xl border text-sm font-semibold ${form.months === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                      {m} mo
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 space-y-1.5 text-xs sm:text-sm">
                <Row label="Total project cost" value={formatNGN(breakdown.total)} />
                <Row label="30% deposit" value={formatNGN(breakdown.deposit)} muted />
                <Row label="Financed (70%)" value={formatNGN(breakdown.financed)} muted />
                <Row label={`Interest (${(breakdown.interest_rate * 100).toFixed(0)}%)`} value={formatNGN(breakdown.interest_amount)} muted />
                <Row label="Insurance (2%)" value={formatNGN(breakdown.insurance_fee)} muted />
                <Row label="Management (1%)" value={formatNGN(breakdown.management_fee)} muted />
                <div className="pt-2 border-t border-border">
                  <Row label="Total repayment" value={formatNGN(breakdown.total_repayment)} bold />
                  <Row label="Total cost (deposit + repayment)" value={formatNGN(breakdown.deposit + breakdown.total_repayment)} bold />
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-display text-base font-bold">
                  <span>Monthly</span><span className="text-primary">{formatNGN(breakdown.monthly_payment)}</span>
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!form.total_amount_ngn || Number(form.total_amount_ngn) < 1_000_000} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">Continue <ArrowRight size={16} /></button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-lg font-bold">Personal & eligibility details</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full name *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                <Field label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
                <div className="sm:col-span-2"><Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} /></div>
                <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <div>
                  <label className="text-xs font-semibold">State</label>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>{NG_STATES.map((s) => <option key={s}>{s}</option>)}</select>
                </div>
                <Field label="Occupation / Business" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} />
                <Field label="Employer / Business name" value={form.employer} onChange={(v) => setForm({ ...form, employer: v })} />
                <Field label="Monthly income (NGN)" type="number" value={form.monthly_income_ngn} onChange={(v) => setForm({ ...form, monthly_income_ngn: v })} />
                <div>
                  <label className="text-xs font-semibold">ID type</label>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })}>
                    <option>NIN</option><option>BVN</option><option>Driver's License</option><option>International Passport</option><option>Voter's Card</option>
                  </select>
                </div>
                <Field label="ID number" value={form.id_number} onChange={(v) => setForm({ ...form, id_number: v })} />
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Upload supporting documents (ID, bank statement, utility bill)</label>
                  <div className="mt-1 flex items-center gap-3">
                    <input type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="hidden" id="id-upload" />
                    <label htmlFor="id-upload" className="px-4 py-2.5 rounded-lg border border-dashed border-border hover:bg-muted text-sm flex items-center gap-2 cursor-pointer">
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{docPath ? "Replace file" : "Choose file"}
                    </label>
                    {docPath && <span className="text-xs text-green-600">✓ Uploaded</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">You can upload additional documents from your account page after submission.</p>
                </div>
                <Field label="Next of kin / guarantor name" value={form.next_of_kin_name} onChange={(v) => setForm({ ...form, next_of_kin_name: v })} />
                <Field label="Next of kin / guarantor phone" value={form.next_of_kin_phone} onChange={(v) => setForm({ ...form, next_of_kin_phone: v })} />
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
                <Row label="Item" value={form.item_name || "—"} />
                <Row label="Total cost" value={formatNGN(breakdown.total)} />
                <Row label="Deposit upfront" value={formatNGN(breakdown.deposit)} muted />
                <Row label="Interest rate" value={`${(breakdown.interest_rate * 100).toFixed(0)}%`} muted />
                <Row label="Insurance + management" value={formatNGN(breakdown.insurance_fee + breakdown.management_fee)} muted />
                <Row label="Total repayment" value={formatNGN(breakdown.total_repayment)} />
                <div className="pt-2 border-t border-border flex justify-between font-display text-base font-bold">
                  <span>Monthly × {breakdown.tenure_months}</span>
                  <span className="text-primary">{formatNGN(breakdown.monthly_payment)}</span>
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1" />
                <span>I confirm the information provided is accurate and consent to Tioga Technologies and its bank partner verifying my identity, income, and creditworthiness. I agree to the financing terms including insurance and management fees.</span>
              </label>
              <div className="text-xs text-muted-foreground flex items-start gap-2"><ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />Your documents are stored in a private, encrypted bucket. Only Tioga admin and our bank partner can view them.</div>
              {submitError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {submitError}
                </div>
              )}
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

const Row = ({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) => (
  <div className="flex justify-between">
    <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
    <span className={`${bold ? "font-display text-base font-bold" : "font-semibold"}`}>{value}</span>
  </div>
);

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="text-xs font-semibold">{label}</label>
    <input type={type} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export default FinanceApply;
