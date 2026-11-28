import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useRegisterBottomBar } from "@/lib/floatingLayers";
import { isProductDetailRoute, isShopRoute } from "@/lib/shopRoutes";
import {
  removePendingProduct,
  usePendingProducts,
} from "@/lib/pendingProducts";
import { trackConversion } from "@/lib/tracking";

/**
 * WS7b - Persistent Cross-Page "Still Deciding?" Reminder Bar.
 *
 * Mounted globally in `App.tsx`, renders ONLY on shop routes (`/retail*`, `/catalog*`)
 * when the visitor has viewed a product without adding it to cart and is NOT currently
 * on a product detail page (where `StickyBuyBar` owns the bottom bar slot - never two
 * bottom bars at once).
 *
 * Keeps the last 3 viewed-but-uncarted products synced across back/forward navigation
 * and browser tabs, with `‹ 1 of N ›` switching, 1-click Add to Cart, and dismiss `×`.
 */
export const StillDecidingBar = () => {
  const { pathname } = useLocation();
  const { add, items: cartItems } = useCart();
  const pending = usePendingProducts();
  const [index, setIndex] = useState(0);

  // Filter out anything already in the cart
  const cartIds = new Set(cartItems.flatMap((c) => [c.id, c.refId]));
  const eligible = pending.filter(
    (p) => !cartIds.has(p.id) && !cartIds.has(p.refId) && !cartIds.has(`${p.type}:${p.refId}`),
  );

  // Keep index valid whenever the list changes (e.g. newest item pushed to top)
  useEffect(() => {
    setIndex(0);
  }, [eligible[0]?.id, eligible.length]);

  const onShopListing = isShopRoute(pathname) && !isProductDetailRoute(pathname);
  const current = eligible[Math.min(index, Math.max(0, eligible.length - 1))];
  const visible = Boolean(onShopListing && current);

  // Register height with F1 Floating Layer Manager so chat bubble / back-to-top / toast never collide
  useRegisterBottomBar("still_deciding_bar", visible, 62);

  if (!visible || !current) return null;

  const handleAdd = () => {
    add({
      refId: current.refId,
      type: current.type,
      name: current.name,
      price: current.priceLabel,
      numericPrice: current.numericPrice,
      image: current.image,
      category: current.category,
      quantity: current.qty || 1,
    });
    removePendingProduct(current.id);
    trackConversion("sticky_add", {
      source: "reminder_bar",
      id: current.refId,
      name: current.name,
    });
  };

  const handleDismiss = () => {
    removePendingProduct(current.id);
  };

  return (
    <div
      data-testid="still-deciding-bar"
      role="region"
      aria-label="Recently viewed product reminder"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl shadow-[0_-8px_28px_rgba(0,0,0,0.12)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="section-container-wide py-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Thumbnail + Prompt + Product Link */}
        <Link
          to={current.slug}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 group"
        >
          {current.image ? (
            <div className="h-10 w-10 rounded-md border border-border bg-muted/30 p-1 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={current.image}
                alt={current.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
              Still thinking about this?
            </span>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-display font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {current.name}
              </span>
              <span className="text-xs sm:text-sm font-display font-extrabold text-primary shrink-0 tabular-nums">
                {current.priceLabel}
              </span>
            </div>
          </div>
        </Link>

        {/* Right: Pager (when >1 pending item) + Add to Cart + Dismiss */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {eligible.length > 1 && (
            <div className="hidden sm:inline-flex items-center gap-1 px-1.5 py-1 rounded-md border border-border bg-background text-[11px] font-semibold text-muted-foreground tabular-nums">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + eligible.length) % eligible.length)}
                aria-label="Previous viewed product"
                className="p-0.5 hover:text-foreground transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-0.5">
                {Math.min(index + 1, eligible.length)} of {eligible.length}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % eligible.length)}
                aria-label="Next viewed product"
                className="p-0.5 hover:text-foreground transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 h-9 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors shadow-xs"
          >
            <ShoppingBag size={13} />
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss reminder"
            className="h-9 w-9 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StillDecidingBar;
