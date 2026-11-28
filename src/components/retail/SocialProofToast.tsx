import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Clock, Flame, ShoppingBag, Trash2, X } from "lucide-react";
import { isShopRoute } from "@/lib/shopRoutes";
import {
  useRecentPurchases,
  useTrendingProducts,
  type RecentPurchaseItem,
} from "@/hooks/useShopTrending";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import { getShopperTrail, saveShopperTrail } from "@/lib/shopperIntelligence";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { matchesSlug, productPath } from "@/lib/productSlug";
import { resolveProductImage, handleProductImageError } from "@/lib/productImages";

const SESSION_DISMISS_KEY = "tioga_social_proof_dismissed_v1";
const SESSION_COUNT_KEY = "tioga_social_proof_shown_count_v1";
const MIN_REAL_ORDERS = 3;
const MAX_TOASTS_PER_SESSION = 5;
const INITIAL_DELAY_MS = 15_000;
const INTERVAL_MS = 35_000;
const VISIBLE_DURATION_MS = 7_500;

function formatRelativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "recently";
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 120) return "just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? "hr" : "hrs"} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/**
 * WS6a - Shop-Only Trending, Recently Viewed & Recently Purchased Floating Widget + Real-Order Toast.
 *
 * Strictly scoped to shop routes (`isShopRoute(pathname)`: `/retail*`, `/catalog*`, `/product/*`)
 * and NEVER shown on `/checkout`, `/admin/*`, or marketing pages.
 *
 * - Floating bottom-left trigger (above `--bottom-bar-h`) opens an interactive mini panel showing:
 *   1. Trending on Tioga Shop (real `get_trending_products` when deployed, or honest flagship picks)
 *   2. Recently Viewed by You (localStorage trail with Clear button)
 *   3. Recently Purchased (real verified orders only, >= 3 qualifying orders)
 * - Automatic verified-order toast cycles ONLY when >= 3 real orders exist (zero fake orders).
 */
