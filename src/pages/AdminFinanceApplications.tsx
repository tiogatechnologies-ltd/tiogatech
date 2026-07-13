import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Wallet, Check, X, Loader2, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface App { id: string; full_name: string; email: string; phone: string; item_name: string; total_amount_ngn: number; deposit_ngn: number; financed_ngn: number; months: number; monthly_payment_ngn: number; status: string; rejection_reason: string | null; created_at: string; address: string; state: string | null; city: string | null; occupation: string | null; monthly_income_ngn: number | null; id_document_url: string | null; interest_rate_pct: number | null; insurance_fee_ngn: number | null; management_fee_ngn: number | null; total_repayment_ngn: number | null; package_slug: string | null; assessment_id: string | null; id_number: string | null; date_of_birth: string | null; next_of_kin_name: string | null; next_of_kin_phone: string | null; notes: string | null; employer: string | null; effective_payment_method: string | null; is_asset_financing: boolean | null; direct_debit_consent: boolean | null; }

const STATUS_TABS = ["pending", "under_review", "active", "completed", "rejected"] as const;

const AdminFinanceApplications = () => {
  const [rows, setRows] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof STATUS_TABS[number]>("pending");
  const [selected, setSelected] = useState<App | null>(null);
  const [working, setWorking] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("finance_applications").select("*").order("created_at", { ascending: false });
    setRows((data || []) as any); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      if (selected?.id_document_url) {
        const { data } = await supabase.storage.from("finance-docs").createSignedUrl(selected.id_document_url, 600);
        setDocUrl(data?.signedUrl || null);
      } else setDocUrl(null);
    })();
  }, [selected]);

  const act = async (approve: boolean) => {
    if (!selected) return;
    const reason = approve ? undefined : prompt("Rejection reason?") || "Not eligible";
    setWorking(true);
    const { data, error } = await supabase.functions.invoke("approve-finance", { body: { application_id: selected.id, approve, rejection_reason: reason } });
    setWorking(false);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || error?.message || "Failed");
    toast.success(approve ? "Application approved + schedule generated" : "Application rejected");
    setSelected(null); load();
  };

  const del = async () => {
    if (!selected) return;
    if (!confirm(`Delete application from ${selected.full_name}? This also removes its schedules and payments and cannot be undone.`)) return;
    setWorking(true);
    await supabase.from("finance_schedules").delete().eq("application_id", selected.id);
    await supabase.from("finance_payments").delete().eq("application_id", selected.id);
    const { error } = await supabase.from("finance_applications").delete().eq("id", selected.id);
    setWorking(false);
    if (error) return toast.error(error.message);
    toast.success("Application deleted");
    setSelected(null); load();
  };


  const filtered = rows.filter((r) => r.status === tab);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="font-display text-2xl font-bold flex items-center gap-2"><Wallet size={22} />Finance Applications</h1><p className="text-sm text-muted-foreground">Review and approve flexible payment requests.</p></div>
          <a href="/admin/finance/schedules" className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted">View repayment schedules</a>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-border">
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.replace("_", " ")} <span className="ml-1 text-xs opacity-60">({rows.filter((r) => r.status === t).length})</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">Applicant</th><th className="text-left px-4 py-3">Item</th><th className="text-left px-4 py-3">Total</th><th className="text-left px-4 py-3">Plan</th><th className="text-left px-4 py-3">Monthly</th><th className="text-left px-4 py-3">Submitted</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No {tab} applications</td></tr> :
              filtered.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(a)}>
                  <td className="px-4 py-3"><div className="font-semibold">{a.full_name}</div><div className="text-xs text-muted-foreground">{a.email}</div></td>
                  <td className="px-4 py-3 text-xs">{a.item_name}</td>
                  <td className="px-4 py-3">₦{Number(a.total_amount_ngn).toLocaleString()}</td>
                  <td className="px-4 py-3">{a.months} mo</td>
                  <td className="px-4 py-3">₦{Number(a.monthly_payment_ngn).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div className="bg-background w-full sm:max-w-2xl sm:rounded-2xl border-t sm:border border-border max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div><h2 className="font-display text-xl font-bold">{selected.full_name}</h2><p className="text-sm text-muted-foreground">{selected.email} · {selected.phone}</p></div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${selected.status === "active" ? "bg-green-100 text-green-700" : selected.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{selected.status.replace("_", " ")}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Item</p><p className="font-semibold">{selected.item_name}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Total</p><p className="font-semibold">₦{Number(selected.total_amount_ngn).toLocaleString()}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Deposit</p><p className="font-semibold">₦{Number(selected.deposit_ngn).toLocaleString()}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Plan</p><p className="font-semibold">{selected.months} × ₦{Number(selected.monthly_payment_ngn).toLocaleString()}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Occupation</p><p>{selected.occupation || "—"}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Employer</p><p>{selected.employer || "—"}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Monthly income</p><p>{selected.monthly_income_ngn ? `₦${Number(selected.monthly_income_ngn).toLocaleString()}` : "—"}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Date of birth</p><p>{selected.date_of_birth || "—"}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">ID number</p><p className="font-mono text-xs">{selected.id_number || "—"}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Next of kin</p><p>{selected.next_of_kin_name || "—"}{selected.next_of_kin_phone ? ` · ${selected.next_of_kin_phone}` : ""}</p></div>
                <div className="p-3 rounded-lg bg-muted/40"><p className="text-[10px] uppercase text-muted-foreground">Payment method</p><p className="capitalize">{(selected.effective_payment_method || "manual").replace("_", " ")}{selected.direct_debit_consent ? " · consented" : ""}</p></div>
                <div className="p-3 rounded-lg bg-muted/40 sm:col-span-2"><p className="text-[10px] uppercase text-muted-foreground">Address</p><p>{selected.address}, {selected.city}, {selected.state}</p></div>
                {selected.notes && <div className="p-3 rounded-lg bg-muted/40 sm:col-span-2"><p className="text-[10px] uppercase text-muted-foreground">Applicant notes</p><p className="whitespace-pre-wrap">{selected.notes}</p></div>}
              </div>



              <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Lease-to-Own breakdown</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Total cost</span><span>₦{Number(selected.total_amount_ngn).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">30% deposit</span><span>₦{Number(selected.deposit_ngn).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Financed (70%)</span><span>₦{Number(selected.financed_ngn).toLocaleString()}</span></div>
                {selected.interest_rate_pct != null && <div className="flex justify-between"><span className="text-muted-foreground">Interest ({(Number(selected.interest_rate_pct) * 100).toFixed(0)}%)</span><span>₦{Math.round(Number(selected.financed_ngn) * Number(selected.interest_rate_pct)).toLocaleString()}</span></div>}
                {selected.insurance_fee_ngn != null && <div className="flex justify-between"><span className="text-muted-foreground">Insurance (2%)</span><span>₦{Number(selected.insurance_fee_ngn).toLocaleString()}</span></div>}
                {selected.management_fee_ngn != null && <div className="flex justify-between"><span className="text-muted-foreground">Management (1%)</span><span>₦{Number(selected.management_fee_ngn).toLocaleString()}</span></div>}
                {selected.total_repayment_ngn != null && <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total repayment</span><span>₦{Number(selected.total_repayment_ngn).toLocaleString()}</span></div>}
                <div className="flex justify-between font-display text-base font-bold border-t border-border pt-2"><span>Monthly × {selected.months}</span><span className="text-primary">₦{Number(selected.monthly_payment_ngn).toLocaleString()}</span></div>
                {selected.package_slug && <p className="text-[11px] text-muted-foreground pt-1">Package: <span className="font-mono">{selected.package_slug}</span></p>}
                {selected.assessment_id && <a href={`/admin/assessments`} className="text-[11px] text-primary hover:underline inline-block pt-1">View source solar assessment →</a>}
              </div>

              {selected.id_document_url ? (
                docUrl ? (
                  <a href={docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><FileText size={14} />View uploaded ID / supporting document</a>
                ) : (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-2"><Loader2 size={12} className="animate-spin" />Generating secure document link…</p>
                )
              ) : (
                <p className="text-xs text-muted-foreground italic">No document uploaded by applicant.</p>
              )}

              {selected.status === "pending" && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button onClick={() => act(false)} disabled={working} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><X size={14} />Reject</button>
                  <button onClick={() => act(true)} disabled={working} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">{working ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Approve & generate schedule</button>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-border">
                <button onClick={del} disabled={working} className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-semibold flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"><Trash2 size={14} />Delete application</button>
              </div>

              {selected.rejection_reason && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-sm">Reason: {selected.rejection_reason}</div>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFinanceApplications;
