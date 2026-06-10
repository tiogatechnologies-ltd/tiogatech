import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Copy,
  Check,
  Download,
  Loader2,
  RefreshCw,
  CircleDollarSign,
  CheckCircle2,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const STATEMENT_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/affiliate-statement`;

type Affiliate = {
  id: string;
  full_name: string;
  email: string;
  code: string;
  commission_rate: number;
  status: string;
};

type Payout = {
  id: string;
  affiliate_id: string;
  period_start: string;
  period_end: string;
  lead_count: number;
  revenue_total: number;
  commission_total: number;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  notes: string | null;
  statement_token: string;
  created_at: string;
};

const ngn = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const parseBudgetToNGN = (b: string | null): number => {
  if (!b) return 0;
  const cleaned = b.toLowerCase().replace(/[, ₦]/g, "");
  const nums = cleaned.match(/[\d.]+/g)?.map(Number).filter((n) => !Number.isNaN(n)) || [];
  if (!nums.length) return 0;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  if (cleaned.includes("m") || avg < 1000) return avg * 1_000_000;
  if (cleaned.includes("k")) return avg * 1_000;
  return avg;
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600",
  approved: "bg-blue-500/15 text-blue-600",
  paid: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-muted text-muted-foreground",
};

const AdminAffiliatePayouts = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [paying, setPaying] = useState<Payout | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [p, a] = await Promise.all([
      supabase
        .from("affiliate_payouts" as any)
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("affiliates" as any)
        .select("id, full_name, email, code, commission_rate, status")
        .order("full_name"),
    ]);
    if (p.data) setPayouts(p.data as unknown as Payout[]);
    if (a.data) setAffiliates(a.data as unknown as Affiliate[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => (filterStatus === "all" ? payouts : payouts.filter((p) => p.status === filterStatus)),
    [payouts, filterStatus],
  );

  const totals = useMemo(() => {
    const acc = { pending: 0, paid: 0, all: 0 };
    payouts.forEach((p) => {
      acc.all += Number(p.amount);
      if (p.status === "paid") acc.paid += Number(p.amount);
      if (p.status === "pending" || p.status === "approved") acc.pending += Number(p.amount);
    });
    return acc;
  }, [payouts]);

  const notifyAffiliate = async (
    p: Payout,
    subject: string,
    message: string,
  ) => {
    const aff = affiliates.find((a) => a.id === p.affiliate_id);
    if (!aff?.email) return;
    try {
      await supabase.functions.invoke("notify-new-lead", {
        body: {
          custom_email: true,
          to: aff.email,
          recipient_name: aff.full_name,
          subject,
          message,
        },
      });
    } catch (err) {
      console.error("Payout notification failed", err);
    }
  };

  const approve = async (p: Payout) => {
    const { error } = await supabase
      .from("affiliate_payouts" as any)
      .update({ status: "approved" })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Payout approved");
    void notifyAffiliate(
      p,
      "Your payout has been approved",
      `Good news — your payout of ₦${Number(p.amount).toLocaleString()} for ${p.period_start} to ${p.period_end} has been approved and is queued for payment.`,
    );
    void load();
  };

  const reject = async (p: Payout) => {
    if (!confirm("Reject this payout?")) return;
    const { error } = await supabase
      .from("affiliate_payouts" as any)
      .update({ status: "rejected" })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Payout rejected");
    void notifyAffiliate(
      p,
      "Your payout request was not approved",
      `Your payout request of ₦${Number(p.amount).toLocaleString()} for ${p.period_start} to ${p.period_end} was not approved at this time. Please reach out to the affiliate team if you have questions.`,
    );
    void load();
  };

  const affiliateOf = (id: string) => affiliates.find((a) => a.id === id);

  const copyStatement = async (token: string) => {
    const link = `${STATEMENT_BASE}?token=${token}&format=csv`;
    await navigator.clipboard.writeText(link);
    toast.success("Statement download link copied");
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Affiliate payouts</h1>
            <p className="text-sm text-muted-foreground">
              Review payout requests, approve, mark as paid, and share statement downloads.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> New payout
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <StatCard label="Pending / approved" value={ngn(totals.pending)} tone="amber" />
          <StatCard label="Paid out (lifetime)" value={ngn(totals.paid)} tone="emerald" />
          <StatCard label="All payouts" value={ngn(totals.all)} tone="primary" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl">
            No payouts yet. Click <strong>New payout</strong> to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => {
              const aff = affiliateOf(p.affiliate_id);
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-border bg-card p-4 flex flex-col lg:flex-row lg:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">
                        {aff?.full_name || "Unknown affiliate"}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          {aff?.code?.toUpperCase()}
                        </span>
                      </p>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                          statusStyles[p.status]
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.period_start} → {p.period_end} • {p.lead_count} leads
                      {p.paid_at ? ` • paid ${new Date(p.paid_at).toLocaleDateString()}` : ""}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">Revenue</span>{" "}
                      <span className="font-bold">{ngn(p.revenue_total)}</span>
                      <span className="text-muted-foreground"> • Commission</span>{" "}
                      <span className="font-bold text-primary">{ngn(p.commission_total)}</span>
                      <span className="text-muted-foreground"> • Payout</span>{" "}
                      <span className="font-bold text-emerald-600">{ngn(p.amount)}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {p.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => approve(p)}>
                          <CheckCircle2 size={14} /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => reject(p)}>
                          Reject
                        </Button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <Button size="sm" onClick={() => setPaying(p)}>
                        <CircleDollarSign size={14} /> Mark paid
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyStatement(p.statement_token)}
                    >
                      <Copy size={14} /> Copy link
                    </Button>
                    <a
                      href={`${STATEMENT_BASE}?token=${p.statement_token}&format=csv`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <Download size={14} /> CSV
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreatePayoutDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        affiliates={affiliates}
        onSaved={load}
      />

      <MarkPaidDialog
        payout={paying}
        onClose={() => setPaying(null)}
        onSaved={load}
      />
    </AdminLayout>
  );
};

const StatCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "emerald" | "primary";
}) => {
  const map = {
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-600",
    primary: "from-primary/10 to-primary/5 border-primary/20 text-primary",
  } as const;
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${map[tone]}`}>
      <p className="text-[11px] uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-display font-bold mt-1 text-foreground">{value}</p>
    </div>
  );
};

