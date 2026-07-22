import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminSEO from "@/components/AdminSEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag, Users, FileText, Loader2, Sun, Wallet, Ticket, TrendingUp, ArrowUpRight, Clock, MessageSquare,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const NGN = (n: number) => `₦${(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d.toISOString(); };

interface Stats {
  ordersToday: number;
  ordersPending: number;
  revenueToday: number;
  leadsToday: number;
  leadsNew: number;
  ticketsOpen: number;
  ticketsInProgress: number;
  assessmentsPending: number;
  customRequestsOpen: number;
}

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<{ day: string; orders: number; leads: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [openTickets, setOpenTickets] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const since14 = daysAgo(13);
    const t0 = todayStart();
    try {
      const [
        ordersRes, leadsRes, ticketsRes, assessRes, customRes,
      ] = await Promise.all([
        supabase.from("orders").select("id,total,status,payment_status,created_at,full_name,phone").gte("created_at", since14).order("created_at", { ascending: false }).limit(500),
        supabase.from("leads").select("id,full_name,phone,location,status,created_at,source").gte("created_at", since14).order("created_at", { ascending: false }).limit(500),
        supabase.from("support_tickets" as any).select("id,ticket_number,user_name,user_contact,subject,message,status,created_at").in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(20),
        supabase.from("solar_assessments").select("id,status").in("status", ["basic", "full"]).limit(1000),
        supabase.from("custom_solution_requests").select("id,status").in("status", ["new", "contacted"]).limit(1000),
      ]);

      const orders = ordersRes.data || [];
      const leads = leadsRes.data || [];
      const tickets = (ticketsRes.data as any[]) || [];

      // trend
      const daysMap: Record<string, { day: string; orders: number; leads: number }> = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        daysMap[k] = { day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), orders: 0, leads: 0 };
      }
      orders.forEach((o) => { const k = o.created_at.slice(0, 10); if (daysMap[k]) daysMap[k].orders++; });
      leads.forEach((l) => { const k = l.created_at.slice(0, 10); if (daysMap[k]) daysMap[k].leads++; });

      setStats({
        ordersToday: orders.filter((o) => o.created_at >= t0).length,
        ordersPending: orders.filter((o) => o.status === "new" || o.status === "pending" || o.payment_status === "pending").length,
        revenueToday: orders.filter((o) => o.created_at >= t0 && o.payment_status === "paid").reduce((s, o) => s + Number(o.total || 0), 0),
        leadsToday: leads.filter((l) => l.created_at >= t0).length,
        leadsNew: leads.filter((l) => l.status === "new").length,
        ticketsOpen: tickets.filter((t) => t.status === "open").length,
        ticketsInProgress: tickets.filter((t) => t.status === "in_progress").length,
        assessmentsPending: assessRes.data?.length || 0,
        customRequestsOpen: customRes.data?.length || 0,
      });
      setTrend(Object.values(daysMap));
      setRecentOrders(orders.slice(0, 8));
      setRecentLeads(leads.slice(0, 8));
      setOpenTickets(tickets.slice(0, 8));
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(() => stats ? [
    { icon: ShoppingBag, label: "Orders today", value: stats.ordersToday.toString(), href: "/admin/orders", accent: "text-primary" },
    { icon: Wallet, label: "Revenue today", value: NGN(stats.revenueToday), href: "/admin/orders?status=paid", accent: "text-emerald-600" },
    { icon: Clock, label: "Orders needing action", value: stats.ordersPending.toString(), href: "/admin/orders?status=pending", accent: "text-amber-600" },
    { icon: Users, label: "Leads today", value: stats.leadsToday.toString(), href: "/admin/leads", accent: "text-primary" },
    { icon: Users, label: "New leads to work", value: stats.leadsNew.toString(), href: "/admin/leads", accent: "text-amber-600" },
    { icon: Ticket, label: "Open tickets", value: stats.ticketsOpen.toString(), href: "/admin/tickets", accent: "text-red-600" },
    { icon: MessageSquare, label: "Tickets in progress", value: stats.ticketsInProgress.toString(), href: "/admin/tickets", accent: "text-amber-600" },
    { icon: Sun, label: "Pending assessments", value: stats.assessmentsPending.toString(), href: "/admin/assessments", accent: "text-primary" },
    { icon: FileText, label: "Open custom requests", value: stats.customRequestsOpen.toString(), href: "/admin/custom-requests", accent: "text-primary" },
  ] : [], [stats]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminSEO title="Staff Dashboard" />
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Staff Workspace</h1>
            <p className="text-sm text-muted-foreground">Daily queue: orders, leads, tickets, and customer requests.</p>
          </div>
          <Badge variant="outline" className="text-xs">Staff view</Badge>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
          {cards.map((c) => (
            <Link key={c.label} to={c.href} className="group">
              <Card className="p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between">
                  <c.icon size={18} className={c.accent} />
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-60 transition" />
                </div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2">{c.label}</p>
                <p className="text-xl md:text-2xl font-display font-bold mt-0.5 truncate">{c.value}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Trend */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="font-display font-bold">Orders & leads · last 14 days</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="ord" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" fill="url(#ord)" />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--accent))" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Queues */}
        <div className="grid lg:grid-cols-3 gap-4">
          <QueueCard title="Recent orders" href="/admin/orders" empty="No recent orders">
            {recentOrders.map((o) => (
              <Link key={o.id} to={`/admin/orders?id=${o.id}`} className="flex items-center justify-between py-2 border-t border-border first:border-t-0 hover:bg-muted/40 -mx-2 px-2 rounded">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{o.full_name || "Guest"}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{NGN(Number(o.total || 0))}</p>
                  <Badge variant="outline" className="text-[10px]">{o.payment_status}</Badge>
                </div>
              </Link>
            ))}
          </QueueCard>

          <QueueCard title="Recent leads" href="/admin/leads" empty="No recent leads">
            {recentLeads.map((l) => (
              <Link key={l.id} to={`/admin/leads`} className="flex items-center justify-between py-2 border-t border-border first:border-t-0 hover:bg-muted/40 -mx-2 px-2 rounded">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{l.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{l.phone} · {l.location}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{l.status}</Badge>
              </Link>
            ))}
          </QueueCard>

          <QueueCard title="Open tickets" href="/admin/tickets" empty="No open tickets">
            {openTickets.map((t) => (
              <Link key={t.id} to="/admin/tickets" className="flex items-center justify-between py-2 border-t border-border first:border-t-0 hover:bg-muted/40 -mx-2 px-2 rounded">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.user_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.subject || t.message}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${t.status === "open" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>{t.status.replace("_", " ")}</Badge>
              </Link>
            ))}
          </QueueCard>
        </div>
      </div>
    </AdminLayout>
  );
};

const QueueCard = ({ title, href, empty, children }: { title: string; href: string; empty: string; children: React.ReactNode }) => {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.filter(Boolean).length > 0;
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-sm">{title}</h3>
        <Link to={href} className="text-xs text-primary hover:underline">View all</Link>
      </div>
      {hasItems ? <div className="text-sm">{children}</div> : <p className="text-xs text-muted-foreground py-6 text-center">{empty}</p>}
    </Card>
  );
};

export default StaffDashboard;
