import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Flame, ShoppingBag, Trash2 } from "lucide-react";
import type { RetailProduct } from "@/types/retail";
import { useRecentPurchases, useTrendingProducts } from "@/hooks/useShopTrending";
import { getShopperTrail, saveShopperTrail } from "@/lib/shopperIntelligence";
import { matchesSlug, productPath } from "@/lib/productSlug";
import { resolveProductImage, handleProductImageError } from "@/lib/productImages";

const fmtNaira = (p: RetailProduct) => {
  if (p.numeric_price && p.numeric_price > 0) {
    return `₦${Math.round(p.numeric_price).toLocaleString("en-NG")}`;
  }
  return p.price || "Price on request";
};

interface StripCardItem {
  key: string;
  name: string;
  image: string;
  href: string;
  priceLabel?: string;
  meta?: string;
}

const ProductStripCards = ({ items }: { items: StripCardItem[] }) => (
  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-1 px-1">
    {items.map((item) => (
      <Link
        key={item.key}
        to={item.href}
        className="snap-start shrink-0 w-[176px] sm:w-[204px] rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-3 flex flex-col group"
      >
        <div className="h-28 sm:h-32 rounded-lg bg-muted/20 p-2 mb-2.5 flex items-center justify-center overflow-hidden">
          <img
            src={item.image}
            onError={handleProductImageError}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        {item.meta && (
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 truncate mb-0.5">
            {item.meta}
          </span>
        )}
        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2rem]">
          {item.name}
        </p>
        {item.priceLabel && (
          <p className="mt-auto pt-2 text-xs sm:text-sm font-display font-extrabold text-foreground tabular-nums">
            {item.priceLabel}
          </p>
        )}
      </Link>
    ))}
  </div>
);

/**
 * WS6b - Personal "Recently Viewed by You" row (localStorage trail, with Clear button).
 * Rendered on `/product/:slug`.
 */
export const RecentlyViewedRow = ({
  products,
  excludeProductId,
}: {
  products: RetailProduct[];
  excludeProductId?: string;
}) => {
  const [clearedVersion, setClearedVersion] = useState(0);

  const items = useMemo(() => {
    void clearedVersion;
    const trail = getShopperTrail();
    if (!trail.viewed_products.length) return [];

    const byId = new Map(products.map((p) => [p.id, p]));
    const out: StripCardItem[] = [];
    for (const v of trail.viewed_products) {
      if (excludeProductId && v.id === excludeProductId) continue;
      const found = byId.get(v.id);
      if (!found) continue;
      out.push({
        key: found.id,
        name: found.name,
        image: resolveProductImage(found.image_url, found.category, found.name),
        href: productPath(found),
        priceLabel: fmtNaira(found),
        meta: found.category,
      });
      if (out.length >= 10) break;
    }
    return out;
  }, [products, excludeProductId, clearedVersion]);

  if (items.length === 0) return null;

  const handleClear = () => {
    const trail = getShopperTrail();
    trail.viewed_products = [];
    saveShopperTrail(trail);
    setClearedVersion((n) => n + 1);
  };

  return (
    <section data-testid="recently-viewed-row" className="mb-8">
      <div className="flex items-end justify-between gap-3 mb-3.5">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary flex items-center gap-1.5">
            <Clock size={12} />
            <span>Pick up where you left off</span>
          </p>
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground leading-tight mt-0.5">
            Recently Viewed by You
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trash2 size={12} />
          <span>Clear</span>
        </button>
      </div>
      <ProductStripCards items={items} />
    </section>
  );
};

type ActivityTab = "trending" | "recent" | "purchased";

/**
 * WS6b - Storefront Trending, Recently Viewed & Recently Purchased Widget on `/retail`.
 *
 * Always visible on the shop storefront as a clean tabbed widget:
 * - "Trending Now": Uses real distinct-session view counts from `get_trending_products` when
 *   available, and cleanly displays featured popular Tioga Shop hardware (honestly labeled
 *   "Popular on Tioga Shop", zero fake view numbers) if the RPC migration isn't deployed yet.
 * - "Recently Viewed": Visitor's personal viewed-products trail with a Clear button.
 * - "Recently Purchased": Verified real orders from `get_recent_purchases` (never invented orders).
 */
