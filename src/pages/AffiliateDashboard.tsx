import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Share2, Copy, Wallet, TrendingUp, LogOut, Users, MousePointerClick, Target, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const NGN = (n: number) => `₦${(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const AffiliateDashboard = () => {
  const { user, signOut } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const { data: aff } = await supabase.from("affiliates").select("*").eq("email", user.email!).maybeSingle();
      setAffiliate(aff);
      if (aff) {
        const [{ data: p }, { data: l }, { data: o }] = await Promise.all([
          supabase.from("affiliate_payouts").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }),
          supabase.from("leads").select("id,full_name,status,created_at,products").eq("affiliate_code", aff.code).order("created_at", { ascending: false }).limit(500),
          supabase.from("orders").select("id,total_ngn,payment_status,created_at,affiliate_code").eq("affiliate_code", aff.code).order("created_at", { ascending: false }).limit(500),
        ]);
        setPayouts(p || []);
        setLeads(l || []);
        setOrders(o || []);
      }
      setLoading(false);
    })();
  }, [user]);

  const refLink = affiliate?.code ? `${window.location.origin}/?ref=${affiliate.code}` : "";
  const rate = Number(affiliate?.commission_rate || 0);

  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const revenue = paidOrders.reduce((s, o) => s + Number(o.total_ngn || 0), 0);
    const commissionEarned = revenue * (rate / 100);
    const paidOut = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
    const pending = Math.max(0, commissionEarned - paidOut);
    return {
      leads: leads.length,
      conversions: paidOrders.length,
      revenue,
      commissionEarned,
      paidOut,
      pending,
      conversionRate: leads.length ? (paidOrders.length / leads.length) * 100 : 0,
    };
  }, [leads, orders, payouts, rate]);

  const trend = useMemo(() => {
    const days: Record<string, { day: string; leads: number; revenue: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), leads: 0, revenue: 0 };
    }
    leads.forEach((l) => {
      const k = new Date(l.created_at).toISOString().slice(0, 10);
      if (days[k]) days[k].leads += 1;
    });
    orders.filter((o) => o.payment_status === "paid").forEach((o) => {
      const k = new Date(o.created_at).toISOString().slice(0, 10);
      if (days[k]) days[k].revenue += Number(o.total_ngn || 0);
    });
    return Object.values(days);
  }, [leads, orders]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Affiliate Dashboard" description="Track your affiliate referrals, commission and payouts." path="/affiliate" />
      <SiteHeader />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-8 bg-muted/30">
        <div className="section-container max-w-6xl">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Affiliate Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <button onClick={signOut} className="inline-flex items-center gap-2 text-sm rounded-full border border-border bg-card px-4 py-2"><LogOut size={14} /> Sign out</button>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20 flex justify-center"><Loader2 className="animate-spin" /></div>
          ) : !affiliate ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              <Share2 className="text-primary mx-auto mb-3" size={32} />
              <h2 className="font-display font-bold text-foreground mb-2">You're not an active affiliate yet</h2>
              <p className="text-sm text-muted-foreground mb-4">Apply to join our affiliate program to start earning commissions on referrals.</p>
              <Link to="/?affiliate=apply" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Apply now</Link>
            </div>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Stat icon={Users} label="Total leads" value={stats.leads.toString()} />
                <Stat icon={Target} label="Conversions" value={stats.conversions.toString()} sub={`${stats.conversionRate.toFixed(1)}% rate`} />
                <Stat icon={TrendingUp} label="Referred revenue" value={NGN(stats.revenue)} />
                <Stat icon={Wallet} label="Commission earned" value={NGN(stats.commissionEarned)} sub={`@ ${rate}%`} />
                <Stat icon={Wallet} label="Paid out" value={NGN(stats.paidOut)} />
                <Stat icon={Wallet} label="Pending commission" value={NGN(stats.pending)} />
                <Stat icon={Share2} label="Your code" value={affiliate.code} />
                <Stat icon={MousePointerClick} label="Status" value={affiliate.status || "active"} />
              </div>

              {/* Referral link */}
              <div className="rounded-3xl border border-border bg-card p-6 mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Your referral link</p>
                <div className="flex gap-2 flex-wrap">
                  <input readOnly value={refLink} className="flex-1 min-w-0 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm font-mono" />
                  <button onClick={() => { navigator.clipboard.writeText(refLink); toast.success("Copied"); }} className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Copy size={14} /> Copy</button>
                </div>
              </div>

              {/* Trend chart */}
              <div className="rounded-3xl border border-border bg-card p-6 mb-6">
                <h2 className="font-display font-bold text-foreground mb-4">Last 30 days</h2>
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(v: any, n: any) => n === "revenue" ? NGN(v as number) : v} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" />
                      <Area type="monotone" dataKey="leads" stroke="hsl(var(--accent))" fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent leads */}
                <div className="rounded-3xl border border-border bg-card p-6">
                  <h2 className="font-display font-bold text-foreground mb-4">Recent leads</h2>
                  {leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No leads yet.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {leads.slice(0, 10).map((l) => (
                        <li key={l.id} className="py-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{l.full_name}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{l.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Payouts */}
                <div className="rounded-3xl border border-border bg-card p-6">
                  <h2 className="font-display font-bold text-foreground mb-4">Payouts</h2>
                  {payouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No payouts yet.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {payouts.slice(0, 10).map((p) => (
                        <li key={p.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{NGN(Number(p.amount))}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, sub }: any) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <Icon className="text-primary mb-2" size={18} />
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-lg font-display font-bold text-foreground mt-0.5 truncate">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

export default AffiliateDashboard;
