import { useEffect, useState, type RefObject } from "react";
import { ArrowRight, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useRegisterBottomBar } from "@/lib/floatingLayers";
import { trackConversion } from "@/lib/tracking";

export interface StickyBuyBarProps {
  /** Unique id for F1 floating layer manager (e.g. "pdp_sticky_buy_bar") */
  barId?: string;
  /** Ref to the main buy box element on the page; bar appears once it scrolls out of view. */
  observeTargetRef: RefObject<HTMLElement | null>;
  refId: string;
  name: string;
  image?: string | null;
  priceLabel: string;
  numericPrice?: number | null;
  quantity?: number;
  onQuantityChange?: (nextQty: number) => void;
  inCart: boolean;
  onAddToCart: () => void;
  onCheckout: () => void;
}

/**
 * WS7a — Sticky Product / Package Buy Bar (Intavalto reference).
 *
 * Uses `IntersectionObserver` on the primary buy box so it slides up smoothly
 * once the visitor scrolls past the buy box and hides when they scroll back up.
 * Registers its height with F1 (`--bottom-bar-h`) so floating chat & back-to-top
 * buttons never overlap on desktop or 375px mobile.
 */
export const StickyBuyBar = ({
  barId = "pdp_sticky_buy_bar",
  observeTargetRef,
  refId,
  name,
  image,
  priceLabel,
  numericPrice,
  quantity = 1,
  onQuantityChange,
  inCart,
  onAddToCart,
  onCheckout,
}: StickyBuyBarProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = observeTargetRef.current;
    if (!target || typeof window === "undefined") {
      setVisible(false);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const onScroll = () => setVisible(window.scrollY > 420);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show only after scrolling PAST the buy box (its bottom is above the viewport)
        const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setVisible(scrolledPast);
      },
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [observeTargetRef, refId]);

  const canBuy = numericPrice == null || numericPrice > 0;
  const shouldShow = visible && canBuy;

  // F1: Keep floating widgets (chat bubble, scroll-to-top, social proof toast) clear of this bar
  useRegisterBottomBar(barId, shouldShow, 68);

  if (!canBuy) return null;

  return (
    <div
      data-testid="sticky-buy-bar"
      aria-hidden={!shouldShow}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl shadow-[0_-8px_28px_rgba(0,0,0,0.12)] transition-transform duration-250 ease-out ${
        shouldShow ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="section-container-wide py-2.5 flex items-center justify-between gap-3">
        {/* Left: Thumbnail + Truncated Name + Price */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {image ? (
            <div className="h-11 w-11 rounded-md border border-border bg-muted/30 p-1 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={image}
                alt={name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-display font-bold text-foreground truncate">
              {name}
            </p>
            <p className="text-sm sm:text-base font-display font-extrabold text-primary leading-tight tabular-nums">
              {priceLabel}
            </p>
          </div>
        </div>

        {/* Right: Synced Qty Stepper (desktop/tablet) + Squared Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!inCart && onQuantityChange && (
            <div className="hidden sm:inline-flex items-center rounded-md border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="h-8 w-8 grid place-items-center rounded-sm hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
              >
                <Minus size={13} />
              </button>
              <span className="w-8 text-center font-mono text-xs font-bold text-foreground tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(quantity + 1)}
                aria-label="Increase quantity"
                className="h-8 w-8 grid place-items-center rounded-sm hover:bg-muted text-muted-foreground transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>
          )}

          {inCart ? (
            <button
              type="button"
              onClick={onCheckout}
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm"
            >
              <Check size={15} className="stroke-[2.75]" />
              <span>In your cart · Checkout</span>
              <ArrowRight size={14} className="hidden sm:inline" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                trackConversion("sticky_add", { source: "pdp_bar", id: refId, qty: quantity });
                onAddToCart();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold uppercase tracking-wide transition-colors shadow-sm"
            >
              <ShoppingBag size={15} />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyBuyBar;
