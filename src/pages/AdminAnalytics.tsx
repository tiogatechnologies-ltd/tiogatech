import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Target, DollarSign, Filter, ArrowUpRight, ArrowDownRight, Globe, Eye, Download, Activity, AlertTriangle, Gauge, ShoppingCart, Percent, Clock, MousePointerClick, Repeat, RefreshCw } from "lucide-react";
import { fetchAllRows } from "@/lib/fetchAllRows";
import {
  RANGE_OPTIONS, bucketSeries, comparisonLabel, describeRange, getAnalyticsRange, inRange, inWindow,
  isRangeKey, startOfZonedDay, zonedDateString, type AnalyticsRange, type RangeKey,
} from "@/lib/analyticsRange";

// ---------- Types ----------
const LEAD_COLUMNS = "id, phone, email, location, products, budget, status, created_at, has_electricity, main_goal, appliances, timeline, source, utm_source, utm_medium, utm_campaign, referrer";
interface Lead {
  id: string; phone: string; email: string | null;
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
interface ProductClick { id: string; product_id: string; created_at: string; product_name?: string; }
interface ConversionRow { id: string; session_id: string; event_type: string; page_path: string | null; metadata: any; created_at: string; }
interface OrderRow {
  id: string; order_number: string | null; total: number | null; subtotal: number | null;
  discount_amount: number | null; discount_code: string | null;
  status: string | null; payment_status: string | null; payment_method: string | null;
  source: string | null; created_at: string; shipping_address: any;
}
interface OrderItemRow { order_id: string; product_name: string; product_type: string | null; price_label: string | null; quantity: number; }

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 } as const;

// ---------- Helpers ----------
/** Robust budget parser - handles ranges like "500K-1M", "₦1,200,000", "over 5M". Returns midpoint or single value. */
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

// ---------- Data loading ----------
interface AnalyticsData {
  rangeKey: RangeKey;
  fetchedAt: Date;
  leads: Lead[];
  products: Product[];
  pageViews: PageView[];
  productClicks: ProductClick[];
  conversions: ConversionRow[];
  orders: OrderRow[];
  orderItems: OrderItemRow[];
  /** Tables that hit the row ceiling, so their numbers may be low. */
  truncated: string[];
  /** Tables that failed to load. */
  failed: string[];
}

// Reopening the page or flipping back to a range within a couple of minutes
// reuses what was already fetched instead of re-reading every table.
const CACHE_TTL_MS = 2 * 60_000;
const analyticsCache = new Map<RangeKey, AnalyticsData>();
function readCache(key: RangeKey): AnalyticsData | null {
  const hit = analyticsCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.fetchedAt.getTime() > CACHE_TTL_MS) { analyticsCache.delete(key); return null; }
  return hit;
}

// Newest first with an id tiebreak, so pages never overlap or skip rows that share a
// timestamp, and a capped result keeps the most recent rows.
const paged = <T,>(table: string, build: () => any) =>
  fetchAllRows<T>(() => build().order("created_at", { ascending: false }).order("id", { ascending: false }))
    .then(r => ({ table, ...r }));

