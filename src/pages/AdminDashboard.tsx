import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Users, TrendingUp, Clock, ShoppingBag, Wallet, AlertTriangle,
  Mail, ArrowUpRight, FileText, Send, Sparkles, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminSEO from "@/components/AdminSEO";
import { useAuth } from "@/contexts/AuthContext";

const NGN = (n: number) => `₦${(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const STATUS_COLORS: Record<string, string> = {
  new: "hsl(var(--primary))",
  pending: "hsl(var(--accent))",
  processing: "hsl(220 90% 60%)",
  shipped: "hsl(260 80% 60%)",
  delivered: "hsl(140 70% 45%)",
  cancelled: "hsl(0 70% 55%)",
  refunded: "hsl(30 80% 55%)",
};

interface DashStats {
  revenueToday: number;
  revenue7d: number;
  ordersPending: number;
  leadsToday: number;
  newCustomers7d: number;
  activeFinance: number;
  overdueInstallments: number;
  lowStockCount: number;
  newsletterSubs: number;
  totalProducts: number;
}

interface TrendPoint { day: string; revenue: number; leads: number; }
interface StatusSlice { name: string; value: number; }
interface ActivityItem { id: string; kind: string; title: string; subtitle: string; href: string; at: string; }
interface LowStock { id: string; name: string; stock: number; threshold: number; }
interface PendingItem { id: string; kind: "finance" | "career" | "affiliate"; title: string; subtitle: string; created_at: string; href: string; }
interface TopProduct { name: string; revenue: number; qty: number; }

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [statusSlices, setStatusSlices] = useState<StatusSlice[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const fetchAll = async () => {
    try {
      const now = new Date();
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      const month = new Date(now); month.setDate(month.getDate() - 29); month.setHours(0, 0, 0, 0);

      const [
        ordersToday, orders7d, ordersPending, leadsToday, customers7d,
        financeActive, overdue, lowStockRows, newsletter, productsCount,
        orders30, leads30, ordersByStatus, recentOrders, recentLeads,
        recentFinance, recentCareer, recentAffApps, topItems, pendFinance, pendCareer, pendAff,
      ] = await Promise.all([
        supabase.from("orders").select("total").gte("created_at", today.toISOString()).neq("status", "cancelled"),
        supabase.from("orders").select("total").gte("created_at", weekAgo.toISOString()).neq("status", "cancelled"),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["new", "pending", "processing"]),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        supabase.from("finance_schedules").select("id", { count: "exact", head: true }).in("status", ["upcoming", "due"]),
        supabase.from("finance_schedules").select("id", { count: "exact", head: true }).eq("status", "overdue"),
        supabase.from("products").select("id, name, stock, low_stock_threshold").lte("stock", 5).order("stock", { ascending: true }).limit(8),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("confirmed", true).eq("unsubscribed", false),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("created_at, total, status").gte("created_at", month.toISOString()),
        supabase.from("leads").select("created_at").gte("created_at", month.toISOString()),
        supabase.from("orders").select("status").gte("created_at", weekAgo.toISOString()),
        supabase.from("orders").select("id, order_number, full_name, total, created_at").order("created_at", { ascending: false }).limit(4),
        supabase.from("leads").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(4),
        supabase.from("finance_applications").select("id, full_name, status, created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("career_applications").select("id, full_name, status, created_at").order("created_at", { ascending: false }).limit(4),
        supabase.from("affiliate_applications").select("id, full_name, status, created_at").order("created_at", { ascending: false }).limit(4),
        supabase.from("order_items").select("product_name, quantity").gte("created_at", weekAgo.toISOString()).limit(500),
        supabase.from("finance_applications").select("id, full_name, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("career_applications").select("id, full_name, created_at").eq("status", "submitted").order("created_at", { ascending: false }).limit(5),
        supabase.from("affiliate_applications").select("id, full_name, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
      ]);

      const sumTotal = (rows: any) => (rows.data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);

      setStats({
        revenueToday: sumTotal(ordersToday),
        revenue7d: sumTotal(orders7d),
        ordersPending: ordersPending.count ?? 0,
        leadsToday: leadsToday.count ?? 0,
        newCustomers7d: customers7d.count ?? 0,
        activeFinance: financeActive.count ?? 0,
        overdueInstallments: overdue.count ?? 0,
        lowStockCount: (lowStockRows.data ?? []).length,
        newsletterSubs: newsletter.count ?? 0,
        totalProducts: productsCount.count ?? 0,
      });

      // 30-day trend
      const byDay = new Map<string, { revenue: number; leads: number }>();
      for (let i = 0; i < 30; i++) {
        const d = new Date(month); d.setDate(d.getDate() + i);
        byDay.set(d.toISOString().slice(0, 10), { revenue: 0, leads: 0 });
      }
      (orders30.data ?? []).forEach((o: any) => {
        const k = new Date(o.created_at).toISOString().slice(0, 10);
        const v = byDay.get(k); if (v) v.revenue += Number(o.total ?? 0);
      });
      (leads30.data ?? []).forEach((l: any) => {
        const k = new Date(l.created_at).toISOString().slice(0, 10);
        const v = byDay.get(k); if (v) v.leads += 1;
      });
      setTrend([...byDay.entries()].map(([day, v]) => ({ day: day.slice(5), revenue: v.revenue, leads: v.leads })));

      // Status slices
      const sm = new Map<string, number>();
      (ordersByStatus.data ?? []).forEach((o: any) => sm.set(o.status, (sm.get(o.status) ?? 0) + 1));
      setStatusSlices([...sm.entries()].map(([name, value]) => ({ name, value })));

      // Activity feed (merge)
      const acts: ActivityItem[] = [
        ...(recentOrders.data ?? []).map((o: any) => ({ id: o.id, kind: "order", title: `Order ${o.order_number}`, subtitle: `${o.full_name} • ${NGN(Number(o.total ?? 0))}`, href: "/admin/orders", at: o.created_at })),
        ...(recentLeads.data ?? []).map((l: any) => ({ id: l.id, kind: "lead", title: "New lead", subtitle: l.full_name, href: "/admin/leads", at: l.created_at })),
        ...(recentFinance.data ?? []).map((f: any) => ({ id: f.id, kind: "finance", title: `Finance: ${f.status}`, subtitle: f.full_name, href: "/admin/finance/applications", at: f.created_at })),
        ...(recentCareer.data ?? []).map((c: any) => ({ id: c.id, kind: "career", title: "Career application", subtitle: c.full_name, href: "/admin/career-applications", at: c.created_at })),
        ...(recentAffApps.data ?? []).map((a: any) => ({ id: a.id, kind: "affiliate", title: "Affiliate signup", subtitle: a.full_name, href: "/admin/affiliates", at: a.created_at })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 10);
      setActivity(acts);

      setLowStock((lowStockRows.data ?? []).map((p: any) => ({ id: p.id, name: p.name, stock: p.stock ?? 0, threshold: p.low_stock_threshold ?? 5 })));

      // Top products (by quantity sold)
      const tp = new Map<string, { revenue: number; qty: number }>();
      (topItems.data ?? []).forEach((i: any) => {
        const cur = tp.get(i.product_name) ?? { revenue: 0, qty: 0 };
        cur.qty += Number(i.quantity ?? 0);
        tp.set(i.product_name, cur);
      });
      setTopProducts([...tp.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 5).map(([name, v]) => ({ name, ...v })));

      // Pending review queue
      const pq: PendingItem[] = [
        ...(pendFinance.data ?? []).map((r: any) => ({ id: r.id, kind: "finance" as const, title: "Finance application", subtitle: r.full_name, created_at: r.created_at, href: "/admin/finance/applications" })),
        ...(pendCareer.data ?? []).map((r: any) => ({ id: r.id, kind: "career" as const, title: "Career application", subtitle: r.full_name, created_at: r.created_at, href: "/admin/career-applications" })),
        ...(pendAff.data ?? []).map((r: any) => ({ id: r.id, kind: "affiliate" as const, title: "Affiliate signup", subtitle: r.full_name, created_at: r.created_at, href: "/admin/affiliates" })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
      setPending(pq);
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Some dashboard data failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel("admin-dashboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, fetchAll)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, fetchAll)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const kpis = useMemo(() => stats ? [
    { label: "Revenue today", value: NGN(stats.revenueToday), icon: TrendingUp, accent: "text-primary", href: "/admin/orders" },
    { label: "Revenue 7d", value: NGN(stats.revenue7d), icon: Wallet, accent: "text-accent", href: "/admin/orders" },
    { label: "Orders pending", value: stats.ordersPending, icon: ShoppingBag, accent: "text-primary", href: "/admin/orders" },
    { label: "Leads today", value: stats.leadsToday, icon: Users, accent: "text-accent", href: "/admin/leads" },
    { label: "New customers 7d", value: stats.newCustomers7d, icon: Users, accent: "text-primary", href: "/admin/customers" },
    { label: "Active finance", value: stats.activeFinance, icon: Wallet, accent: "text-accent", href: "/admin/finance/schedules" },
    { label: "Overdue installments", value: stats.overdueInstallments, icon: AlertTriangle, accent: stats.overdueInstallments > 0 ? "text-destructive" : "text-muted-foreground", href: "/admin/finance/schedules" },
    { label: "Low-stock SKUs", value: stats.lowStockCount, icon: Package, accent: stats.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground", href: "/admin/inventory" },
  ] : [], [stats]);

  return (
    <AdminLayout>
      <AdminSEO title="Dashboard" />
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {kpis.map(k => (
              <Link to={k.href} key={k.label} className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{k.label}</span>
                  <k.icon size={14} className={k.accent} />
                </div>
                <p className="text-xl sm:text-2xl font-display font-bold text-card-foreground truncate">{k.value}</p>
                <ArrowUpRight size={12} className="text-muted-foreground/40 group-hover:text-primary mt-1" />
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "New product", icon: Package, href: "/admin/products" },
              { label: "New blog post", icon: FileText, href: "/admin/blog" },
              { label: "Send newsletter", icon: Send, href: "/admin/newsletter" },
              { label: "Compose email", icon: Mail, href: "/admin/email" },
              { label: "View analytics", icon: Sparkles, href: "/admin/analytics" },
            ].map(a => (
              <Link key={a.label} to={a.href} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/40 hover:text-primary transition-colors">
                <a.icon size={13} /> {a.label}
              </Link>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-card-foreground">Revenue & leads (30d)</h3>
                  <p className="text-xs text-muted-foreground">Daily totals from orders and lead submissions</p>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="r" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="l" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area yAxisId="r" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" name="Revenue (₦)" />
                    <Area yAxisId="l" type="monotone" dataKey="leads" stroke="hsl(var(--accent))" fill="url(#lds)" name="Leads" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h3 className="font-display font-bold text-card-foreground mb-3">Orders by status (7d)</h3>
              {statusSlices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No orders this week</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusSlices} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {statusSlices.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.name] ?? "hsl(var(--muted))"} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Pending review + Activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-card-foreground">Pending review</h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{pending.length} open</span>
              </div>
              <div className="divide-y divide-border">
                {pending.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-center text-muted-foreground">Nothing to review 🎉</p>
                ) : pending.map(p => (
                  <Link key={`${p.kind}-${p.id}`} to={p.href} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                    <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${p.kind === "finance" ? "bg-accent/15 text-accent" : p.kind === "career" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
                      {p.kind === "finance" ? "₦" : p.kind === "career" ? "✦" : "♛"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-card-foreground">Recent activity</h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
              </div>
              <div className="divide-y divide-border">
                {activity.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-center text-muted-foreground">No activity yet</p>
                ) : activity.map(a => (
                  <Link key={`${a.kind}-${a.id}`} to={a.href} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground w-16 shrink-0">{a.kind}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(a.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Top products + Low stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-display font-bold text-card-foreground">Top products (7d)</h3>
              </div>
              <div className="divide-y divide-border">
                {topProducts.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-center text-muted-foreground">No sales this week</p>
                ) : topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{p.name}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{p.qty} sold</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-card-foreground">Low-stock alerts</h3>
                <Link to="/admin/inventory" className="text-xs text-primary hover:underline">Manage</Link>
              </div>
              <div className="divide-y divide-border">
                {lowStock.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-center text-muted-foreground">All stock healthy ✓</p>
                ) : lowStock.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <AlertTriangle size={14} className={p.stock === 0 ? "text-destructive" : "text-accent"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Threshold: {p.threshold}</p>
                    </div>
                    <span className={`text-sm font-bold ${p.stock === 0 ? "text-destructive" : "text-accent"}`}>{p.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isAdmin && stats && (
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-5 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><CheckCircle2 size={18} /></span>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Catalog health</p>
                  <p className="text-xs text-muted-foreground">{stats.totalProducts} products • {stats.newsletterSubs} newsletter subscribers</p>
                </div>
              </div>
              <Link to="/admin/audit-log" className="text-xs text-primary hover:underline">View audit log →</Link>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