export const SocialProofToast = () => {
  const { pathname } = useLocation();
  const { settings: promos } = useSiteSetting("promotions");

  const onShop = isShopRoute(pathname);
  const adminEnabled = promos?.show_social_proof !== false;
  const { data: purchases = [] } = useRecentPurchases(onShop && adminEnabled);
  const { data: trendingRows = [] } = useTrendingProducts(onShop && adminEnabled);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<"trending" | "viewed" | "purchased">("trending");
  const [trailVersion, setTrailVersion] = useState(0);
  const [toastDismissed, setToastDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [activeToast, setActiveToast] = useState<RecentPurchaseItem | null>(null);
  const indexRef = useRef(0);

  // Refresh recently viewed list whenever route changes or panel opens
  useEffect(() => {
    setTrailVersion((v) => v + 1);
  }, [pathname, panelOpen]);

  // Automatic real-order toast scheduler (strictly >= 3 real orders)
  useEffect(() => {
    if (!onShop || !adminEnabled || toastDismissed || purchases.length < MIN_REAL_ORDERS) {
      setActiveToast(null);
      return;
    }

    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const getShownCount = () => {
      try {
        return Number(sessionStorage.getItem(SESSION_COUNT_KEY) || "0");
      } catch {
        return 0;
      }
    };
    const incShownCount = () => {
      try {
        sessionStorage.setItem(SESSION_COUNT_KEY, String(getShownCount() + 1));
      } catch {}
    };

    const scheduleNext = (delayMs: number) => {
      if (cancelled) return;
      if (getShownCount() >= MAX_TOASTS_PER_SESSION) return;

      showTimer = setTimeout(() => {
        if (cancelled) return;
        if (typeof document !== "undefined" && document.hidden) {
          scheduleNext(INTERVAL_MS);
          return;
        }
        const item = purchases[indexRef.current % purchases.length];
        indexRef.current += 1;
        incShownCount();
        setActiveToast(item);

        hideTimer = setTimeout(() => {
          if (cancelled) return;
          setActiveToast(null);
          scheduleNext(INTERVAL_MS);
        }, VISIBLE_DURATION_MS);
      }, delayMs);
    };

    scheduleNext(INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [onShop, adminEnabled, toastDismissed, purchases]);

  const recentlyViewed = useMemo(() => {
    void trailVersion;
    const trail = getShopperTrail();
    const byId = new Map(STATIC_PRODUCTS.map((p) => [p.id, p]));
    return trail.viewed_products
      .map((v) => {
        const match = byId.get(v.id);
        return {
          id: v.id,
          name: match?.name || v.name,
          image: resolveProductImage(match?.image_url, match?.category || v.category || "", v.name),
          href: match ? productPath(match as any) : "/retail",
          price: match?.numeric_price
            ? `₦${Math.round(match.numeric_price).toLocaleString("en-NG")}`
            : v.price || "",
        };
      })
      .slice(0, 6);
  }, [trailVersion]);

  const trendingList = useMemo(() => {
    const out: Array<{ id: string; name: string; image: string; href: string; price: string; meta: string }> = [];
    const seen = new Set<string>();

    for (const row of trendingRows) {
      const prod = STATIC_PRODUCTS.find((p) => matchesSlug(p as any, row.slug));
      if (!prod || seen.has(prod.id)) continue;
      seen.add(prod.id);
      out.push({
        id: prod.id,
        name: prod.name,
        image: resolveProductImage(prod.image_url, prod.category, prod.name),
        href: productPath(prod as any),
        price: prod.numeric_price ? `₦${Math.round(prod.numeric_price).toLocaleString("en-NG")}` : prod.price || "",
        meta: row.view_count >= 5 ? `${row.view_count} views this week` : "Trending this week",
      });
      if (out.length >= 6) break;
    }

    if (out.length > 0) return out;

    // Honest catalog highlights before SQL migration is applied (zero fake view counts)
    for (const prod of STATIC_PRODUCTS) {
      if (out.length >= 6) break;
      if (!prod.numeric_price || prod.numeric_price <= 0) continue;
      if (!/srne|luxpower|deye|felicity|smart lock/i.test(`${prod.brand || ""} ${prod.name} ${prod.category}`)) continue;
      out.push({
        id: prod.id,
        name: prod.name,
        image: resolveProductImage(prod.image_url, prod.category, prod.name),
        href: productPath(prod as any),
        price: `₦${Math.round(prod.numeric_price).toLocaleString("en-NG")}`,
        meta: `Popular · ${prod.brand || prod.category}`,
      });
    }
    return out;
  }, [trendingRows]);

  if (!onShop || !adminEnabled) return null;

  const dismissToast = () => {
    setToastDismissed(true);
    setActiveToast(null);
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {}
  };

  const clearViewed = () => {
    const trail = getShopperTrail();
    trail.viewed_products = [];
    saveShopperTrail(trail);
    setTrailVersion((v) => v + 1);
  };

  const toastHref = activeToast?.product_slug
    ? activeToast.product_slug.startsWith("/")
      ? activeToast.product_slug
      : `/product/${activeToast.product_slug}`
    : "/retail";

  return (
    <div
      style={{ bottom: "calc(1rem + var(--bottom-bar-h, 0px))" }}
      className="fixed left-3.5 sm:left-5 z-30 flex flex-col items-start gap-2 max-w-[calc(100vw-5.5rem)]"
    >
      {/* Interactive Popover Panel: Trending / Recently Viewed / Recently Purchased */}
      {panelOpen && (
        <div
          data-testid="shop-activity-panel"
          role="dialog"
          aria-label="Trending, Recently Viewed and Recently Purchased"
          className="w-[min(calc(100vw-2rem),350px)] rounded-xl border border-border bg-card shadow-2xl overflow-hidden motion-safe:animate-fade-up"
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold text-foreground">
              <Flame size={14} className="text-primary" />
              <span>Tioga Shop Activity</span>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close activity widget"
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted grid place-items-center"
            >
              <X size={13} />
            </button>
          </div>

          {/* 3 Squared Tabs */}
          <div className="grid grid-cols-3 gap-1 p-2 border-b border-border bg-background">
            {(
              [
                { id: "trending", label: "Trending", icon: Flame },
                { id: "viewed", label: `Viewed (${recentlyViewed.length})`, icon: Clock },
                { id: "purchased", label: "Bought", icon: ShoppingBag },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPanelTab(id)}
                className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                  panelTab === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={11} />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <div data-lenis-prevent className="max-h-72 overflow-y-auto p-2.5 space-y-2">
            {panelTab === "trending" &&
              trendingList.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setPanelOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-border/70 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  <div className="h-11 w-11 rounded-md bg-muted/30 p-1 shrink-0 grid place-items-center">
                    <img
                      src={item.image}
                      onError={handleProductImageError}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                      {item.meta}
                    </p>
                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-primary tabular-nums">{item.price}</p>
                  </div>
                </Link>
              ))}

            {panelTab === "viewed" && (
              <>
                {recentlyViewed.length > 0 ? (
                  <>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={clearViewed}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 size={10} /> Clear history
                      </button>
                    </div>
                    {recentlyViewed.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={() => setPanelOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-lg border border-border/70 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                      >
                        <div className="h-11 w-11 rounded-md bg-muted/30 p-1 shrink-0 grid place-items-center">
                          <img
                            src={item.image}
                            onError={handleProductImageError}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground line-clamp-1">
                            {item.name}
                          </p>
                          {item.price && (
                            <p className="text-xs font-bold text-primary tabular-nums">
                              {item.price}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6 px-3">
                    Products you open on Tioga Shop will appear here automatically so you can jump back quickly.
                  </p>
                )}
              </>
            )}

            {panelTab === "purchased" && (
              <>
                {purchases.length >= MIN_REAL_ORDERS ? (
                  purchases.slice(0, 6).map((p, idx) => (
                    <Link
                      key={`${p.product_name}-${idx}`}
                      to={p.product_slug ? `/product/${p.product_slug}` : "/retail"}
                      onClick={() => setPanelOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-lg border border-border/70 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                    >
                      <div className="h-11 w-11 rounded-md bg-muted/30 p-1 shrink-0 grid place-items-center">
                        <img
                          src={resolveProductImage(p.image_url, "", p.product_name)}
                          onError={handleProductImageError}
                          alt={p.product_name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified · {p.state}
                        </p>
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {p.product_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(p.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6 px-3">
                    Verified customer purchases appear here automatically once confirmed (we never display simulated orders).
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Automatic Real-Order Social Proof Toast (only when >= 3 real orders exist & panel is closed) */}
      {!panelOpen && activeToast && (
        <aside
          data-testid="social-proof-toast"
          role="status"
          aria-live="polite"
          className="relative w-[min(calc(100vw-5.5rem),320px)] rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-lg p-3 pr-8 motion-safe:animate-fade-up"
        >
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss recent purchase alert"
            className="absolute top-2 right-2 h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted grid place-items-center transition-colors"
          >
            <X size={13} />
          </button>

          <Link to={toastHref} className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-md border border-border bg-muted/30 p-1 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={resolveProductImage(activeToast.image_url, "", activeToast.product_name)}
                onError={handleProductImageError}
                alt={activeToast.product_name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 leading-none mb-1">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>Verified order · {activeToast.state}</span>
              </p>
              <p className="text-xs font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {activeToast.product_name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Purchased {formatRelativeTime(activeToast.created_at)}
              </p>
            </div>
          </Link>
        </aside>
      )}

      {/* Compact Squared Shop Activity Trigger Button (Shop Routes Only) */}
      <button
        type="button"
        data-testid="shop-activity-trigger"
        onClick={() => setPanelOpen((o) => !o)}
        aria-expanded={panelOpen}
        aria-label="Open Trending and Recently Viewed widget"
        className="inline-flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-card/95 hover:bg-card text-foreground shadow-lg backdrop-blur-md text-xs font-bold transition-all hover:border-primary/50"
      >
        <span className="relative flex h-2 w-2">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Clock size={14} className="text-primary" />
        <span className="hidden sm:inline">Trending &amp; Recent</span>
        {recentlyViewed.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary text-[10px] font-extrabold tabular-nums">
            {recentlyViewed.length}
          </span>
        )}
      </button>
    </div>
  );
};

export default SocialProofToast;
