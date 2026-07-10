import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Wallet, Calendar, CheckCircle2 } from "lucide-react";

const AccountFinance = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("finance_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setApps(data || []);
      if (data?.length) {
        const ids = data.map((a) => a.id);
        const { data: sch } = await supabase.from("finance_schedules").select("*").in("application_id", ids).order("installment_no");
        const grouped: Record<string, any[]> = {};
        (sch || []).forEach((s) => { (grouped[s.application_id] = grouped[s.application_id] || []).push(s); });
        setSchedules(grouped);
      }
      setLoading(false);
    })();
  }, [user]);

  const payNow = async (scheduleId: string, existingUrl: string | null) => {
    if (existingUrl) { window.location.href = existingUrl; return; }
    const { data, error } = await supabase.functions.invoke("generate-payment-link", { body: { schedule_id: scheduleId } });
    if (error || !data?.authorization_url) {
      const msg = (error as any)?.message || data?.error || "Could not create payment link";
      const { toast } = await import("sonner");
      toast.error(msg);
      return;
    }
    window.location.href = data.authorization_url;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Flexible Payment Plans — Tioga" description="View and manage your flexible payment applications and installments." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Wallet className="text-primary" /> My Flexible Payment Plans</h1>
          <p className="text-sm text-muted-foreground">Track applications and upcoming installments.</p>
        </div>

        {loading ? <p className="text-muted-foreground">Loading…</p> :
        apps.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
            <p className="text-muted-foreground">No applications yet</p>
            <a href="/finance" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Explore Flexible Payment</a>
          </div>
        ) : (
          apps.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-display font-bold">{a.item_name}</h2>
                  <p className="text-xs text-muted-foreground">Applied {new Date(a.created_at).toLocaleDateString()} · {a.months} month plan</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${a.status === "active" ? "bg-green-100 text-green-700" : a.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{a.status.replace("_", " ")}</span>
                  {(a.status === "approved" || a.status === "active") && a.is_asset_financing && (
                    <button
                      onClick={async () => {
                        const { toast } = await import("sonner");
                        const t = toast.loading("Calculating payoff…");
                        const { data: q, error: qErr } = await supabase.functions.invoke("calculate-liquidation", { body: { application_id: a.id } });
                        toast.dismiss(t);
                        if (qErr || (q as any)?.error) { toast.error((qErr as any)?.message || (q as any)?.error || "Could not calculate payoff"); return; }
                        const q2: any = q;
                        const ok = window.confirm(
                          `Liquidate ${a.item_name}?\n\n` +
                          `Installments paid: ${q2.installments_paid} of ${q2.installments_total}\n` +
                          `Outstanding principal: ₦${Number(q2.outstanding_principal).toLocaleString()}\n` +
                          `This month's interest: ₦${Number(q2.this_month_interest).toLocaleString()}\n` +
                          `Total payoff: ₦${Number(q2.payoff_amount).toLocaleString()}\n\n` +
                          `Proceed to pay?`
                        );
                        if (!ok) return;
                        const t2 = toast.loading("Preparing payoff link…");
                        const { data: pay, error: pErr } = await supabase.functions.invoke("liquidate-finance", { body: { application_id: a.id } });
                        toast.dismiss(t2);
                        if (pErr || !(pay as any)?.authorization_url) { toast.error((pErr as any)?.message || (pay as any)?.error || "Could not create payoff link"); return; }
                        window.location.href = (pay as any).authorization_url;
                      }}
                      className="text-xs font-semibold px-3 py-1 rounded-full border border-primary text-primary hover:bg-primary/10"
                    >
                      Liquidate Now
                    </button>
                  )}
                </div>
              </div>
              <div className="p-5 grid sm:grid-cols-3 gap-3 text-sm">
                <div><p className="text-[10px] uppercase text-muted-foreground">Total</p><p className="font-semibold">₦{Number(a.total_amount_ngn).toLocaleString()}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground">Monthly</p><p className="font-semibold text-primary">₦{Number(a.monthly_payment_ngn).toLocaleString()}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground">Deposit</p><p className="font-semibold">₦{Number(a.deposit_ngn).toLocaleString()}</p></div>
              </div>
              {schedules[a.id]?.length > 0 && (
                <div className="border-t border-border p-5">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2"><Calendar size={12} />Repayment schedule</p>
                  <div className="space-y-1.5">
                    {schedules[a.id].map((s) => {
                      const isUnpaid = s.status !== "paid" && s.status !== "waived";
                      const needsManual = isUnpaid && (s.auto_charge_status === "manual_required" || s.is_deposit || !!s.payment_url);
                      const label = s.is_deposit ? "Deposit" : `#${s.installment_no}`;
                      return (
                        <div key={s.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-muted/40 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            {s.status === "paid" ? <CheckCircle2 size={16} className="text-green-600" /> : <div className={`h-3 w-3 rounded-full ${s.status === "overdue" ? "bg-red-500" : "bg-blue-400"}`} />}
                            <span>{label} · {new Date(s.due_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">₦{Number(s.amount_ngn).toLocaleString()}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${s.status === "paid" ? "bg-green-100 text-green-700" : s.status === "overdue" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>{s.status}</span>
                            {isUnpaid && needsManual && (
                              <button onClick={() => payNow(s.id, s.payment_url)} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground hover:brightness-110">
                                Pay Now
                              </button>
                            )}
                            {isUnpaid && !needsManual && s.auto_charge_status === "scheduled" && (
                              <span className="text-[10px] text-muted-foreground">Auto-pay on {new Date(s.due_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {a.rejection_reason && <div className="border-t border-border p-5 text-sm text-red-700 bg-red-50 dark:bg-red-950/20">Reason: {a.rejection_reason}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountFinance;
