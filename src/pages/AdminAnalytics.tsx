import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Users, Target, DollarSign, MapPin, Calendar, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  location: string;
  products: string[];
  budget: string | null;
  status: string;
  created_at: string;
  has_electricity: string | null;
  main_goal: string | null;
  appliances: string[] | null;
  timeline: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  series: string | null;
  price: string | null;
  is_active: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const periodOptions = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "All Time", value: 0 },
];

function parseBudget(b: string | null): number {
  if (!b) return 0;
  const cleaned = b.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return `${start.getMonth() + 1}/${start.getDate()}`;
}

const AdminAnalytics = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetch = async () => {
      const [leadsRes, productsRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: true }),
        supabase.from("products").select("id, name, category, series, price, is_active"),
      ]);
      setLeads((leadsRes.data as Lead[]) ?? []);
      setProducts((productsRes.data as Product[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filteredLeads = useMemo(() => {
    if (period === 0) return leads;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return leads.filter((l) => new Date(l.created_at) >= cutoff);
  }, [leads, period]);

  // KPIs
  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredLeads.filter((l) => l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
  const avgBudget = useMemo(() => {
    const budgets = filteredLeads.map((l) => parseBudget(l.budget)).filter((b) => b > 0);
    if (budgets.length === 0) return 0;
    return Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length);
  }, [filteredLeads]);

  // Previous period comparison
  const prevPeriodLeads = useMemo(() => {
    if (period === 0) return 0;
    const cutoffStart = new Date();
    cutoffStart.setDate(cutoffStart.getDate() - period * 2);
    const cutoffEnd = new Date();
    cutoffEnd.setDate(cutoffEnd.getDate() - period);
    return leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= cutoffStart && d < cutoffEnd;
    }).length;
  }, [leads, period]);

  const leadGrowth = prevPeriodLeads > 0 ? (((totalLeads - prevPeriodLeads) / prevPeriodLeads) * 100).toFixed(0) : totalLeads > 0 ? "100" : "0";

  // Lead trend (daily/weekly)
  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    const useWeekly = period > 30 || period === 0;
    filteredLeads.forEach((l) => {
      const d = new Date(l.created_at);
      const key = useWeekly ? getWeekLabel(d) : `${d.getMonth() + 1}/${d.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, leads: count }));
  }, [filteredLeads, period]);

  // Status distribution
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      map[l.status] = (map[l.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [filteredLeads]);

  // Category interest
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      l.products.forEach((p) => {
        map[p] = (map[p] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredLeads]);

  // Budget distribution
  const budgetData = useMemo(() => {
    const ranges = [
      { label: "Under 500K", min: 0, max: 500000 },
      { label: "500K - 1M", min: 500000, max: 1000000 },
      { label: "1M - 3M", min: 1000000, max: 3000000 },
      { label: "3M - 5M", min: 3000000, max: 5000000 },
      { label: "5M - 10M", min: 5000000, max: 10000000 },
      { label: "10M+", min: 10000000, max: Infinity },
    ];
    return ranges.map((r) => ({
      range: r.label,
      count: filteredLeads.filter((l) => {
        const b = parseBudget(l.budget);
        return b > 0 && b >= r.min && b < r.max;
      }).length,
    }));
  }, [filteredLeads]);

  // Location (top cities)
  const locationData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      if (l.location) {
        // Extract city-level from address
        const parts = l.location.split(",");
        const city = parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
        const key = city.substring(0, 25);
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredLeads]);

  // Timeline preference
  const timelineData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      if (l.timeline) map[l.timeline] = (map[l.timeline] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Conversion funnel
  const funnelData = useMemo(() => {
    const total = filteredLeads.length;
    const contacted = filteredLeads.filter((l) => ["contacted", "converted", "closed"].includes(l.status)).length;
    const converted = filteredLeads.filter((l) => l.status === "converted").length;
    return [
      { stage: "Leads Captured", value: total },
      { stage: "Contacted", value: contacted },
      { stage: "Converted", value: converted },
    ];
  }, [filteredLeads]);

  // Products by category
  const productCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      if (p.is_active) map[p.category] = (map[p.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [products]);

  // Electricity access (solar leads)
  const electricityData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      if (l.has_electricity) map[l.has_electricity] = (map[l.has_electricity] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Top appliances
  const applianceData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      l.appliances?.forEach((a) => {
        const name = a.replace(/\s*\(.*\)/, "").trim();
        map[name] = (map[name] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredLeads]);

  // Daily leads for sparkline on KPI card
  const dailyLeadsLast7 = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      result.push({
        day: d.toLocaleDateString("en", { weekday: "short" }),
        count: leads.filter((l) => {
          const ld = new Date(l.created_at);
          return ld >= d && ld < next;
        }).length,
      });
    }
    return result;
  }, [leads]);

  const kpis = [
    {
      label: "Total Leads",
      value: totalLeads,
      icon: Users,
      change: `${Number(leadGrowth) >= 0 ? "+" : ""}${leadGrowth}%`,
      positive: Number(leadGrowth) >= 0,
      sub: "vs previous period",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: Target,
      change: `${convertedLeads} converted`,
      positive: true,
      sub: "of total leads",
    },
    {
      label: "Avg Budget",
      value: avgBudget > 0 ? `₦${avgBudget.toLocaleString()}` : "N/A",
      icon: DollarSign,
      change: "",
      positive: true,
      sub: "per lead",
    },
    {
      label: "Active Products",
      value: products.filter((p) => p.is_active).length,
      icon: TrendingUp,
      change: `${productCategoryData.length} categories`,
      positive: true,
      sub: "in catalog",
    },
  ];

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Period filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-muted-foreground" />
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <kpi.icon size={16} className="text-primary" />
                </div>
                <p className="text-2xl font-display font-bold text-card-foreground">{kpi.value}</p>
                <div className="flex items-center gap-1 text-xs">
                  {kpi.change && (
                    <>
                      {kpi.positive ? (
                        <ArrowUpRight size={12} className="text-emerald-500" />
                      ) : (
                        <ArrowDownRight size={12} className="text-red-500" />
                      )}
                      <span className={kpi.positive ? "text-emerald-500" : "text-red-500"}>{kpi.change}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">{kpi.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Row 1: Lead Trend + Conversion Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Lead Acquisition Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="url(#leadGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Conversion Funnel</h3>
              <div className="space-y-3">
                {funnelData.map((stage, i) => {
                  const maxVal = funnelData[0]?.value || 1;
                  const pct = maxVal > 0 ? (stage.value / maxVal) * 100 : 0;
                  return (
                    <div key={stage.stage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{stage.stage}</span>
                        <span className="font-medium text-card-foreground">{stage.value}</span>
                      </div>
                      <div className="h-6 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all"
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            background: COLORS[i],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalLeads > 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                  {conversionRate}% of leads converted to customers
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Category Interest + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Product Interest</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Lead Status Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Budget Distribution + Location */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Budget Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Top Locations</h3>
              <div className="h-64">
                {locationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={120} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No location data</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Timeline + Electricity + Appliances */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Purchase Timeline</h3>
              <div className="space-y-2">
                {timelineData.length > 0 ? (
                  timelineData.map((t) => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(t.value / totalLeads) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-card-foreground w-6 text-right">{t.value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No timeline data</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Electricity Access</h3>
              <div className="h-48 flex items-center justify-center">
                {electricityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={electricityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {electricityData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Top Appliances</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {applianceData.length > 0 ? (
                  applianceData.map((a, i) => (
                    <div key={a.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{a.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(a.value / (applianceData[0]?.value || 1)) * 100}%`,
                              background: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-card-foreground w-5 text-right">{a.value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No appliance data</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 5: Product Catalog + Weekly sparkline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Products by Category</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={productCategoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine>
                      {productCategoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-card-foreground mb-4">Last 7 Days Activity</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyLeadsLast7}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAnalytics;
