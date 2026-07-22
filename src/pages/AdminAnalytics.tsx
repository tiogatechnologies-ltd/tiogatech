import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Target, DollarSign, Filter, ArrowUpRight, ArrowDownRight, Globe, Eye, Download, Activity, AlertTriangle, Gauge, ShoppingCart, Percent, Clock, MousePointerClick, Repeat } from "lucide-react";

// ---------- Types ----------
interface Lead {
  id: string; full_name: string; phone: string; email: string | null;
  location: string; products: string[]; budget: string | null; status: string;
  created_at: string; has_electricity: string | null; main_goal: string | null;
  appliances: string[] | null; timeline: string | null; source?: string;
  utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; referrer?: string | null;
}
interface Product { id: string; name: string; category: string; series: string | null; price: string | null; is_active: boolean; }
interface PageView {
  id: string; session_id: string; page_path: string;
  device_type: string | null; created_at: string;
  referrer?: string | null; country?: string | null;
  utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
  landing_path?: string | null; is_new_session?: boolean | null;
}
interface ProductClick { product_id: string; created_at: string; product_name?: string; }
interface ConversionRow { id: string; session_id: string; event_type: string; page_path: string | null; metadata: any; created_at: string; }
interface OrderRow {
  id: string; order_number: string | null; total: number | null; subtotal: number | null;
  discount_amount: number | null; discount_code: string | null;
  status: string | null; payment_status: string | null; payment_method: string | null;
  source: string | null; created_at: string; shipping_address: any;
}
interface OrderItemRow { order_id: string; product_name: string; product_type: string | null; price_label: string | null; quantity: number; }
interface DiscountRedemption { discount_id: string; amount_discounted: number | null; created_at: string; }

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];
const periodOptions = [
  { label: "7 Days", value: 7 }, { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 }, { label: "All Time", value: 0 },
];
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 } as const;

// ---------- Helpers ----------
/** Robust budget parser — handles ranges like "500K-1M", "₦1,200,000", "over 5M". Returns midpoint or single value. */
function parseBudget(b: string | null): number {
  if (!b) return 0;
  const s = b.toLowerCase().replace(/,/g, "").replace(/naira|ngn|₦|about|over|around|approx\.?|~/g, "");
  const toNum = (raw: string): number => {
    const m = raw.trim().match(/([\d.]+)\s*([km]?)/i);
    if (!m) return 0;
    let n = parseFloat(m[1]) || 0;
    if (m[2]?.toLowerCase() === "k") n *= 1_000;
    if (m[2]?.toLowerCase() === "m") n *= 1_000_000;
    return n;
  };
  const range = s.match(/([\d.]+\s*[km]?)\s*[-–to]+\s*([\d.]+\s*[km]?)/i);
  if (range) return (toNum(range[1]) + toNum(range[2])) / 2;
  const single = toNum(s);
  return single;
}

function getWeekLabel(date: Date): string {
  const start = new Date(date); start.setDate(start.getDate() - start.getDay());
  return `${start.getMonth() + 1}/${start.getDate()}`;
}

/** Extract Nigerian city / state from free-form location text. */
function normalizeLocation(loc: string): string {
  if (!loc) return "Unknown";
  const s = loc.toLowerCase();
  const cities: Array<[RegExp, string]> = [
    [/lagos|ikeja|lekki|ajah|victoria island|vi\b|ikoyi|surulere|yaba|ibeju/, "Lagos"],
    [/abuja|fct|gwarinpa|maitama|garki|wuse|asokoro|kubwa|lugbe/, "Abuja"],
    [/jos|plateau/, "Jos"],
    [/port harcourt|ph\b|rivers/, "Port Harcourt"],
    [/kaduna/, "Kaduna"], [/kano/, "Kano"], [/ibadan|oyo/, "Ibadan"],
    [/benin|edo/, "Benin"], [/enugu/, "Enugu"], [/onitsha|anambra|awka/, "Anambra"],
    [/warri|delta/, "Warri"], [/uyo|akwa/, "Uyo"], [/calabar|cross river/, "Calabar"],
    [/asaba/, "Asaba"], [/owerri|imo/, "Owerri"], [/abeokuta|ogun/, "Abeokuta"],
    [/ilorin|kwara/, "Ilorin"], [/maiduguri|borno/, "Maiduguri"], [/sokoto/, "Sokoto"],
    [/bauchi/, "Bauchi"], [/minna|niger/, "Minna"], [/makurdi|benue/, "Makurdi"],
  ];
  for (const [re, name] of cities) if (re.test(s)) return name;
  // Fallback to first comma segment
  return loc.split(",")[0].trim().slice(0, 25) || "Unknown";
}