const CreatePayoutDialog = ({
  open,
  onClose,
  affiliates,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  affiliates: Affiliate[];
  onSaved: () => void;
}) => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [affiliateId, setAffiliateId] = useState("");
  const [periodStart, setPeriodStart] = useState(firstOfMonth);
  const [periodEnd, setPeriodEnd] = useState(last);
  const [calc, setCalc] = useState<{ leads: number; revenue: number; commission: number } | null>(
    null,
  );
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setAffiliateId("");
      setCalc(null);
      setAmount(0);
      setNotes("");
    }
  }, [open]);

  const active = affiliates.filter((a) => a.status === "active");
  const selected = active.find((a) => a.id === affiliateId);

  const recalc = async () => {
    if (!selected) return toast.error("Pick an affiliate first");
    if (!periodStart || !periodEnd) return toast.error("Pick a period");
    setCalculating(true);
    const { data, error } = await supabase
      .from("leads")
      .select("budget, status")
      .eq("affiliate_code", selected.code)
      .gte("created_at", `${periodStart}T00:00:00Z`)
      .lte("created_at", `${periodEnd}T23:59:59Z`);
    setCalculating(false);
    if (error) return toast.error(error.message);
    const won = (data || []).filter((l: any) => l.status === "won" || l.status === "converted");
    const revenue = won.reduce(
      (s: number, l: any) => s + parseBudgetToNGN(l.budget),
      0,
    );
    const commission = revenue * (Number(selected.commission_rate) / 100);
    setCalc({ leads: won.length, revenue, commission });
    setAmount(Math.round(commission));
  };

  const save = async () => {
    if (!selected || !calc) return toast.error("Calculate the payout first");
    setSaving(true);
    const { error } = await supabase.from("affiliate_payouts" as any).insert({
      affiliate_id: selected.id,
      period_start: periodStart,
      period_end: periodEnd,
      lead_count: calc.leads,
      revenue_total: calc.revenue,
      commission_total: calc.commission,
      amount,
      status: "pending",
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Payout request created");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New payout request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Affiliate</Label>
            <Select value={affiliateId} onValueChange={setAffiliateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose affiliate" />
              </SelectTrigger>
              <SelectContent>
                {active.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.full_name} ({a.code}) — {a.commission_rate}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Period start</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <Label>Period end</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          <Button variant="outline" onClick={recalc} disabled={calculating || !selected} className="w-full">
            {calculating ? <Loader2 className="animate-spin" size={14} /> : <Calculator size={14} />}
            Calculate from won leads
          </Button>

          {calc && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Won leads:</span>{" "}
                <strong>{calc.leads}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Gross revenue (est):</span>{" "}
                <strong>{ngn(calc.revenue)}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Commission @ {selected?.commission_rate}%:</span>{" "}
                <strong className="text-primary">{ngn(calc.commission)}</strong>
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">
                Revenue is estimated from lead budgets; adjust the payout below if needed.
              </p>
            </div>
          )}

          <div>
            <Label>Payout amount (NGN)</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button onClick={save} disabled={saving || !calc} className="w-full">
            {saving ? "Saving…" : "Create payout request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MarkPaidDialog = ({
  payout,
  onClose,
  onSaved,
}: {
  payout: Payout | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [method, setMethod] = useState("Bank transfer");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payout) {
      setMethod(payout.payment_method || "Bank transfer");
      setReference(payout.payment_reference || "");
    }
  }, [payout]);

  const save = async () => {
    if (!payout) return;
    setSaving(true);
    const { error } = await supabase
      .from("affiliate_payouts" as any)
      .update({
        status: "paid",
        payment_method: method.trim() || null,
        payment_reference: reference.trim() || null,
        paid_at: new Date().toISOString(),
      })
      .eq("id", payout.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Marked as paid");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!payout} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark payout as paid</DialogTitle>
        </DialogHeader>
        {payout && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Recording payment of <strong className="text-foreground">{ngn(payout.amount)}</strong>{" "}
              for period {payout.period_start} → {payout.period_end}.
            </p>
            <div>
              <Label>Payment method</Label>
              <Input value={method} onChange={(e) => setMethod(e.target.value)} />
            </div>
            <div>
              <Label>Payment reference</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transfer ref, transaction ID…"
              />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : (
                <>
                  <Check size={14} /> Confirm payment
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminAffiliatePayouts;