export const ShopTrendingRows = ({ products }: { products: RetailProduct[] }) => {
  const { data: trendingRows = [] } = useTrendingProducts(products.length > 0);
  const { data: recentPurchases = [] } = useRecentPurchases(products.length > 0);
  const [activeTab, setActiveTab] = useState<ActivityTab>("trending");
  const [clearedVersion, setClearedVersion] = useState(0);

  const trendingItems = useMemo<StripCardItem[]>(() => {
    if (!products.length) return [];
    const matched: StripCardItem[] = [];
    const seen = new Set<string>();

    // 1. Real session-based trending items from Supabase RPC
    for (const row of trendingRows) {
      const prod = products.find((p) => matchesSlug(p, row.slug));
      if (!prod || seen.has(prod.id)) continue;
      seen.add(prod.id);
      matched.push({
        key: `trend-${prod.id}`,
        name: prod.name,
        image: resolveProductImage(prod.image_url, prod.category, prod.name),
        href: productPath(prod),
        priceLabel: fmtNaira(prod),
        meta:
          row.view_count >= 5
            ? `${row.view_count} shoppers viewed this week`
            : "Trending this week",
      });
      if (matched.length >= 10) break;
    }

    if (matched.length > 0) return matched;

    // 2. Honest fallback before RPC migration is applied: diversified flagship catalog picks
    // (labeled honestly as category highlights - NEVER fake view counts!)
    const priced = products.filter(
      (p) => (p.numeric_price && p.numeric_price > 0) && /srne|luxpower|deye|felicity|itel|smart lock|panel|camera/i.test(`${p.brand || ""} ${p.name} ${p.category}`),
    );
    const perCat = new Map<string, number>();
    for (const prod of priced) {
      if (matched.length >= 10) break;
      const cat = (prod.category || "Hardware").toLowerCase();
      const count = perCat.get(cat) || 0;
      if (count >= 2) continue;
      perCat.set(cat, count + 1);
      matched.push({
        key: `popular-${prod.id}`,
        name: prod.name,
        image: resolveProductImage(prod.image_url, prod.category, prod.name),
        href: productPath(prod),
        priceLabel: fmtNaira(prod),
        meta: `Popular · ${prod.brand || prod.category}`,
      });
    }
    return matched;
  }, [trendingRows, products]);

  const recentlyViewedItems = useMemo<StripCardItem[]>(() => {
    void clearedVersion;
    const trail = getShopperTrail();
    if (!trail.viewed_products.length || !products.length) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    const out: StripCardItem[] = [];
    for (const v of trail.viewed_products) {
      const found = byId.get(v.id);
      if (!found) continue;
      out.push({
        key: `rv-${found.id}`,
        name: found.name,
        image: resolveProductImage(found.image_url, found.category, found.name),
        href: productPath(found),
        priceLabel: fmtNaira(found),
        meta: "Viewed by you",
      });
      if (out.length >= 10) break;
    }
    return out;
  }, [products, clearedVersion]);

  const justPurchasedItems = useMemo<StripCardItem[]>(() => {
    if (recentPurchases.length < 3) return [];
    const seen = new Set<string>();
    const out: StripCardItem[] = [];
    for (const p of recentPurchases) {
      const k = p.product_name.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      const catalogMatch = products.find(
        (c) =>
          (p.product_slug && matchesSlug(c, p.product_slug)) ||
          c.name.toLowerCase() === k,
      );
      out.push({
        key: `bought-${k}`,
        name: p.product_name,
        image: resolveProductImage(
          p.image_url || catalogMatch?.image_url,
          catalogMatch?.category || "",
          p.product_name,
        ),
        href: catalogMatch
          ? productPath(catalogMatch)
          : p.product_slug
            ? `/product/${p.product_slug}`
            : "/retail",
        priceLabel: catalogMatch ? fmtNaira(catalogMatch) : undefined,
        meta: `Verified order · ${p.state}`,
      });
      if (out.length >= 10) break;
    }
    return out;
  }, [recentPurchases, products]);

  if (!products.length) return null;

  const handleClearRecent = () => {
    const trail = getShopperTrail();
    trail.viewed_products = [];
    saveShopperTrail(trail);
    setClearedVersion((n) => n + 1);
  };

  return (
    <section
      data-testid="shop-trending-widget"
      aria-label="Trending, Recently Viewed and Recently Purchased"
      className="mb-8 sm:mb-10 rounded-xl border border-border bg-card/60 p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary flex items-center gap-1.5">
            <Flame size={12} />
            <span>Tioga Shop Activity</span>
          </p>
          <h2 className="text-base sm:text-lg font-display font-bold text-foreground leading-tight mt-0.5">
            Trending, Recently Viewed &amp; Verified Purchases
          </h2>
        </div>

        {/* Squared Tab Switcher (no pill badges) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: "trending", label: "Trending Now", icon: Flame, count: trendingItems.length },
              { key: "recent", label: "Recently Viewed", icon: Clock, count: recentlyViewedItems.length },
              { key: "purchased", label: "Recently Purchased", icon: ShoppingBag, count: justPurchasedItems.length },
            ] as const
          ).map(({ key, label, icon: Icon, count }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={12} />
                <span>{label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-bold tabular-nums px-1 rounded-sm ${
                      active ? "bg-white/20 text-white" : "bg-muted text-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {activeTab === "recent" && recentlyViewedItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearRecent}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "trending" && <ProductStripCards items={trendingItems} />}

      {activeTab === "recent" &&
        (recentlyViewedItems.length > 0 ? (
          <ProductStripCards items={recentlyViewedItems} />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background/60 p-5 text-center">
            <Clock size={18} className="mx-auto text-muted-foreground mb-1.5" />
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              No products viewed yet in this browser
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Open any inverter, battery, or smart lock to track it here automatically so you can jump right back.
            </p>
          </div>
        ))}

      {activeTab === "purchased" &&
        (justPurchasedItems.length > 0 ? (
          <ProductStripCards items={justPurchasedItems} />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background/60 p-5 text-center">
            <CheckCircle2 size={18} className="mx-auto text-primary mb-1.5" />
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              Verified recent purchases appear here automatically
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We only display real confirmed orders (never simulated activity). Once the storefront RPC migration is applied and ≥ 3 orders are confirmed in the last 14 days, they stream here by state.
            </p>
          </div>
        ))}
    </section>
  );
};

export default ShopTrendingRows;
