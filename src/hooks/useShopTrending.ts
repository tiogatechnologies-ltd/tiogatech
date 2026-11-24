import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCached } from "@/lib/sessionDataCache";

export interface RecentPurchaseItem {
  product_name: string;
  image_url: string | null;
  product_slug: string | null;
  state: string;
  created_at: string;
}

export interface TrendingProductRow {
  page_path: string;
  slug: string;
  view_count: number;
}

const RECENT_CACHE_KEY = "ws6_recent_purchases_v1";
const TRENDING_CACHE_KEY = "ws6_trending_products_v1";
const FIVE_MIN = 5 * 60 * 1000;

async function fetchRecentPurchases(): Promise<RecentPurchaseItem[]> {
  const hit = getCached<RecentPurchaseItem[]>(RECENT_CACHE_KEY);
  if (hit) return hit;

  try {
    const { data, error } = await (supabase as any).rpc("get_recent_purchases", {
      p_limit: 20,
      p_days: 14,
    });
    if (error || !Array.isArray(data)) return [];
    const cleaned = (data as any[])
      .filter((r) => r && typeof r.product_name === "string" && r.product_name.trim())
      .map((r) => ({
        product_name: String(r.product_name),
        image_url: r.image_url ? String(r.image_url) : null,
        product_slug: r.product_slug ? String(r.product_slug) : null,
        state: r.state ? String(r.state) : "Nigeria",
        created_at: r.created_at ? String(r.created_at) : new Date().toISOString(),
      }));
    setCached(RECENT_CACHE_KEY, cleaned);
    return cleaned;
  } catch {
    return [];
  }
}

async function fetchTrendingProducts(): Promise<TrendingProductRow[]> {
  const hit = getCached<TrendingProductRow[]>(TRENDING_CACHE_KEY);
  if (hit) return hit;

  try {
    const { data, error } = await (supabase as any).rpc("get_trending_products", {
      p_days: 7,
      p_limit: 12,
    });
    if (error || !Array.isArray(data)) return [];
    const cleaned = (data as any[])
      .filter((r) => r && typeof r.slug === "string" && r.slug.trim())
      .map((r) => ({
        page_path: String(r.page_path || `/product/${r.slug}`),
        slug: String(r.slug),
        view_count: Number(r.view_count) || 0,
      }));
    setCached(TRENDING_CACHE_KEY, cleaned);
    return cleaned;
  } catch {
    return [];
  }
}

/**
 * Cached storefront hook for WS6 real recent purchases (5-min staleTime + session cache).
 * Only fetches when `enabled` is true (i.e. on shop routes).
 */
export function useRecentPurchases(enabled = true) {
  return useQuery({
    queryKey: ["shop", "recent-purchases"],
    queryFn: fetchRecentPurchases,
    enabled,
    staleTime: FIVE_MIN,
    gcTime: 15 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Cached storefront hook for WS6 trending products by distinct sessions (5-min staleTime + session cache).
 */
export function useTrendingProducts(enabled = true) {
  return useQuery({
    queryKey: ["shop", "trending-products"],
    queryFn: fetchTrendingProducts,
    enabled,
    staleTime: FIVE_MIN,
    gcTime: 15 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
