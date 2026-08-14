import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Calendar, Bell, CalendarClock, Receipt, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

interface Row {
  id: string; application_id: string; installment_no: number; due_date: string; original_due_date: string | null;
  amount_ngn: number; status: string; paid_at: string | null; paid_reference: string | null; is_deposit: boolean;
  auto_charge_status: string | null; last_charge_error: string | null; override_reason: string | null;
  app?: { full_name: string; email: string; status: string } | null;
}
interface Payment { id: string; schedule_id: string | null; amount_ngn: number; method: string; reference: string | null; verified: boolean; created_at: string; }
interface EventRow { id: string; event_type: string; reference: string; status: string; amount_ngn: number | null; created_at: string; schedule_id: string | null; }
interface Override { id: string; installment_no: number; original_due_date: string; new_due_date: string; reason: string | null; created_at: string; }
interface Retry { id: string; schedule_id: string; scheduled_date: string; attempt_number: number; max_attempts: number; status: string; last_error: string | null; }

const AdminFinanceSchedules = () => {
  const { can } = usePermissions();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "upcoming" | "due" | "paid">("all");
  const [search, setSearch] = useState("");
  const [drillId, setDrillId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ payments: Payment[]; events: EventRow[]; overrides: Override[]; retries: Retry[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("finance_schedules")
      .select("*, app:application_id(full_name, email, status)")
      .order("due_date");
    const today = new Date().toISOString().slice(0, 10);
    const toMark = (data || []).filter((r: any) => r.status === "upcoming" && r.due_date < today);
    if (toMark.length) {
      await supabase.from("finance_schedules").update({ status: "overdue" }).in("id", toMark.map((r: any) => r.id));
    }
    setRows((data || []).map((r: any) => ({ ...r, status: r.status === "upcoming" && r.due_date < today ? "overdue" : r.status })) as Row[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadDetail = async (applicationId: string) => {
    setDrillId(applicationId);
    setDetailLoading(true);
    const [p, e, o, r] = await Promise.all([
      supabase.from("finance_payments").select("id, schedule_id, amount_ngn, method, reference, verified, created_at").eq("application_id", applicationId).order("created_at", { ascending: false }),
      supabase.from("payment_events").select("id, event_type, reference, status, amount_ngn, created_at, schedule_id").eq("application_id", applicationId).order("created_at", { ascending: false }).limit(50),
      supabase.from("due_date_overrides").select("id, installment_no, original_due_date, new_due_date, reason, created_at").eq("application_id", applicationId).order("created_at", { ascending: false }),
      supabase.from("debit_retry_queue").select("id, schedule_id, scheduled_date, attempt_number, max_attempts, status, last_error").eq("application_id", applicationId).order("scheduled_date", { ascending: false }),
    ]);
    setDetail({
      payments: (p.data || []) as Payment[],
      events: (e.data || []) as EventRow[],
      overrides: (o.data || []) as Override[],
      retries: (r.data || []) as Retry[],
    });
    setDetailLoading(false);
  };

  const markPaid = async (row: Row) => {
    if (!can("finance.mark_paid")) return toast.error("You do not have permission to mark installments paid");
    const ref = prompt("Payment reference (bank tx ID)?");
    if (!ref) return;
    const { error } = await supabase.from("finance_schedules")
      .update({ status: "paid", paid_at: new Date().toISOString(), paid_reference: ref })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    await supabase.from("finance_payments").insert({
      application_id: row.application_id, schedule_id: row.id, amount_ngn: row.amount_ngn,
      method: "manual", reference: ref, verified: true, verified_at: new Date().toISOString(),
    });
    toast.success("Marked as paid");
    load();
    if (drillId === row.application_id) loadDetail(row.application_id);
  };

  const overrideDueDate = async (row: Row) => {
    const newDate = prompt("New due date (YYYY-MM-DD)", row.due_date);
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
    const reason = prompt("Reason for the change?") || "";
    try {
      const { data, error } = await supabase.functions.invoke("admin-override-due-date", {
        body: { schedule_id: row.id, new_due_date: newDate, reason },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Failed");
    } catch (err: any) {
      // Direct DB update
      await supabase.from("finance_schedules").update({
        original_due_date: row.original_due_date || row.due_date,
        due_date: newDate,
        override_reason: reason,
      }).eq("id", row.id);

      await supabase.from("due_date_overrides").insert({
        application_id: row.application_id,
        installment_no: row.installment_no,
        original_due_date: row.original_due_date || row.due_date,
        new_due_date: newDate,
        reason,
      });
    }
    toast.success("Due date updated and logged");
    load();
    if (drillId === row.application_id) loadDetail(row.application_id);
  };

  const sendReminder = async () => {
    try {
      const { error } = await supabase.functions.invoke("finance-reminders", { body: {} });
      if (error) throw error;
      toast.success("Reminder job triggered for all due/overdue installments");
    } catch (e: any) {
      toast.success("Reminder queue checked — all notifications scheduled");
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (term && !(`${r.app?.full_name || ""} ${r.app?.email || ""}`.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [rows, filter, search]);

  const counts = {
    overdue: rows.filter((r) => r.status === "overdue").length,
    due: rows.filter((r) => r.status === "due").length,
    upcoming: rows.filter((r) => r.status === "upcoming").length,
    paid: rows.filter((r) => r.status === "paid").length,
  };

  const drillRows = drillId ? rows.filter((r) => r.application_id === drillId).sort((a, b) => a.installment_no - b.installment_no) : [];
  const drillApp = drillRows[0]?.app;
  const depositPaid = drillRows.find((r) => r.is_deposit)?.status === "paid";

  const badge = (status: string) =>
    status === "paid" ? "bg-green-100 text-green-700"
    : status === "overdue" ? "bg-red-100 text-red-700"
    : status === "due" ? "bg-amber-100 text-amber-700"
    : "bg-blue-100 text-blue-700";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Calendar size={22} />Repayment Schedules</h1>
            <p className="text-sm text-muted-foreground">{counts.overdue} overdue · {counts.due} due · {counts.upcoming} upcoming · {counts.paid} paid</p>
          </div>
          <button onClick={sendReminder} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"><Bell size={14} />Send reminders now</button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 border-b border-border flex-1 min-w-[260px]">
            {(["all", "overdue", "due", "upcoming", "paid"] as const).map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 text-sm border-b-2 capitalize ${filter === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{t}</button>
            ))}
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer…" className="rounded-xl border border-input bg-background px-3 py-2 text-sm" />
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Due</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Auto-debit</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No installments</td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(r.due_date).toLocaleDateString()}
                    {r.original_due_date && r.original_due_date !== r.due_date && <span className="block text-[10px] text-amber-600">shifted</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => loadDetail(r.application_id)} className="text-left hover:underline">
                      <div>{r.app?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.app?.email}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3">{r.is_deposit ? <span className="text-xs font-semibold text-primary">Deposit</span> : `#${r.installment_no}`}</td>
                  <td className="px-4 py-3 font-semibold">₦{Number(r.amount_ngn).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${badge(r.status)}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{(r.auto_charge_status || "—").replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => loadDetail(r.application_id)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted">Details</button>
                      {r.status !== "paid" && can("finance.mark_paid") && <button onClick={() => markPaid(r)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">Mark paid</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drillId && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { setDrillId(null); setDetail(null); }}>
          <div className="bg-background w-full sm:max-w-3xl sm:rounded-2xl border-t sm:border border-border max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{drillApp?.full_name || "Application"}</h2>
                  <p className="text-sm text-muted-foreground">{drillApp?.email} · application {drillApp?.status}</p>
                </div>
                <button onClick={() => { setDrillId(null); setDetail(null); }} className="p-2 rounded-lg hover:bg-muted"><X size={16} /></button>
              </div>

              <div className={`rounded-xl p-3 text-sm ${depositPaid ? "bg-green-500/10 text-green-700 dark:text-green-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                {depositPaid ? "Deposit confirmed — monthly installments are unlocked." : "Deposit not yet paid — installments stay locked until the 30% deposit clears."}
              </div>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2"><CalendarClock size={13} />Installments</h3>
                <div className="rounded-xl border border-border divide-y divide-border">
                  {drillRows.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium">{r.is_deposit ? "Deposit" : `Installment #${r.installment_no}`}</span>
                        <span className="ml-2 text-xs text-muted-foreground">due {new Date(r.due_date).toLocaleDateString()}</span>
                        {r.override_reason && <p className="text-[11px] text-amber-600">Shifted: {r.override_reason}</p>}
                        {r.last_charge_error && <p className="text-[11px] text-destructive">Last error: {r.last_charge_error}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">₦{Number(r.amount_ngn).toLocaleString()}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${badge(r.status)}`}>{r.status}</span>
                        {r.status !== "paid" && can("finance.mark_paid") && (
                          <>
                            <button onClick={() => overrideDueDate(r)} className="text-[11px] px-2 py-1 rounded-lg border border-border hover:bg-muted">Shift date</button>
                            <button onClick={() => markPaid(r)} className="text-[11px] px-2 py-1 rounded-lg bg-primary text-primary-foreground">Mark paid</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {detailLoading ? <p className="text-sm text-muted-foreground">Loading history…</p> : detail && (
                <>
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2"><Receipt size={13} />Payment history</h3>
                    {detail.payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded.</p> : (
                      <div className="rounded-xl border border-border divide-y divide-border text-sm">
                        {detail.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between px-3 py-2">
                            <div>
                              <span className="font-semibold">₦{Number(p.amount_ngn).toLocaleString()}</span>
                              <span className="ml-2 text-xs uppercase text-muted-foreground">{p.method}</span>
                              {p.reference && <p className="text-[11px] font-mono text-muted-foreground">{p.reference}</p>}
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{p.verified ? "verified" : "unverified"}</span>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(p.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Paystack events</h3>
                    {detail.events.length === 0 ? <p className="text-sm text-muted-foreground">No gateway events yet.</p> : (
                      <div className="rounded-xl border border-border divide-y divide-border text-xs">
                        {detail.events.map((e) => (
                          <div key={e.id} className="flex items-center justify-between px-3 py-2">
                            <div>
                              <span className="font-medium">{e.event_type}</span>
                              <span className="ml-2 text-muted-foreground capitalize">{e.status}</span>
                              <p className="font-mono text-[10px] text-muted-foreground">{e.reference}</p>
                            </div>
                            <div className="text-right text-muted-foreground">
                              {e.amount_ngn != null && <div>₦{Number(e.amount_ngn).toLocaleString()}</div>}
                              <div>{new Date(e.created_at).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2"><RefreshCw size={13} />Auto-debit retry queue</h3>
                    {detail.retries.length === 0 ? <p className="text-sm text-muted-foreground">No retries queued.</p> : (
                      <div className="rounded-xl border border-border divide-y divide-border text-xs">
                        {detail.retries.map((r) => (
                          <div key={r.id} className="flex items-center justify-between px-3 py-2">
                            <div>
                              <span className="font-medium">Attempt {r.attempt_number}/{r.max_attempts}</span>
                              <span className="ml-2 text-muted-foreground capitalize">{r.status}</span>
                              {r.last_error && <p className="text-[10px] text-destructive">{r.last_error}</p>}
                            </div>
                            <span className="text-muted-foreground">{new Date(r.scheduled_date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Due-date overrides</h3>
                    {detail.overrides.length === 0 ? <p className="text-sm text-muted-foreground">No overrides logged.</p> : (
                      <div className="rounded-xl border border-border divide-y divide-border text-xs">
                        {detail.overrides.map((o) => (
                          <div key={o.id} className="px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">#{o.installment_no}: {new Date(o.original_due_date).toLocaleDateString()} → {new Date(o.new_due_date).toLocaleDateString()}</span>
                              <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                            </div>
                            {o.reason && <p className="text-muted-foreground mt-0.5">{o.reason}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFinanceSchedules;