async function loadAnalytics(rangeKey: RangeKey): Promise<AnalyticsData> {
  const fetchedAt = new Date();
  const range = getAnalyticsRange(rangeKey, fetchedAt);
  // Only the selected window is read (it used to read at least 180 days for every range).
  const since = range.start?.toISOString() ?? null;
  // Leads also need the comparison window and the fixed "last 7 days" chart.
  const leadsSince = range.prevStart
    ? new Date(Math.min(range.prevStart.getTime(), startOfZonedDay(fetchedAt, -6).getTime())).toISOString()
    : null;
  const from = (q: any, iso: string | null) => (iso ? q.gte("created_at", iso) : q);

  const [leadsR, pvR, clicksR, convR, vitalsR, ordersR, productsRes] = await Promise.all([
    paged<Lead>("leads", () => from(supabase.from("leads").select(LEAD_COLUMNS), leadsSince)),
    paged<PageView>("page views", () => from(supabase.from("page_views").select("id, session_id, page_path, device_type, created_at, referrer, country, utm_source, utm_medium, utm_campaign, landing_path, is_new_session"), since)),
    paged<ProductClick>("product clicks", () => from(supabase.from("product_clicks").select("id, product_id, created_at"), since)),
    paged<ConversionRow>("events", () => from(supabase.from("conversions").select("id, session_id, event_type, page_path, metadata, created_at").neq("event_type", "vitals"), since)),
    // Only vitals written by initWebVitals (they carry a rating). Until 27 Nov 2026
    // usePageTracker also wrote unrated LCP/CLS rows - up to ~240 per session - which
    // made up most of the table and pushed 30-day reads past the row ceiling.
    paged<ConversionRow>("vitals", () => from(supabase.from("conversions").select("id, session_id, event_type, page_path, metadata, created_at").eq("event_type", "vitals").not("metadata->>rating", "is", null), since)),
    paged<OrderRow>("orders", () => from(supabase.from("orders").select("id, order_number, total, subtotal, discount_amount, discount_code, status, payment_status, payment_method, source, created_at, shipping_address"), since)),
    supabase.from("products").select("id, name, category, series, price, is_active"),
  ]);

  const truncated: string[] = [];
  const failed: string[] = [];
  for (const r of [leadsR, pvR, clicksR, convR, vitalsR, ordersR]) {
    if (r.error) failed.push(r.table);
    else if (r.truncated) truncated.push(r.table);
  }
  if (productsRes.error) failed.push("products");

  // Line items for the fetched orders, chunked to keep the IN list short.
  const orderIds = ordersR.rows.map(o => o.id);
  const chunks: string[][] = [];
  for (let i = 0; i < orderIds.length; i += 200) chunks.push(orderIds.slice(i, i + 200));
  const itemResults = await Promise.all(chunks.map(chunk =>
    supabase.from("order_items").select("order_id, product_name, product_type, price_label, quantity").in("order_id", chunk)
  ));
  if (itemResults.some(r => r.error)) failed.push("order items");
  const orderItems = itemResults.flatMap(r => (r.data as OrderItemRow[]) || []);

  const products = (productsRes.data || []) as Product[];
  const nameById = new Map(products.map(p => [p.id, p.name]));
  const productClicks = clicksR.rows.map(c => ({ ...c, product_name: nameById.get(c.product_id) || "Unknown" }));

  return {
    rangeKey, fetchedAt, products, orderItems, productClicks, truncated, failed,
    leads: leadsR.rows, pageViews: pvR.rows, conversions: [...convR.rows, ...vitalsR.rows], orders: ordersR.rows,
  };
}

const EMPTY: never[] = [];