/** Parse ₦-labelled string like "₦1,200,000" or "1.2m". */
function parseNaira(v: string | null | undefined): number {
  if (!v) return 0;
  const s = String(v).toLowerCase().replace(/[,₦\s]/g, "").replace(/naira|ngn/g, "");
  const m = s.match(/([\d.]+)\s*([km]?)/);
  if (!m) return 0;
  let n = parseFloat(m[1]) || 0;
  if (m[2] === "k") n *= 1_000;
  if (m[2] === "m") n *= 1_000_000;
  return n;
}

function extractState(addr: any): string {
  if (!addr) return "Unknown";
  if (typeof addr === "string") return addr;
  return addr.state || addr.province || addr.region || "Unknown";
}

function formatNGN(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${Math.round(n).toLocaleString()}`;
}

// ---------- Component ----------
const AdminAnalytics = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [productClicks, setProductClicks] = useState<ProductClick[]>([]);
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [redemptions, setRedemptions] = useState<DiscountRedemption[]>([]);
  const [perfEvents, setPerfEvents] = useState<ConversionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [searchParams, setSearchParams] = useSearchParams();
  type TabKey = "leads" | "revenue" | "traffic" | "funnels" | "products" | "performance";
  const validTabs: TabKey[] = ["leads", "revenue", "traffic", "funnels", "products", "performance"];
  const urlTab = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = urlTab && validTabs.includes(urlTab) ? urlTab : "leads";
  const setActiveTab = (t: TabKey) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", t);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const fetchAll = async () => {
      const since = new Date();
      since.setDate(since.getDate() - (period === 0 ? 365 : Math.max(period, 180)));
      const sinceIso = since.toISOString();

      // Generic pager to bypass PostgREST 1000-row default
      const pageAll = async <T,>(
        build: (from: number, to: number) => any,
        pageSize = 1000, maxPages = 20
      ): Promise<T[]> => {
        const all: T[] = [];
        let from = 0;
        for (let i = 0; i < maxPages; i++) {
          const { data, error } = await build(from, from + pageSize - 1);
          if (error || !data || data.length === 0) break;
          all.push(...(data as T[]));
          if (data.length < pageSize) break;
          from += pageSize;
        }
        return all;
      };

      const pvPromise = pageAll<PageView>((from, to) => {
        let q = supabase
          .from("page_views")
          .select("id, session_id, page_path, device_type, created_at, referrer, country, utm_source, utm_medium, utm_campaign, landing_path, is_new_session")
          .order("created_at", { ascending: false })
          .range(from, to);
        if (period !== 0) q = q.gte("created_at", sinceIso);
        return q;
      });

      const convPromise = pageAll<ConversionRow>((from, to) => {
        let q = supabase
          .from("conversions")
          .select("id, session_id, event_type, page_path, metadata, created_at")
          .order("created_at", { ascending: false })
          .range(from, to);
        if (period !== 0) q = q.gte("created_at", sinceIso);
        return q;
      });

      const ordersPromise = pageAll<OrderRow>((from, to) => {
        let q = supabase
          .from("orders")
          .select("id, order_number, total, subtotal, discount_amount, discount_code, status, payment_status, payment_method, source, created_at, shipping_address")
          .order("created_at", { ascending: false })
          .range(from, to);
        if (period !== 0) q = q.gte("created_at", sinceIso);
        return q;
      });

      const [leadsRes, productsRes, pvAll, clicksRes, convAll, ordersAll, redRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: true }),
        supabase.from("products").select("id, name, category, series, price, is_active"),
        pvPromise,
        supabase.from("product_clicks").select("product_id, created_at").order("created_at", { ascending: false }).limit(1000),
        convPromise,
        ordersPromise,
        supabase.from("discount_redemptions").select("discount_id, amount_discounted, created_at").order("created_at", { ascending: false }).limit(1000),
      ]);

      // Fetch order items for the fetched orders (bounded)
      const orderIds = ordersAll.map(o => o.id);
      let items: OrderItemRow[] = [];
      if (orderIds.length > 0) {
        // chunk to avoid huge IN clauses
        const chunks: string[][] = [];
        for (let i = 0; i < orderIds.length; i += 200) chunks.push(orderIds.slice(i, i + 200));
        const results = await Promise.all(chunks.map(chunk =>
          supabase.from("order_items").select("order_id, product_name, product_type, price_label, quantity").in("order_id", chunk)
        ));
        items = results.flatMap(r => (r.data as OrderItemRow[]) || []);
      }

      setLeads((leadsRes.data as Lead[]) ?? []);
      setProducts((productsRes.data as Product[]) ?? []);
      setPageViews(pvAll.slice().reverse());
      setConversions(convAll);
      setPerfEvents(convAll.filter(c => c.event_type === "vitals" || c.event_type === "error"));
      setOrders(ordersAll);
      setOrderItems(items);
      setRedemptions((redRes.data as DiscountRedemption[]) ?? []);

      const prods = (productsRes.data || []) as Product[];
      const enrichedClicks = ((clicksRes.data || []) as ProductClick[]).map(c => ({
        ...c,
        product_name: prods.find(p => p.id === c.product_id)?.name || "Unknown",
      }));
      setProductClicks(enrichedClicks);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("analytics-leads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        setLeads(prev => [...prev, payload.new as Lead]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [period]);

  const filterByPeriod = <T extends { created_at: string }>(items: T[]) => {
    if (period === 0) return items;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period);
    return items.filter(i => new Date(i.created_at) >= cutoff);
  };

  const filteredLeads = useMemo(() => filterByPeriod(leads), [leads, period]);
  const filteredPageViews = useMemo(() => filterByPeriod(pageViews), [pageViews, period]);
  const filteredClicks = useMemo(() => filterByPeriod(productClicks), [productClicks, period]);
  const filteredConversions = useMemo(() => filterByPeriod(conversions), [conversions, period]);
  const filteredOrders = useMemo(() => filterByPeriod(orders), [orders, period]);
  const filteredRedemptions = useMemo(() => filterByPeriod(redemptions), [redemptions, period]);

  // ===================== LEAD KPIs (audited) =====================
  const totalLeads = filteredLeads.length;
  const uniqueLeadCount = useMemo(() => {
    const s = new Set<string>();
    filteredLeads.forEach(l => s.add(`${(l.phone || "").replace(/\D/g, "")}|${(l.email || "").toLowerCase()}`));
    return s.size;
  }, [filteredLeads]);
  const convertedLeads = filteredLeads.filter(l => l.status === "converted").length;
  const closedLostLeads = filteredLeads.filter(l => l.status === "closed").length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";

  const avgBudget = useMemo(() => {
    const budgets = filteredLeads.map(l => parseBudget(l.budget)).filter(b => b > 0);
    return budgets.length > 0 ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length) : 0;
  }, [filteredLeads]);

  const prevPeriodLeads = useMemo(() => {
    if (period === 0) return null;
    const cutoffStart = new Date(); cutoffStart.setDate(cutoffStart.getDate() - period * 2);
    const cutoffEnd = new Date(); cutoffEnd.setDate(cutoffEnd.getDate() - period);
    return leads.filter(l => { const d = new Date(l.created_at); return d >= cutoffStart && d < cutoffEnd; }).length;
  }, [leads, period]);
  const leadGrowth = prevPeriodLeads == null ? null : prevPeriodLeads > 0
    ? Math.round(((totalLeads - prevPeriodLeads) / prevPeriodLeads) * 100)
    : totalLeads > 0 ? 100 : 0;

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
      { label: "Under 500K", min: 0, max: 500_000 },
      { label: "500K - 1M", min: 500_000, max: 1_000_000 },
      { label: "1M - 3M", min: 1_000_000, max: 3_000_000 },
      { label: "3M - 5M", min: 3_000_000, max: 5_000_000 },
      { label: "5M - 10M", min: 5_000_000, max: 10_000_000 },
      { label: "10M+", min: 10_000_000, max: Infinity },
    ];
    return ranges.map(r => ({
      range: r.label,
      count: filteredLeads.filter(l => { const b = parseBudget(l.budget); return b > 0 && b >= r.min && b < r.max; }).length,
    }));
  }, [filteredLeads]);

  const locationData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => {
      const city = normalizeLocation(l.location || "");
      map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredLeads]);

  const timelineData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => { if (l.timeline) map[l.timeline] = (map[l.timeline] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

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

  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => {
      const s = l.utm_source || l.source || (l.referrer ? "referral" : "website_form");
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), value,
    })).sort((a, b) => b.value - a.value);
  }, [filteredLeads]);

  const leadUtmCampaigns = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => { if (l.utm_campaign) map[l.utm_campaign] = (map[l.utm_campaign] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredLeads]);

  const dailyLeadsLast7 = useMemo(() => {
    const result = [] as { day: string; count: number }[];
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

  const topClickedProducts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredClicks.forEach(c => { if (c.product_name) map[c.product_name] = (map[c.product_name] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredClicks]);

  // ===================== TRAFFIC =====================
  const totalPageViews = filteredPageViews.length;
  const sessionSet = useMemo(() => new Set(filteredPageViews.map(pv => pv.session_id)), [filteredPageViews]);
  const uniqueSessions = sessionSet.size;
  const pagesPerSession = uniqueSessions > 0 ? (totalPageViews / uniqueSessions).toFixed(1) : "0";

  const activeNow = useMemo(() => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Set(pageViews.filter(pv => new Date(pv.created_at) >= fiveMinAgo).map(pv => pv.session_id)).size;
  }, [pageViews]);

  // Bounce rate: sessions with exactly 1 pageview
  const bounceRate = useMemo(() => {
    if (uniqueSessions === 0) return 0;
    const counts: Record<string, number> = {};
    filteredPageViews.forEach(pv => { counts[pv.session_id] = (counts[pv.session_id] || 0) + 1; });
    const bounced = Object.values(counts).filter(n => n === 1).length;
    return Math.round((bounced / uniqueSessions) * 100);
  }, [filteredPageViews, uniqueSessions]);

  // Avg session duration (median of session_end durations)
  const avgSessionSec = useMemo(() => {
    const durs = filteredConversions
      .filter(c => c.event_type === "session_end")
      .map(c => Number(c.metadata?.duration_ms))
      .filter(n => !Number.isNaN(n) && n > 0)
      .sort((a, b) => a - b);
    if (!durs.length) return 0;
    const mid = Math.floor(durs.length / 2);
    return Math.round(durs[mid] / 1000);
  }, [filteredConversions]);

  const newSessions = useMemo(() => filteredPageViews.filter(pv => pv.is_new_session).length, [filteredPageViews]);
  const returningPct = uniqueSessions > 0 ? Math.round(((uniqueSessions - newSessions) / uniqueSessions) * 100) : 0;

  const trafficByPage = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPageViews.forEach(pv => { map[pv.page_path] = (map[pv.page_path] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredPageViews]);

  const landingPages = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPageViews.forEach(pv => {
      if (pv.is_new_session) {
        const p = pv.landing_path || pv.page_path;
        map[p] = (map[p] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredPageViews]);

  const topReferrers = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPageViews.forEach(pv => {
      const r = pv.referrer;
      if (!r) return;
      try {
        const host = new URL(r).hostname.replace(/^www\./, "");
        if (host && host !== window.location.hostname.replace(/^www\./, "")) {
          map[host] = (map[host] || 0) + 1;
        }
      } catch { /* ignore */ }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredPageViews]);

  const trafficUtm = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPageViews.forEach(pv => {
      const key = pv.utm_campaign || pv.utm_source;
      if (key) map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredPageViews]);

  const deviceData = useMemo(() => {
    const map: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    filteredPageViews.forEach(pv => {
      const d = pv.device_type || "desktop";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [filteredPageViews]);

  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPageViews.forEach(pv => { if (pv.country) map[pv.country] = (map[pv.country] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredPageViews]);

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

  // ===================== REVENUE =====================
  const paidOrders = useMemo(() => filteredOrders.filter(o => (o.payment_status || "").toLowerCase() === "paid"), [filteredOrders]);
  const pendingOrders = useMemo(() => filteredOrders.filter(o => ["pending", "processing", "awaiting_payment"].includes((o.payment_status || "").toLowerCase())), [filteredOrders]);
  const cancelledOrders = useMemo(() => filteredOrders.filter(o => ["cancelled", "failed"].includes((o.status || "").toLowerCase())), [filteredOrders]);

  const grossRevenue = useMemo(() => paidOrders.reduce((s, o) => s + Number(o.total || 0), 0), [paidOrders]);
  const totalDiscounts = useMemo(() => paidOrders.reduce((s, o) => s + Number(o.discount_amount || 0), 0), [paidOrders]);
  const netRevenue = grossRevenue - totalDiscounts;
  const pendingRevenue = useMemo(() => pendingOrders.reduce((s, o) => s + Number(o.total || 0), 0), [pendingOrders]);
  const aov = paidOrders.length > 0 ? grossRevenue / paidOrders.length : 0;

  const revenueTrend = useMemo(() => {
    const map: Record<string, number> = {};
    const useWeekly = period > 30 || period === 0;
    paidOrders.forEach(o => {
      const d = new Date(o.created_at);
      const key = useWeekly ? getWeekLabel(d) : `${d.getMonth() + 1}/${d.getDate()}`;
      map[key] = (map[key] || 0) + Number(o.total || 0);
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }));
  }, [paidOrders, period]);

  const paidOrderIds = useMemo(() => new Set(paidOrders.map(o => o.id)), [paidOrders]);

  const topProductsByRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    orderItems.forEach(it => {
      if (!paidOrderIds.has(it.order_id)) return;
      const unit = parseNaira(it.price_label);
      if (unit === 0) return;
      map[it.product_name] = (map[it.product_name] || 0) + unit * (it.quantity || 1);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [orderItems, paidOrderIds]);

  const topProductsByUnits = useMemo(() => {
    const map: Record<string, number> = {};
    orderItems.forEach(it => {
      if (!paidOrderIds.has(it.order_id)) return;
      map[it.product_name] = (map[it.product_name] || 0) + (it.quantity || 1);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [orderItems, paidOrderIds]);

  const revenueByState = useMemo(() => {
    const map: Record<string, number> = {};
    paidOrders.forEach(o => {
      const st = extractState(o.shipping_address);
      map[st] = (map[st] || 0) + Number(o.total || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [paidOrders]);

  const revenueByPayment = useMemo(() => {
    const map: Record<string, number> = {};
    paidOrders.forEach(o => {
      const p = o.payment_method || "unknown";
      map[p] = (map[p] || 0) + Number(o.total || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [paidOrders]);

  const discountUsage = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    filteredOrders.forEach(o => {
      if (!o.discount_code) return;
      if (!map[o.discount_code]) map[o.discount_code] = { count: 0, amount: 0 };
      map[o.discount_code].count += 1;
      map[o.discount_code].amount += Number(o.discount_amount || 0);
    });
    return Object.entries(map).map(([code, v]) => ({ code, count: v.count, amount: Math.round(v.amount) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [filteredOrders]);

  const revenueKpis = [
    { label: "Gross Revenue", value: formatNGN(grossRevenue), icon: DollarSign, sub: `${paidOrders.length} paid orders` },
    { label: "Net Revenue", value: formatNGN(netRevenue), icon: TrendingUp, sub: `after ${formatNGN(totalDiscounts)} discounts` },
    { label: "Avg Order Value", value: formatNGN(aov), icon: ShoppingCart, sub: "per paid order" },
    { label: "Pending Revenue", value: formatNGN(pendingRevenue), icon: Clock, sub: `${pendingOrders.length} pending · ${cancelledOrders.length} cancelled` },
  ];

  // ===================== FUNNELS =====================
  const eventCount = (t: string) => filteredConversions.filter(c => c.event_type === t).length;
  const uniqueSessionsForEvent = (t: string) => new Set(filteredConversions.filter(c => c.event_type === t).map(c => c.session_id)).size;

  const siteFunnel = useMemo(() => {
    const sessions = uniqueSessions;
    const productViews = uniqueSessionsForEvent("product_view") + uniqueSessionsForEvent("product_click");
    const cartAdds = uniqueSessionsForEvent("cart_add");
    const checkoutViews = uniqueSessionsForEvent("checkout_view");
    const paid = paidOrders.length;
    return [
      { stage: "Sessions", value: sessions },
      { stage: "Product views", value: productViews },
      { stage: "Cart adds", value: cartAdds },
      { stage: "Checkout started", value: checkoutViews },
      { stage: "Paid orders", value: paid },
    ];
    // eslint-disable-next-line
  }, [uniqueSessions, filteredConversions, paidOrders]);

  const assessmentFunnel = useMemo(() => {
    return [
      { stage: "Started", value: uniqueSessionsForEvent("assessment_started") },
      { stage: "Completed", value: uniqueSessionsForEvent("assessment_completed") },
      { stage: "Full unlock", value: uniqueSessionsForEvent("assessment_full_unlock") },
    ];
    // eslint-disable-next-line
  }, [filteredConversions]);

  const leadFunnel = useMemo(() => {
    return [
      { stage: "Form opened", value: uniqueSessionsForEvent("lead_form_opened") },
      { stage: "Form started", value: uniqueSessionsForEvent("lead_form_started") },
      { stage: "Submitted", value: uniqueSessionsForEvent("lead_submitted") || totalLeads },
      { stage: "Converted", value: convertedLeads },
    ];
    // eslint-disable-next-line
  }, [filteredConversions, totalLeads, convertedLeads]);

  // ===================== KPI arrays =====================
  const leadKpis = [
    { label: "Total Leads", value: totalLeads, icon: Users,
      change: leadGrowth == null ? "" : `${leadGrowth >= 0 ? "+" : ""}${leadGrowth}%`,
      positive: (leadGrowth ?? 0) >= 0, sub: leadGrowth == null ? "" : "vs previous period" },
    { label: "Unique Leads", value: uniqueLeadCount, icon: Repeat, change: `${totalLeads - uniqueLeadCount} duplicates`, positive: true, sub: "by phone+email" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: Target, change: `${convertedLeads} won · ${closedLostLeads} lost`, positive: true, sub: "of total leads" },
    { label: "Avg Budget", value: avgBudget > 0 ? `₦${avgBudget.toLocaleString()}` : "N/A", icon: DollarSign, change: "", positive: true, sub: "per lead" },
  ];

  const trafficKpis = [
    { label: "Page Views", value: totalPageViews.toLocaleString(), icon: Eye, sub: `${trafficByPage.length} unique pages` },
    { label: "Sessions", value: uniqueSessions.toLocaleString(), icon: Globe, sub: `${pagesPerSession} pages/session` },
    { label: "New Sessions", value: `${uniqueSessions > 0 ? Math.round((newSessions / uniqueSessions) * 100) : 0}%`, icon: Users, sub: `${returningPct}% returning` },
    { label: "Bounce Rate", value: `${bounceRate}%`, icon: MousePointerClick, sub: "1-page sessions" },
    { label: "Avg Session", value: avgSessionSec > 0 ? `${Math.floor(avgSessionSec / 60)}m ${avgSessionSec % 60}s` : "—", icon: Clock, sub: "median duration" },
    { label: "Active Now", value: activeNow, icon: Activity, sub: "in last 5 min" },
  ];

  // ===================== Performance (unchanged core) =====================
  const filteredPerf = useMemo(() => filterByPeriod(perfEvents), [perfEvents, period]);
  const vitals = useMemo(() => filteredPerf.filter(e => e.event_type === "vitals"), [filteredPerf]);
  const errors = useMemo(() => filteredPerf.filter(e => e.event_type === "error"), [filteredPerf]);

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
    if (!vs.length) return null; return vs.reduce((a, b) => a + b, 0) / vs.length;
  };
  const avgLCP = avgVital("LCP"), avgINP = avgVital("INP"), avgCLS = avgVital("CLS");
  const rateVital = (name: "LCP" | "INP" | "CLS", v: number | null) => {
    if (v == null) return "—";
    if (name === "LCP") return v <= 2500 ? "good" : v <= 4000 ? "needs work" : "poor";
    if (name === "INP") return v <= 200 ? "good" : v <= 500 ? "needs work" : "poor";
    return v <= 0.1 ? "good" : v <= 0.25 ? "needs work" : "poor";
  };
  const errorTrend = useMemo(() => {
    const map: Record<string, number> = {};
    errors.forEach(e => { const d = new Date(e.created_at); const key = `${d.getMonth() + 1}/${d.getDate()}`; map[key] = (map[key] || 0) + 1; });
    return Object.entries(map).map(([date, count]) => ({ date, errors: count }));
  }, [errors]);
  const topFailingRoutes = useMemo(() => {
    const map: Record<string, number> = {};
    errors.forEach(e => { const p = e.page_path || "unknown"; map[p] = (map[p] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [errors]);
  const worstLcpRoutes = useMemo(() => {
    const map: Record<string, number[]> = {};
    vitals.filter(v => v.metadata?.metric === "LCP").forEach(v => {
      const p = v.page_path || "unknown"; const val = Number(v.metadata?.value);
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

  // ===================== CSV export =====================
  const exportAnalyticsCSV = () => {
    const rows: string[][] = [
      ["Metric", "Value"],
      ["Period (days)", String(period === 0 ? "All" : period)],
      ["Total Leads", String(totalLeads)],
      ["Unique Leads (phone+email)", String(uniqueLeadCount)],
      ["Conversion Rate", `${conversionRate}%`],
      ["Avg Budget NGN", String(avgBudget)],
      ["Page Views", String(totalPageViews)],
      ["Sessions", String(uniqueSessions)],
      ["Bounce Rate", `${bounceRate}%`],
      ["Avg Session (s)", String(avgSessionSec)],
      ["Gross Revenue NGN", String(Math.round(grossRevenue))],
      ["Net Revenue NGN", String(Math.round(netRevenue))],
      ["AOV NGN", String(Math.round(aov))],
      ["Paid Orders", String(paidOrders.length)],
      ["Pending Orders", String(pendingOrders.length)],
      ...revenueByState.map(r => [`Revenue ${r.name}`, String(r.value)]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: "leads" as const, label: "Leads" },
    { key: "revenue" as const, label: "Revenue" },
    { key: "traffic" as const, label: "Traffic" },
    { key: "funnels" as const, label: "Funnels" },
    { key: "products" as const, label: "Products" },
    { key: "performance" as const, label: "Performance" },
  ];

  // Small reusable renderer for a funnel list
  const FunnelList = ({ data }: { data: { stage: string; value: number }[] }) => {
    const max = data[0]?.value || 1;
    return (
      <div className="space-y-3">
        {data.map((stage, i) => {
          const pct = max > 0 ? (stage.value / max) * 100 : 0;
          const prev = i > 0 ? data[i - 1].value : null;
          const dropoff = prev && prev > 0 ? Math.round(((prev - stage.value) / prev) * 100) : null;
          return (
            <div key={stage.stage}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{stage.stage}</span>
                <span className="font-medium text-card-foreground">
                  {stage.value.toLocaleString()}
                  {dropoff != null && dropoff > 0 && <span className="text-red-500 ml-2">-{dropoff}%</span>}
                </span>
              </div>
              <div className="h-6 bg-muted rounded-lg overflow-hidden">
                <div className="h-full rounded-lg transition-all" style={{ width: `${Math.max(pct, 2)}%`, background: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
          <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ================= LEADS TAB ================= */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {leadKpis.map(kpi => (
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
                  <h3 className="font-display font-bold text-card-foreground mb-4">Lead Funnel</h3>
                  <FunnelList data={funnelData} />
                  {totalLeads > 0 && <p className="text-xs text-muted-foreground mt-4">{conversionRate}% of leads converted</p>}
                </div>
              </div>

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
                  <h3 className="font-display font-bold text-card-foreground mb-4">Lead Status</h3>
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
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Cities</h3>
                  <div className="h-64">
                    {locationData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={locationData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No location data</p>}
                  </div>
                </div>
              </div>

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
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {sourceData.length > 0 ? sourceData.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">{s.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
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
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top UTM Campaigns (leads)</h3>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {leadUtmCampaigns.length > 0 ? leadUtmCampaigns.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">{c.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(c.value / (leadUtmCampaigns[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs font-medium text-card-foreground w-5 text-right">{c.value}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No campaign data yet. Add ?utm_campaign=… to your ad URLs.</p>}
                  </div>
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
          )}

          {/* ================= REVENUE TAB ================= */}
          {activeTab === "revenue" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {revenueKpis.map(kpi => (
                  <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      <kpi.icon size={16} className="text-primary" />
                    </div>
                    <p className="text-2xl font-display font-bold text-card-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-card-foreground mb-4">Revenue Trend (paid orders)</h3>
                <div className="h-64">
                  {revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrend}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNGN(v)} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatNGN(v)} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No paid orders in this period</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Products by Revenue</h3>
                  <div className="h-72">
                    {topProductsByRevenue.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductsByRevenue} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNGN(v)} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={140} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatNGN(v)} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No revenue data yet</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Products by Units Sold</h3>
                  <div className="h-72">
                    {topProductsByUnits.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductsByUnits} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={140} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No orders yet</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Revenue by State</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {revenueByState.length > 0 ? revenueByState.map((r, i) => (
                      <div key={r.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">{r.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(r.value / (revenueByState[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs font-medium text-card-foreground w-16 text-right">{formatNGN(r.value)}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No data</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Revenue by Payment Method</h3>
                  <div className="h-56 flex items-center justify-center">
                    {revenueByPayment.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={revenueByPayment} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {revenueByPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatNGN(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground">No paid orders</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4"><Percent size={14} className="inline mr-1" /> Discount Codes</h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {discountUsage.length > 0 ? discountUsage.map(d => (
                      <div key={d.code} className="flex items-center justify-between text-sm border-b border-border/40 pb-1 last:border-0">
                        <span className="font-mono text-xs text-card-foreground">{d.code}</span>
                        <div className="text-xs text-muted-foreground">{d.count} uses · <span className="text-red-500">-{formatNGN(d.amount)}</span></div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No discount usage</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TRAFFIC TAB ================= */}
          {activeTab === "traffic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {trafficKpis.map(kpi => (
                  <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      <kpi.icon size={14} className="text-primary" />
                    </div>
                    <p className="text-xl font-display font-bold text-card-foreground">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                  </div>
                ))}
              </div>

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
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} name="Page Views" />
                      <Area type="monotone" dataKey="sessions" stroke="#6366f1" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Sessions" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Pages</h3>
                  <div className="h-64">
                    {trafficByPage.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trafficByPage} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={130} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No traffic data yet</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Landing Pages</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {landingPages.length > 0 ? landingPages.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2 font-mono text-xs">{p.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(p.value / (landingPages[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs font-medium text-card-foreground w-6 text-right">{p.value}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">Landing page tracking starts after this update ships.</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Referrers</h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {topReferrers.length > 0 ? topReferrers.map((r, i) => (
                      <div key={r.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">{r.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(r.value / (topReferrers[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs font-medium text-card-foreground w-6 text-right">{r.value}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No external referrers</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top UTM Campaigns</h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {trafficUtm.length > 0 ? trafficUtm.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">{c.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(c.value / (trafficUtm[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs font-medium text-card-foreground w-6 text-right">{c.value}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">Add ?utm_source=... to your ad URLs.</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Device Split</h3>
                  <div className="h-56 flex items-center justify-center">
                    {deviceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground">No device data yet</p>}
                  </div>
                </div>
              </div>

              {countryData.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Countries</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {countryData.map(c => (
                      <div key={c.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40">
                        <span className="text-sm text-card-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= FUNNELS TAB ================= */}
          {activeTab === "funnels" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-card-foreground mb-1">Site Purchase Funnel</h3>
                <p className="text-xs text-muted-foreground mb-4">Unique sessions per stage. Drop-off shown between stages.</p>
                <FunnelList data={siteFunnel} />
                {siteFunnel[0].value > 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    End-to-end conversion: {((siteFunnel[siteFunnel.length - 1].value / siteFunnel[0].value) * 100).toFixed(2)}%
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Assessment Funnel</h3>
                  <FunnelList data={assessmentFunnel} />
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Lead Funnel</h3>
                  <FunnelList data={leadFunnel} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display font-bold text-card-foreground mb-2">Event Volume</h3>
                <p className="text-xs text-muted-foreground mb-4">Raw event counts in period (all sessions).</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {["cta_click", "product_view", "cart_add", "checkout_view", "checkout_step", "ai_chat_open", "ai_chat_message", "energy_calculator_open", "energy_calculator_submit", "lumivolt_sizer_submit", "whatsapp_click", "scroll_depth"].map(ev => (
                    <div key={ev} className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{ev.replace(/_/g, " ")}</p>
                      <p className="text-lg font-display font-bold text-card-foreground">{eventCount(ev).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= PRODUCTS TAB ================= */}
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
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No inquiry data yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PERFORMANCE TAB ================= */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {perfKpis.map(kpi => (
                  <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      <kpi.icon size={16} className="text-primary" />
                    </div>
                    <p className="text-2xl font-display font-bold text-card-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground capitalize">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Core Web Vitals</h3>
                  <div className="h-64">
                    {vitalsTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="LCP" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="LCP (ms)" />
                          <Line type="monotone" dataKey="INP" stroke="#6366f1" strokeWidth={2} dot={false} name="INP (ms)" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No vitals captured yet</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Errors Over Time</h3>
                  <div className="h-64">
                    {errorTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={errorTrend}>
                          <defs>
                            <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No errors recorded — nice!</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Top Failing Routes</h3>
                  <div className="h-64">
                    {topFailingRoutes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topFailingRoutes} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={140} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="#ef4444" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No errors per route</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-display font-bold text-card-foreground mb-4">Slowest Pages (LCP)</h3>
                  <div className="h-64">
                    {worstLcpRoutes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={worstLcpRoutes} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={140} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} ms`} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No LCP samples yet</p>}
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
