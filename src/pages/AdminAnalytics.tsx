import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Users, Target, DollarSign, MapPin, Calendar, Filter, ArrowUpRight, ArrowDownRight, Globe, Monitor, Smartphone, Tablet, Eye, Download, Activity, AlertTriangle, Gauge } from "lucide-react";

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
  source?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  series: string | null;
  price: string | null;
  is_active: boolean;
}

interface PageView {
  id: string;
  session_id: string;
  page_path: string;
  device_type: string | null;
  created_at: string;
}

interface ProductClick {
  product_id: string;
  created_at: string;
  product_name?: string;
}
interface ConversionRow {
  id: string;
  event_type: string;
  page_path: string | null;
  metadata: any;
  created_at: string;
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

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 };

const AdminAnalytics = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [productClicks, setProductClicks] = useState<ProductClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [perfEvents, setPerfEvents] = useState<ConversionRow[]>([]);
  const [activeTab, setActiveTab] = useState<"leads" | "traffic" | "products" | "performance">("leads");

  useEffect(() => {
    const fetchAll = async () => {
      const [leadsRes, productsRes, pvRes, clicksRes, perfRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: true }),
        supabase.from("products").select("id, name, category, series, price, is_active"),
        supabase.from("page_views").select("id, session_id, page_path, device_type, created_at").order("created_at", { ascending: true }),
        supabase.from("product_clicks").select("product_id, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("conversions").select("id, event_type, page_path, metadata, created_at").in("event_type", ["vitals", "error"]).order("created_at", { ascending: false }).limit(2000),
      ]);
      setLeads((leadsRes.data as Lead[]) ?? []);
      setProducts((productsRes.data as Product[]) ?? []);
      setPageViews((pvRes.data as PageView[]) ?? []);
      setPerfEvents((perfRes.data as ConversionRow[]) ?? []);

      // Enrich clicks with product names
      const prods = (productsRes.data || []) as Product[];
      const enrichedClicks = ((clicksRes.data || []) as ProductClick[]).map(c => ({
        ...c,
        product_name: prods.find(p => p.id === c.product_id)?.name || "Unknown",
      }));
      setProductClicks(enrichedClicks);
      setLoading(false);
    };
    fetchAll();

    // Realtime for leads
    const channel = supabase
      .channel("analytics-leads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        setLeads(prev => [...prev, payload.new as Lead]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filterByPeriod = <T extends { created_at: string }>(items: T[]) => {
    if (period === 0) return items;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return items.filter(i => new Date(i.created_at) >= cutoff);
  };

  const filteredLeads = useMemo(() => filterByPeriod(leads), [leads, period]);
  const filteredPageViews = useMemo(() => filterByPeriod(pageViews), [pageViews, period]);
  const filteredClicks = useMemo(() => filterByPeriod(productClicks), [productClicks, period]);

  // ===== LEAD KPIs =====
  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredLeads.filter(l => l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
  const avgBudget = useMemo(() => {
    const budgets = filteredLeads.map(l => parseBudget(l.budget)).filter(b => b > 0);
    return budgets.length > 0 ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length) : 0;
  }, [filteredLeads]);

  const prevPeriodLeads = useMemo(() => {
    if (period === 0) return 0;
    const cutoffStart = new Date(); cutoffStart.setDate(cutoffStart.getDate() - period * 2);
    const cutoffEnd = new Date(); cutoffEnd.setDate(cutoffEnd.getDate() - period);
    return leads.filter(l => { const d = new Date(l.created_at); return d >= cutoffStart && d < cutoffEnd; }).length;
  }, [leads, period]);

  const leadGrowth = prevPeriodLeads > 0 ? (((totalLeads - prevPeriodLeads) / prevPeriodLeads) * 100).toFixed(0) : totalLeads > 0 ? "100" : "0";

  // ===== TRAFFIC KPIs =====
  const totalPageViews = filteredPageViews.length;
  const uniqueSessions = useMemo(() => new Set(filteredPageViews.map(pv => pv.session_id)).size, [filteredPageViews]);
  const pagesPerSession = uniqueSessions > 0 ? (totalPageViews / uniqueSessions).toFixed(1) : "0";

  // Active now (sessions in last 5 min)
  const activeNow = useMemo(() => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Set(pageViews.filter(pv => new Date(pv.created_at) >= fiveMinAgo).map(pv => pv.session_id)).size;
  }, [pageViews]);

  // Traffic by page
  const trafficByPage = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPageViews.forEach(pv => { map[pv.page_path] = (map[pv.page_path] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredPageViews]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const map: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    filteredPageViews.forEach(pv => {
      const d = pv.device_type || "desktop";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [filteredPageViews]);

  // Traffic trend
  const trafficTrend = useMemo(() => {
    const map: Record<string, { views: number; sessions: Set<string> }> = {};
    const useWeekly = period > 30 || period === 0;
    filteredPageViews.forEach(pv => {
      const d = new Date(pv.created_at);
      const key = useWeekly ? getWeekLabel(d) : `${d.getMonth() + 1}/${d.getDate()}`;
      if (!map[key]) map[key] = { views: 0, sessions: new Set() };
      map[key].views++;
      map[key].sessions.add(pv.session_id);
    });
    return Object.entries(map).map(([date, { views, sessions }]) => ({ date, views, sessions: sessions.size }));
  }, [filteredPageViews, period]);

  // ===== LEAD CHARTS =====
  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    const useWeekly = period > 30 || period === 0;
    filteredLeads.forEach(l => {
      const d = new Date(l.created_at);
      const key = useWeekly ? getWeekLabel(d) : `${d.getMonth() + 1}/${d.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, leads: count }));
  }, [filteredLeads, period]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => { map[l.status] = (map[l.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [filteredLeads]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => { l.products.forEach(p => { map[p] = (map[p] || 0) + 1; }); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredLeads]);

  const budgetData = useMemo(() => {
    const ranges = [
      { label: "Under 500K", min: 0, max: 500000 },
      { label: "500K - 1M", min: 500000, max: 1000000 },
      { label: "1M - 3M", min: 1000000, max: 3000000 },
      { label: "3M - 5M", min: 3000000, max: 5000000 },
      { label: "5M - 10M", min: 5000000, max: 10000000 },
      { label: "10M+", min: 10000000, max: Infinity },
    ];
    return ranges.map(r => ({
      range: r.label,
      count: filteredLeads.filter(l => { const b = parseBudget(l.budget); return b > 0 && b >= r.min && b < r.max; }).length,
    }));
  }, [filteredLeads]);

  const locationData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => {
      if (l.location) {
        const parts = l.location.split(",");
        const city = parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
        map[city.substring(0, 25)] = (map[city.substring(0, 25)] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredLeads]);

  const timelineData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => { if (l.timeline) map[l.timeline] = (map[l.timeline] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const funnelData = useMemo(() => {
    const total = filteredLeads.length;
    const contacted = filteredLeads.filter(l => ["contacted", "converted", "closed"].includes(l.status)).length;
    const converted = filteredLeads.filter(l => l.status === "converted").length;
    return [
      { stage: "Leads Captured", value: total },
      { stage: "Contacted", value: contacted },
      { stage: "Converted", value: converted },
    ];
  }, [filteredLeads]);

  const productCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { if (p.is_active) map[p.category] = (map[p.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [products]);

  const electricityData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => { if (l.has_electricity) map[l.has_electricity] = (map[l.has_electricity] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const applianceData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => {
      l.appliances?.forEach(a => { const name = a.replace(/\s*\(.*\)/, "").trim(); map[name] = (map[name] || 0) + 1; });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredLeads]);

  // Source data
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => { const s = l.source || "website_form"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), value }));
  }, [filteredLeads]);

  // Product clicks
  const topClickedProducts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredClicks.forEach(c => { if (c.product_name) map[c.product_name] = (map[c.product_name] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredClicks]);

  const dailyLeadsLast7 = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      result.push({
        day: d.toLocaleDateString("en", { weekday: "short" }),
        count: leads.filter(l => { const ld = new Date(l.created_at); return ld >= d && ld < next; }).length,
      });
    }
    return result;
  }, [leads]);

  const kpis = [
    { label: "Total Leads", value: totalLeads, icon: Users, change: `${Number(leadGrowth) >= 0 ? "+" : ""}${leadGrowth}%`, positive: Number(leadGrowth) >= 0, sub: "vs previous period" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: Target, change: `${convertedLeads} converted`, positive: true, sub: "of total leads" },
    { label: "Avg Budget", value: avgBudget > 0 ? `₦${avgBudget.toLocaleString()}` : "N/A", icon: DollarSign, change: "", positive: true, sub: "per lead" },
    { label: "Active Products", value: products.filter(p => p.is_active).length, icon: TrendingUp, change: `${productCategoryData.length} categories`, positive: true, sub: "in catalog" },
  ];

  const trafficKpis = [
    { label: "Page Views", value: totalPageViews.toLocaleString(), icon: Eye, change: "", positive: true, sub: "total views" },
    { label: "Unique Sessions", value: uniqueSessions.toLocaleString(), icon: Globe, change: `${pagesPerSession} pages/session`, positive: true, sub: "unique visitors" },
    { label: "Active Now", value: activeNow, icon: Users, change: "", positive: true, sub: "in last 5 min" },
    { label: "Inquiries", value: filteredClicks.length, icon: Target, change: `${topClickedProducts.length} products`, positive: true, sub: "WhatsApp clicks" },
  ];

  const exportAnalyticsCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Leads", String(totalLeads)],
      ["Conversion Rate", `${conversionRate}%`],
      ["Avg Budget", avgBudget > 0 ? `₦${avgBudget}` : "N/A"],
      ["Total Page Views", String(totalPageViews)],
      ["Unique Sessions", String(uniqueSessions)],
      ["Pages Per Session", pagesPerSession],
      ...statusData.map(s => [`Status: ${s.name}`, String(s.value)]),
      ...locationData.map(l => [`Location: ${l.name}`, String(l.value)]),
    ];
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ===== PERFORMANCE / ERROR ANALYTICS =====
  const filteredPerf = useMemo(() => filterByPeriod(perfEvents), [perfEvents, period]);
  const vitals = useMemo(() => filteredPerf.filter(e => e.event_type === "vitals"), [filteredPerf]);
  const errors = useMemo(() => filteredPerf.filter(e => e.event_type === "error"), [filteredPerf]);

  // Vitals trend by date (avg per metric per day)
  const vitalsTrend = useMemo(() => {
    const map: Record<string, { LCP: number[]; INP: number[]; CLS: number[] }> = {};
    vitals.forEach(v => {
      const d = new Date(v.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!map[key]) map[key] = { LCP: [], INP: [], CLS: [] };
      const m = v.metadata?.metric as "LCP" | "INP" | "CLS" | undefined;
      const val = Number(v.metadata?.value);
      if (m && map[key][m] && !Number.isNaN(val)) map[key][m].push(val);
    });
    return Object.entries(map).map(([date, vals]) => ({
      date,
      LCP: vals.LCP.length ? Math.round(vals.LCP.reduce((a, b) => a + b, 0) / vals.LCP.length) : 0,
      INP: vals.INP.length ? Math.round(vals.INP.reduce((a, b) => a + b, 0) / vals.INP.length) : 0,
      CLS: vals.CLS.length ? +(vals.CLS.reduce((a, b) => a + b, 0) / vals.CLS.length).toFixed(3) : 0,
    }));
  }, [vitals]);

  const avgVital = (name: "LCP" | "INP" | "CLS") => {
    const vs = vitals.filter(v => v.metadata?.metric === name).map(v => Number(v.metadata?.value)).filter(n => !Number.isNaN(n));
    if (!vs.length) return null;
    return vs.reduce((a, b) => a + b, 0) / vs.length;
  };
  const avgLCP = avgVital("LCP");
  const avgINP = avgVital("INP");
  const avgCLS = avgVital("CLS");

  const rateVital = (name: "LCP" | "INP" | "CLS", v: number | null) => {
    if (v == null) return "—";
    if (name === "LCP") return v <= 2500 ? "good" : v <= 4000 ? "needs work" : "poor";
    if (name === "INP") return v <= 200 ? "good" : v <= 500 ? "needs work" : "poor";
    return v <= 0.1 ? "good" : v <= 0.25 ? "needs work" : "poor";
  };

  // Errors trend by date
  const errorTrend = useMemo(() => {
    const map: Record<string, number> = {};
    errors.forEach(e => {
      const d = new Date(e.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, errors: count }));
  }, [errors]);

  // Top failing routes (by error count)
  const topFailingRoutes = useMemo(() => {
    const map: Record<string, number> = {};
    errors.forEach(e => { const p = e.page_path || "unknown"; map[p] = (map[p] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [errors]);

  // Top failing components / messages
  const topFailingComponents = useMemo(() => {
    const map: Record<string, number> = {};
    errors.forEach(e => {
      const msg = (e.metadata?.message || "Unknown error").toString().slice(0, 80);
      // Try to extract component from stack
      const stack = (e.metadata?.stack || "") as string;
      const compMatch = stack.match(/at\s+([A-Z]\w+)/);
      const key = compMatch ? `${compMatch[1]} — ${msg}` : msg;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [errors]);

  // Worst LCP routes
  const worstLcpRoutes = useMemo(() => {
    const map: Record<string, number[]> = {};
    vitals.filter(v => v.metadata?.metric === "LCP").forEach(v => {
      const p = v.page_path || "unknown";
      const val = Number(v.metadata?.value);
      if (!Number.isNaN(val)) (map[p] = map[p] || []).push(val);
    });
    return Object.entries(map).map(([name, arr]) => ({ name, value: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
  }, [vitals]);

  const perfKpis = [
    { label: "Avg LCP", value: avgLCP != null ? `${Math.round(avgLCP)} ms` : "—", icon: Gauge, sub: rateVital("LCP", avgLCP) },
    { label: "Avg INP", value: avgINP != null ? `${Math.round(avgINP)} ms` : "—", icon: Activity, sub: rateVital("INP", avgINP) },
    { label: "Avg CLS", value: avgCLS != null ? avgCLS.toFixed(3) : "—", icon: Eye, sub: rateVital("CLS", avgCLS) },
    { label: "Total Errors", value: errors.length, icon: AlertTriangle, sub: `${topFailingRoutes.length} routes affected` },
  ];

  const tabs = [
    { key: "leads" as const, label: "Lead Analytics" },
    { key: "traffic" as const, label: "Site Traffic" },
    { key: "products" as const, label: "Product Insights" },
    { key: "performance" as const, label: "Performance" },
  ];

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={16} className="text-muted-foreground" />
              {periodOptions.map(opt => (
                <button key={opt.value} onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={exportAnalyticsCSV} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all">
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ===== LEADS TAB ===== */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(kpi => (
                  <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      <kpi.icon size={16} className="text-primary" />
                    </div>
                    <p className="text-2xl font-display font-bold text-card-foreground">{kpi.value}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {kpi.change && (
                        <>
                          {kpi.positive ? <ArrowUpRight size={12} className="text-emerald-500" /> : <ArrowDownRight size={12} className="text-red-500" />}
                          <span className={kpi.positive ? "text-emerald-500" : "text-red-500"}>{kpi.change}</span>
                        </>
                      )}
                      <span className="text-muted-foreground">{kpi.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trend + Funnel */}
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
                        <Tooltip contentStyle={tooltipStyle} />
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
                            <div className="h-full rounded-lg transition-all" style={{ width: `${Math.max(pct, 2)}%`, background: COLORS[i] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {totalLeads > 0 && <p className="text-xs text-muted-foreground mt-4">{conversionRate}% of leads converted to customers</p>}
                </div>
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Product Interest</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                        <Tooltip contentStyle={tooltipStyle} />
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
                            {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground">No data</p>}
                  </div>
                </div>
              </div>

              {/* Budget + Location */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Budget Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} />
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
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No location data</p>}
                  </div>
                </div>
              </div>

              {/* Timeline + Electricity + Source */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Purchase Timeline</h3>
                  <div className="space-y-2">
                    {timelineData.length > 0 ? timelineData.map(t => (
                      <div key={t.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(t.value / totalLeads) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-card-foreground w-6 text-right">{t.value}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No timeline data</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Electricity Access</h3>
                  <div className="h-48 flex items-center justify-center">
                    {electricityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={electricityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {electricityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground">No data</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Lead Source</h3>
                  <div className="space-y-2">
                    {sourceData.length > 0 ? sourceData.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(s.value / (sourceData[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs font-medium text-card-foreground w-5 text-right">{s.value}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No source data</p>}
                  </div>
                </div>
              </div>

              {/* Appliances + Weekly */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Appliances</h3>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {applianceData.length > 0 ? applianceData.map((a, i) => (
                      <div key={a.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">{a.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(a.value / (applianceData[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs font-medium text-card-foreground w-5 text-right">{a.value}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No appliance data</p>}
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
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== TRAFFIC TAB ===== */}
          {activeTab === "traffic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {trafficKpis.map(kpi => (
                  <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      <kpi.icon size={16} className="text-primary" />
                    </div>
                    <p className="text-2xl font-display font-bold text-card-foreground">{kpi.value}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {kpi.change && <span className="text-muted-foreground">{kpi.change}</span>}
                      <span className="text-muted-foreground">{kpi.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Traffic trend */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-card-foreground mb-4">Traffic Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficTrend}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} name="Page Views" />
                      <Area type="monotone" dataKey="sessions" stroke="#6366f1" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Sessions" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Traffic by page + Device */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Pages</h3>
                  <div className="h-64">
                    {trafficByPage.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trafficByPage} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No traffic data yet</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Device Breakdown</h3>
                  <div className="h-64 flex items-center justify-center">
                    {deviceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground">No device data yet</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== PRODUCTS TAB ===== */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Products by Category</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={productCategoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine>
                          {productCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Most Inquired Products</h3>
                  <div className="h-64">
                    {topClickedProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topClickedProducts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={120} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No inquiry data yet. Clicks on "Chat to Order" will appear here.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAnalytics;