// ---------- Component ----------
const AdminAnalytics = () => {
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
  const urlRange = searchParams.get("range");
  const rangeKey: RangeKey = isRangeKey(urlRange) ? urlRange : "30d";
  const setRangeKey = (k: RangeKey) => {
    const next = new URLSearchParams(searchParams);
    next.set("range", k);
    setSearchParams(next, { replace: true });
  };

  const [data, setData] = useState<AnalyticsData | null>(() => readCache(rangeKey));
  const [loading, setLoading] = useState(() => !readCache(rangeKey));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = () => { analyticsCache.delete(rangeKey); setReloadTick(t => t + 1); };

  useEffect(() => {
    let cancelled = false;
    const cached = readCache(rangeKey);
    if (cached) { setData(cached); setLoading(false); setLoadError(null); return; }
    setLoading(true);
    loadAnalytics(rangeKey)
      .then(d => {
        if (cancelled) return;
        // A total failure (network, or no admin access) keeps whatever was shown before.
        if (d.failed.length >= 6) { setLoadError("Analytics could not be loaded. Check your connection and admin access, then retry."); return; }
        analyticsCache.set(rangeKey, d);
        setData(d);
        setLoadError(null);
      })
      .catch(() => { if (!cancelled) setLoadError("Analytics could not be loaded. Check your connection, then retry."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rangeKey, reloadTick]);

  // New leads appear live without re-reading everything.
  useEffect(() => {
    const channel = supabase
      .channel("analytics-leads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        const lead = payload.new as Lead;
        setData(prev => (prev && !prev.leads.some(l => l.id === lead.id) ? { ...prev, leads: [lead, ...prev.leads] } : prev));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const leads = data?.leads ?? (EMPTY as Lead[]);
  const products = data?.products ?? (EMPTY as Product[]);
  const pageViews = data?.pageViews ?? (EMPTY as PageView[]);
  const productClicks = data?.productClicks ?? (EMPTY as ProductClick[]);
  const conversions = data?.conversions ?? (EMPTY as ConversionRow[]);
  const orders = data?.orders ?? (EMPTY as OrderRow[]);
  const orderItems = data?.orderItems ?? (EMPTY as OrderItemRow[]);

  // The range the shown data was fetched for (the highlighted button can be ahead while loading).
  const range: AnalyticsRange = useMemo(
    () => (data ? getAnalyticsRange(data.rangeKey, data.fetchedAt) : getAnalyticsRange(rangeKey)),
    [data, rangeKey],
  );
  const rangeLabel = RANGE_OPTIONS.find(o => o.key === range.key)?.label ?? "";

  const filteredLeads = useMemo(() => leads.filter(l => inRange(l.created_at, range)), [leads, range]);
  const filteredPageViews = useMemo(() => pageViews.filter(r => inRange(r.created_at, range)), [pageViews, range]);
  const filteredClicks = useMemo(() => productClicks.filter(r => inRange(r.created_at, range)), [productClicks, range]);
  const filteredConversions = useMemo(() => conversions.filter(r => inRange(r.created_at, range)), [conversions, range]);
  const filteredOrders = useMemo(() => orders.filter(r => inRange(r.created_at, range)), [orders, range]);

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

  // Same length window directly before; for Today that is yesterday up to this time.
  const prevPeriodLeads = useMemo(() => {
    if (!range.prevStart || !range.prevEnd) return null;
    return leads.filter(l => inWindow(l.created_at, range.prevStart, range.prevEnd)).length;
  }, [leads, range]);
  const leadGrowth = prevPeriodLeads == null ? null : prevPeriodLeads > 0
    ? Math.round(((totalLeads - prevPeriodLeads) / prevPeriodLeads) * 100)
    : totalLeads > 0 ? 100 : 0;

  const trendData = useMemo(
    () => bucketSeries(filteredLeads, range, g => ({ leads: g.length })),
    [filteredLeads, range],
  );

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

  // Fixed last-7-Lagos-days view, independent of the selected range.
  const dailyLeadsLast7 = useMemo(() => {
    const now = range.end;
    const result = [] as { day: string; count: number }[];
    for (let i = 6; i >= 0; i--) {
      const d = startOfZonedDay(now, -i);
      const next = startOfZonedDay(now, -i + 1);
      result.push({
        day: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Africa/Lagos" }),
        count: leads.filter(l => inWindow(l.created_at, d, next)).length,
      });
    }
    return result;
  }, [leads, range]);

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

  // As of the last refresh.
  const activeNow = useMemo(() => {
    const fiveMinAgo = new Date(range.end.getTime() - 5 * 60 * 1000);
    return new Set(pageViews.filter(pv => inWindow(pv.created_at, fiveMinAgo, null)).map(pv => pv.session_id)).size;
  }, [pageViews, range]);

  // Bounce rate: sessions with exactly 1 pageview
  const bounceRate = useMemo(() => {
    if (uniqueSessions === 0) return 0;
    const counts: Record<string, number> = {};
    filteredPageViews.forEach(pv => { counts[pv.session_id] = (counts[pv.session_id] || 0) + 1; });
    const bounced = Object.values(counts).filter(n => n === 1).length;
    return Math.round((bounced / uniqueSessions) * 100);
  }, [filteredPageViews, uniqueSessions]);

  // Median session duration. A session reports a running total each time the tab
  // is hidden, so take each session's longest report rather than every report.
  const avgSessionSec = useMemo(() => {
    const longest = new Map<string, number>();
    filteredConversions.forEach(c => {
      if (c.event_type !== "session_end") return;
      const n = Number(c.metadata?.duration_ms);
      if (Number.isNaN(n) || n <= 0) return;
      longest.set(c.session_id, Math.max(longest.get(c.session_id) ?? 0, n));
    });
    const durs = [...longest.values()].sort((a, b) => a - b);
    if (!durs.length) return 0;
    const mid = Math.floor(durs.length / 2);
    return Math.round(durs[mid] / 1000);
  }, [filteredConversions]);

  // Sessions (not rows) that started in range; a session can carry more than one
  // is_new_session row (e.g. a duplicated tab copies sessionStorage), which pushed this past 100%.
  const newSessions = useMemo(
    () => new Set(filteredPageViews.filter(pv => pv.is_new_session).map(pv => pv.session_id)).size,
    [filteredPageViews],
  );
  const returningPct = uniqueSessions > 0 ? Math.round(((uniqueSessions - newSessions) / uniqueSessions) * 100) : 0;

  const trafficByPage = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPageViews.forEach(pv => { map[pv.page_path] = (map[pv.page_path] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredPageViews]);

  // trafficByPage is the top 10 only, so it can't be used as the distinct count.
  const uniquePageCount = useMemo(() => new Set(filteredPageViews.map(pv => pv.page_path)).size, [filteredPageViews]);

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
      // Rows saved before device type was recorded have none; don't pass them off as desktop.
      const d = pv.device_type || "unknown";
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

  const trafficTrend = useMemo(
    () => bucketSeries(filteredPageViews, range, g => ({ views: g.length, sessions: new Set(g.map(pv => pv.session_id)).size })),
    [filteredPageViews, range],
  );

  // ===================== REVENUE =====================
  const paidOrders = useMemo(() => filteredOrders.filter(o => (o.payment_status || "").toLowerCase() === "paid"), [filteredOrders]);
  const pendingOrders = useMemo(() => filteredOrders.filter(o => ["pending", "processing", "awaiting_payment"].includes((o.payment_status || "").toLowerCase())), [filteredOrders]);
  const cancelledOrders = useMemo(() => filteredOrders.filter(o => ["cancelled", "failed"].includes((o.status || "").toLowerCase())), [filteredOrders]);

  const grossRevenue = useMemo(() => paidOrders.reduce((s, o) => s + Number(o.total || 0), 0), [paidOrders]);
  const totalDiscounts = useMemo(() => paidOrders.reduce((s, o) => s + Number(o.discount_amount || 0), 0), [paidOrders]);
  const netRevenue = grossRevenue - totalDiscounts;
  const pendingRevenue = useMemo(() => pendingOrders.reduce((s, o) => s + Number(o.total || 0), 0), [pendingOrders]);
  const aov = paidOrders.length > 0 ? grossRevenue / paidOrders.length : 0;

  // Orders arrive newest first; bucketSeries returns points oldest first (the old map
  // kept arrival order, so this chart ran backwards).
  const revenueTrend = useMemo(
    () => paidOrders.length === 0 ? [] : bucketSeries(paidOrders, range, g => ({ revenue: Math.round(g.reduce((s, o) => s + Number(o.total || 0), 0)) })),
    [paidOrders, range],
  );

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
    // Union, not a sum: a session that both viewed and clicked a product counts once.
    const productViews = new Set(filteredConversions.filter(c => c.event_type === "product_view" || c.event_type === "product_click").map(c => c.session_id)).size;
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
      positive: (leadGrowth ?? 0) >= 0, sub: leadGrowth == null ? "" : `${comparisonLabel(range)} (${prevPeriodLeads})` },
    { label: "Unique Leads", value: uniqueLeadCount, icon: Repeat, change: `${totalLeads - uniqueLeadCount} duplicates`, positive: true, sub: "by phone+email" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: Target, change: `${convertedLeads} won · ${closedLostLeads} lost`, positive: true, sub: "of total leads" },
    { label: "Avg Budget", value: avgBudget > 0 ? `₦${avgBudget.toLocaleString()}` : "N/A", icon: DollarSign, change: "", positive: true, sub: "per lead" },
  ];

  const trafficKpis = [
    { label: "Page Views", value: totalPageViews.toLocaleString(), icon: Eye, sub: `${uniquePageCount} unique pages` },
    { label: "Sessions", value: uniqueSessions.toLocaleString(), icon: Globe, sub: `${pagesPerSession} pages/session` },
    { label: "New Sessions", value: `${uniqueSessions > 0 ? Math.round((newSessions / uniqueSessions) * 100) : 0}%`, icon: Users, sub: `${returningPct}% returning` },
    { label: "Bounce Rate", value: `${bounceRate}%`, icon: MousePointerClick, sub: "1-page sessions" },
    { label: "Avg Session", value: avgSessionSec > 0 ? `${Math.floor(avgSessionSec / 60)}m ${avgSessionSec % 60}s` : "-", icon: Clock, sub: "median duration" },
    { label: "Active Now", value: activeNow, icon: Activity, sub: "in last 5 min" },
  ];

  // ===================== Performance (unchanged core) =====================
  const vitals = useMemo(() => filteredConversions.filter(e => e.event_type === "vitals"), [filteredConversions]);
  const errors = useMemo(() => filteredConversions.filter(e => e.event_type === "error"), [filteredConversions]);

  const vitalsTrend = useMemo(() => {
    if (vitals.length === 0) return [];
    const avgOf = (g: ConversionRow[], m: "LCP" | "INP" | "CLS") => {
      const vs = g.filter(v => v.metadata?.metric === m).map(v => Number(v.metadata?.value)).filter(n => !Number.isNaN(n));
      return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0;
    };
    return bucketSeries(vitals, range, g => ({
      LCP: Math.round(avgOf(g, "LCP")), INP: Math.round(avgOf(g, "INP")), CLS: +avgOf(g, "CLS").toFixed(3),
    }));
  }, [vitals, range]);
  const avgVital = (name: "LCP" | "INP" | "CLS") => {
    const vs = vitals.filter(v => v.metadata?.metric === name).map(v => Number(v.metadata?.value)).filter(n => !Number.isNaN(n));
    if (!vs.length) return null; return vs.reduce((a, b) => a + b, 0) / vs.length;
  };
  const avgLCP = avgVital("LCP"), avgINP = avgVital("INP"), avgCLS = avgVital("CLS");
  const rateVital = (name: "LCP" | "INP" | "CLS", v: number | null) => {
    if (v == null) return "-";
    if (name === "LCP") return v <= 2500 ? "good" : v <= 4000 ? "needs work" : "poor";
    if (name === "INP") return v <= 200 ? "good" : v <= 500 ? "needs work" : "poor";
    return v <= 0.1 ? "good" : v <= 0.25 ? "needs work" : "poor";
  };
  const errorTrend = useMemo(
    () => errors.length === 0 ? [] : bucketSeries(errors, range, g => ({ errors: g.length })),
    [errors, range],
  );
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
    { label: "Avg LCP", value: avgLCP != null ? `${Math.round(avgLCP)} ms` : "-", icon: Gauge, sub: rateVital("LCP", avgLCP) },
    { label: "Avg INP", value: avgINP != null ? `${Math.round(avgINP)} ms` : "-", icon: Activity, sub: rateVital("INP", avgINP) },
    { label: "Avg CLS", value: avgCLS != null ? avgCLS.toFixed(3) : "-", icon: Eye, sub: rateVital("CLS", avgCLS) },
    { label: "Total Errors", value: errors.length, icon: AlertTriangle, sub: `${topFailingRoutes.length} routes affected` },
  ];

  // ===================== CSV export =====================
  const exportAnalyticsCSV = () => {
    const rows: string[][] = [
      ["Metric", "Value"],
      ["Range", rangeLabel],
      ["Window (Lagos time)", describeRange(range)],
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
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `analytics-${range.key}-${zonedDateString(range.end)}.csv`; a.click();
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
      {!data ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          {loadError && !loading ? (
            <>
              <p className="text-sm text-red-600">{loadError}</p>
              <button onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all">
                <RefreshCw size={14} /> Retry
              </button>
            </>
          ) : (
            <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Date range">
                <Filter size={16} className="text-muted-foreground" />
                {RANGE_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => setRangeKey(opt.key)} aria-pressed={rangeKey === opt.key}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${rangeKey === opt.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {loading ? "Updating..." : describeRange(range)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refresh} disabled={loading} title="Reload analytics"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-50">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button onClick={exportAnalyticsCSV} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {(loadError || data.failed.length > 0 || data.truncated.length > 0) && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 space-y-1 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800">
              {loadError && <p>{loadError} Showing the last loaded data.</p>}
              {data.failed.length > 0 && <p>Could not fully load {data.failed.join(", ")}; figures from those may be incomplete. Try Refresh or a shorter range.</p>}
              {data.truncated.length > 0 && <p>Only the most recent 25,000 rows of {data.truncated.join(", ")} were loaded, so totals for this range may be low. Pick a shorter range for exact numbers.</p>}
            </div>
          )}

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
                          <span className={kpi.positive ? "text-emerald-700" : "text-red-600"}>{kpi.change}</span>
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
                  {["cta_click", "product_view", "cart_add", "checkout_view", "checkout_step", "ai_chat_open", "ai_chat_message", "energy_calculator_open", "energy_calculator_submit", "lumi_sizer_submit", "whatsapp_click", "scroll_depth"].map(ev => (
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
                    ) : <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No errors recorded - nice!</p>}
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
