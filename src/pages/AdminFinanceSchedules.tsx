import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Calendar, CheckCircle2, AlertCircle, Bell } from "lucide-react";
import { toast } from "sonner";

interface Row { id: string; application_id: string; installment_no: number; due_date: string; amount_ngn: number; status: string; paid_at: string | null; paid_reference: string | null; app?: { full_name: string; email: string; }; }

const AdminFinanceSchedules = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "upcoming" | "paid">("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("finance_schedules").select("*, app:application_id(full_name, email)").order("due_date");
    // Auto-update overdue
    const today = new Date().toISOString().slice(0, 10);
    const toMark = (data || []).filter((r: any) => r.status === "upcoming" && r.due_date < today);
    if (toMark.length) {
      await supabase.from("finance_schedules").update({ status: "overdue" }).in("id", toMark.map((r: any) => r.id));
    }
    setRows((data || []).map((r: any) => ({ ...r, status: r.status === "upcoming" && r.due_date < today ? "overdue" : r.status })) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markPaid = async (id: string) => {
    const ref = prompt("Payment reference (bank tx ID)?");
    if (!ref) return;
    await supabase.from("finance_schedules").update({ status: "paid", paid_at: new Date().toISOString(), paid_reference: ref }).eq("id", id);
    toast.success("Marked as paid"); load();
  };

  const sendReminder = async () => {
    const { error } = await supabase.functions.invoke("finance-reminders", { body: {} });
    if (error) return toast.error(error.message);
    toast.success("Reminder job triggered for all due/overdue installments");
  };

  const filtered = rows.filter((r) => filter === "all" ? true : r.status === filter);
  const counts = { overdue: rows.filter((r) => r.status === "overdue").length, upcoming: rows.filter((r) => r.status === "upcoming").length, paid: rows.filter((r) => r.status === "paid").length };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Calendar size={22} />Repayment Schedules</h1>
            <p className="text-sm text-muted-foreground">{counts.overdue} overdue · {counts.upcoming} upcoming · {counts.paid} paid</p>
          </div>
          <button onClick={sendReminder} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"><Bell size={14} />Send reminders now</button>
        </div>

        <div className="flex gap-1 border-b border-border">
          {(["all","overdue","upcoming","paid"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 text-sm border-b-2 capitalize ${filter === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{t}</button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">Due</th><th className="text-left px-4 py-3">Customer</th><th className="text-left px-4 py-3">#</th><th className="text-left px-4 py-3">Amount</th><th className="text-left px-4 py-3">Status</th><th></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No installments</td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(r.due_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><div>{r.app?.full_name}</div><div className="text-xs text-muted-foreground">{r.app?.email}</div></td>
                  <td className="px-4 py-3">#{r.installment_no}</td>
                  <td className="px-4 py-3 font-semibold">₦{Number(r.amount_ngn).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.status === "paid" ? "bg-green-100 text-green-700" : r.status === "overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-right">{r.status !== "paid" && <button onClick={() => markPaid(r.id)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">Mark paid</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceSchedules;
