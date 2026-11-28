import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import type { RetailProduct } from "@/types/retail";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import { useLandingContent } from "@/hooks/useLandingContent";
import { useWishlist } from "@/hooks/useWishlist";
import {
  resolveRealCompareAt,
  savingsPct,
  wasPrice as calcWasPrice,
} from "@/lib/promoDisplay";
import { resolveProductImage, handleProductImageError } from "@/lib/productImages";
import { productPath } from "@/lib/productSlug";
import { resolveCampaignEndsAt, useSharedCountdown } from "@/lib/countdownTicker";

interface BlackFridayDealsRowProps {
  products: RetailProduct[];
  onSelectProduct?: (product: RetailProduct) => void;
}

const fmtNaira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/**
 * WS5 - Horizontal Black Friday Deal Cards Row (Intavalto reference).
 *
 * Strictly obeys honesty rules:
 * - Only renders while the Black Friday campaign countdown is active (`ends_at` in the future).
 * - Only displays discount percentages backed by real configured sources
 *   (product override, recorded `compare_at_price`, or explicit brand policy like SRNE/Luxpower 20%).
 * - Uses the single shared F3 countdown ticker across all cards (zero per-card intervals).
 * - Uses squared `rounded-md` labels (no pill-shaped badges).
 */
export const BlackFridayDealsRow = ({ products, onSelectProduct }: BlackFridayDealsRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { settings: promos } = useSiteSetting("promotions");
  const { content: flashDeal } = useLandingContent("flash_deal");
  const { isInWishlist, toggleWishlist } = useWishlist();

  const endsAt = resolveCampaignEndsAt((flashDeal as any)?.ends_at);
  const countdown = useSharedCountdown(endsAt);

  const dealCards = useMemo(() => {
    if (!products.length) return [];
    const curatedIds = Array.isArray(promos?.flash_deal_product_ids)
      ? promos.flash_deal_product_ids
      : [];

    // Evaluate real discount sources (priority 1: product override, 2: genuine compare_at_price, 3: brand policy).
    // Even if storewide compare-at markup is off for regular listings, active Black Friday deal cards
    // still evaluate genuine overrides, recorded compare_at_price, and brand discount policies.
    const realOpts = {
      ...promos,
      show_compare_at_price: true,
    };

    const enrich = (p: RetailProduct) => {
      const price =
        p.numeric_price && p.numeric_price > 0
          ? p.numeric_price
          : Number(String(p.price || "").replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(price) || price <= 0) return null;

      const realCompareAt = resolveRealCompareAt(
        price,
        p.compare_at_price,
        realOpts,
        p.id,
        p.brand,
      );
      const was = calcWasPrice(price, realCompareAt);
      const pct = savingsPct(price, realCompareAt);
      if (!was || !pct) return null;

      const isLimited =
        Boolean((p as any).stock_quantity && (p as any).stock_quantity <= 5) ||
        pct >= 20;

      return { product: p, price, was, pct, isLimited };
    };

    // 1. Admin curated list first
    if (curatedIds.length > 0) {
      const byId = new Map(products.map((p) => [p.id, p]));
      const curated = curatedIds
        .map((id) => byId.get(id))
        .filter((p): p is RetailProduct => Boolean(p))
        .map(enrich)
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (curated.length > 0) return curated.slice(0, 12);
    }

    // 2. Genuine real-discount items, prioritizing recorded compare_at_price and brand diversity
    const eligible = products
      .map(enrich)
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => {
        const aReal = Number(a.product.compare_at_price) > a.price ? 1 : 0;
        const bReal = Number(b.product.compare_at_price) > b.price ? 1 : 0;
        if (bReal !== aReal) return bReal - aReal;
        return b.pct - a.pct;
      });

    const picked: typeof eligible = [];
    const perCat = new Map<string, number>();
    for (const item of eligible) {
      if (picked.length >= 12) break;
      const cat = (item.product.category || "Other").toLowerCase();
      const count = perCat.get(cat) || 0;
      if (count >= 4) continue;
      picked.push(item);
      perCat.set(cat, count + 1);
    }
    return picked;
  }, [products, promos]);

  if (
    !countdown.active ||
    promos?.show_black_friday_badges === false ||
    (flashDeal && (flashDeal as any).is_active === false) ||
    dealCards.length === 0
  ) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 640), behavior: "smooth" });
  };

  return (
    <section
      aria-label="Black Friday Flash Deals"
      data-testid="black-friday-deals-row"
      className="mb-8"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">
            Black Friday Deals · 23–29 Nov 2026
          </p>
          <h2 className="text-base sm:text-lg font-display font-bold text-foreground leading-tight">
            Flash Deal Drops Ending Soon
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Scroll deals left"
            className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted text-foreground grid place-items-center transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Scroll deals right"
            className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted text-foreground grid place-items-center transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-3.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-1 px-1"
      >
        {dealCards.map(({ product, price, was, pct, isLimited }) => {
          const saved = isInWishlist(product.id);
          const href = productPath(product);
          return (
            <article
              key={product.id}
              className="snap-start shrink-0 w-[198px] sm:w-[214px] rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col overflow-hidden group"
            >
              {/* Image + Squared Top Badges + Wishlist */}
              <div className="relative h-36 sm:h-40 bg-muted/15 p-3 pb-6 flex items-center justify-center">
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#16a34a] text-white text-[10px] font-extrabold tracking-wide leading-none shadow-xs">
                    -{pct}%
                  </span>
                  {isLimited && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider leading-none shadow-xs">
                      LIMITED
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(product.id, product.name);
                  }}
                  aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                  className={`absolute top-2.5 right-2.5 z-10 h-7 w-7 rounded-md grid place-items-center border transition-colors ${
                    saved
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-500"
                      : "bg-card/90 border-border text-muted-foreground hover:text-rose-500"
                  }`}
                >
                  <Heart size={13} fill={saved ? "currentColor" : "none"} />
                </button>

                <Link
                  to={href}
                  onClick={() => onSelectProduct?.(product)}
                  className="w-full h-full flex items-center justify-center"
                >
                  <img
                    src={resolveProductImage(product.image_url, product.category, product.name)}
                    onError={handleProductImageError}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
              </div>

              {/* Floating 4-Box Mini Countdown Strip overlapping lower image edge (Intavalto style) */}
              <div
                role="timer"
                aria-live="off"
                className="-mt-4 mx-2.5 relative z-10 grid grid-cols-4 gap-1 p-1.5 rounded-lg bg-card border border-border shadow-sm text-center tabular-nums"
              >
                {[
                  { val: pad(countdown.d), label: "DAYS" },
                  { val: pad(countdown.h), label: "HOURS" },
                  { val: pad(countdown.m), label: "MINS" },
                  { val: pad(countdown.s), label: "SECS" },
                ].map((unit) => (
                  <div key={unit.label} className="leading-none py-0.5">
                    <span className="block font-mono text-[11px] font-extrabold text-foreground">
                      {unit.val}
                    </span>
                    <span className="block text-[7.5px] font-semibold tracking-wider text-muted-foreground mt-0.5">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Product Title & Honest Pricing */}
              <div className="p-3 pt-2.5 flex flex-col flex-1 text-center">
                <Link
                  to={href}
                  onClick={() => onSelectProduct?.(product)}
                  className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2rem]"
                >
                  {product.name}
                </Link>
                <div className="mt-auto pt-2">
                  <span className="block text-[11px] text-muted-foreground line-through tabular-nums">
                    {fmtNaira(was)}
                  </span>
                  <span className="block text-sm font-display font-extrabold text-foreground tabular-nums">
                    {fmtNaira(price)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default BlackFridayDealsRow;
