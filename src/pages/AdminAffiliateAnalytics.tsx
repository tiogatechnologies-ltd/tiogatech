import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, RefreshCw, TrendingUp, Users, Target, CircleDollarSign, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Lead = {
  id: string;
  status: string | null;
  budget: string | null;
  created_at: string;
  affiliate_code: string | null;
};
type Application = { id: string; status: string; created_at: string };
type Affiliate = {
  id: string;
  full_name: string;
  code: string;
  commission_rate: number;
  status: string;
};
type Payout = {
  id: string;
  affiliate_id: string;
  amount: number;
  commission_total: number;
  revenue_total: number;
  status: string;
  created_at: string;
  paid_at: string | null;
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

const monthKey = (iso: string) => iso.slice(0, 7);

const AdminAffiliateAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("90");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  const load = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    const sinceIso = since.toISOString();

    const [l, a, af, p] = await Promise.all([
      supabase
        .from("leads")
        .select("id, status, budget, created_at, affiliate_code")
        .gte("created_at", sinceIso),
      supabase
        .from("affiliate_applications" as any)
        .select("id, status, created_at")
        .gte("created_at", sinceIso),
      supabase
        .from("affiliates" as any)
        .select("id, full_name, code, commission_rate, status"),
      supabase
        .from("affiliate_payouts" as any)
        .select("id, affiliate_id, amount, commission_total, revenue_total, status, created_at, paid_at")
        .gte("created_at", sinceIso),
    ]);

    if (l.data) setLeads(l.data as Lead[]);
    if (a.data) setApps(a.data as unknown as Application[]);
    if (af.data) setAffiliates(af.data as unknown as Affiliate[]);
    if (p.data) setPayouts(p.data as unknown as Payout[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [days]);

  const affLeads = useMemo(() => leads.filter((l) => l.affiliate_code), [leads]);

  const funnel = useMemo(() => {
    const totalLeads = affLeads.length;
    const totalApps = apps.length;
    const approved = apps.filter((a) => a.status === "approved").length;
    const won = affLeads.filter((l) => l.status === "won" || l.status === "converted").length;
    return { totalLeads, totalApps, approved, won };
  }, [affLeads, apps]);

  const funnelChart = useMemo(
    () => [
      { stage: "Affiliate leads", value: funnel.totalLeads },
      { stage: "Applications", value: funnel.totalApps },
      { stage: "Approved affiliates", value: funnel.approved },
      { stage: "Won leads", value: funnel.won },
    ],
    [funnel],
  );

  const conversionRate = funnel.totalLeads
    ? ((funnel.won / funnel.totalLeads) * 100).toFixed(1)
    : "0.0";

  const approvalRate = funnel.totalApps
    ? ((funnel.approved / funnel.totalApps) * 100).toFixed(1)
    : "0.0";

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; commission: number; payout: number }>();
    affLeads.forEach((l) => {
      if (l.status !== "won" && l.status !== "converted") return;
      const k = monthKey(l.created_at);
      const cur = map.get(k) || { month: k, revenue: 0, commission: 0, payout: 0 };
      const rev = parseBudgetToNGN(l.budget);
      cur.revenue += rev;
      const aff = affiliates.find((a) => a.code === l.affiliate_code);
      cur.commission += rev * (Number(aff?.commission_rate || 10) / 100);
      map.set(k, cur);
    });
    payouts.forEach((p) => {
      const k = monthKey(p.created_at);
      const cur = map.get(k) || { month: k, revenue: 0, commission: 0, payout: 0 };
      cur.payout += Number(p.amount);
      map.set(k, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [affLeads, affiliates, payouts]);

  const leaderboard = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; leads: number; won: number; revenue: number; commission: number; rate: number }
    >();
    affiliates.forEach((a) => {
      map.set(a.code, {
        code: a.code,
        name: a.full_name,
        leads: 0,
        won: 0,
        revenue: 0,
        commission: 0,
        rate: Number(a.commission_rate),
      });
    });
    affLeads.forEach((l) => {
      if (!l.affiliate_code) return;
      const row = map.get(l.affiliate_code);
      if (!row) return;
      row.leads += 1;
      if (l.status === "won" || l.status === "converted") {
        row.won += 1;
        const rev = parseBudgetToNGN(l.budget);
        row.revenue += rev;
        row.commission += rev * (row.rate / 100);
      }
    });
    return Array.from(map.values())
      .filter((r) => r.leads > 0)
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 10);
  }, [affLeads, affiliates]);

  const totalRevenue = revenueByMonth.reduce((s, r) => s + r.revenue, 0);
  const totalCommission = revenueByMonth.reduce((s, r) => s + r.commission, 0);
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Affiliate analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Lead → application → approval conversion and revenue/commission over time.
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <KPI icon={Users} label="Affiliate leads" value={String(funnel.totalLeads)} />
              <KPI
                icon={Target}
                label="Lead → won rate"
                value={`${conversionRate}%`}
                hint={`${funnel.won} won`}
              />
              <KPI
                icon={TrendingUp}
                label="Application approval"
                value={`${approvalRate}%`}
                hint={`${funnel.approved}/${funnel.totalApps}`}
              />
              <KPI icon={CircleDollarSign} label="Commission earned" value={ngn(totalCommission)} hint={`Paid: ${ngn(totalPaid)}`} />
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mb-6">
              <Card title="Conversion funnel">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={funnelChart} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="stage" type="category" width={130} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {funnelChart.map((_, i) => (
                        <Cell
                          key={i}
                          fill={["hsl(var(--primary))", "hsl(var(--accent))", "#6366f1", "#10b981"][i]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Revenue & commission by month">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueByMonth}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="com" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      formatter={(v: number) => ngn(v)}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" name="Revenue" />
                    <Area type="monotone" dataKey="commission" stroke="hsl(var(--accent))" fill="url(#com)" name="Commission" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card title="Payouts over time">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: number) => ngn(v)}
                  />
                  <Line type="monotone" dataKey="payout" stroke="#10b981" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="mt-6">
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <Trophy size={16} className="text-primary" /> Top affiliates
                  </span>
                }
              >
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No affiliate leads in this range yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm">
                      <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="py-2 px-2">Affiliate</th>
                          <th className="py-2 px-2 text-right">Leads</th>
                          <th className="py-2 px-2 text-right">Won</th>
                          <th className="py-2 px-2 text-right">Conv %</th>
                          <th className="py-2 px-2 text-right">Revenue</th>
                          <th className="py-2 px-2 text-right">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((r) => (
                          <tr key={r.code} className="border-t border-border">
                            <td className="py-2 px-2">
                              <p className="font-semibold">{r.name}</p>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {r.code.toUpperCase()} • {r.rate}%
                              </p>
                            </td>
                            <td className="py-2 px-2 text-right">{r.leads}</td>
                            <td className="py-2 px-2 text-right">{r.won}</td>
                            <td className="py-2 px-2 text-right">
                              {r.leads ? ((r.won / r.leads) * 100).toFixed(0) : 0}%
                            </td>
                            <td className="py-2 px-2 text-right">{ngn(r.revenue)}</td>
                            <td className="py-2 px-2 text-right font-bold text-primary">
                              {ngn(r.commission)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

const KPI = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
      <Icon size={14} /> {label}
    </div>
    <p className="text-2xl font-display font-bold mt-1">{value}</p>
    {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const Card = ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <h2 className="font-display font-bold text-foreground mb-3">{title}</h2>
    {children}
  </div>
);

export default AdminAffiliateAnalytics;
