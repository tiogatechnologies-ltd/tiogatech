import { useSiteSetting } from "@/hooks/useSiteSetting";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Eye,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  Check,
  Zap,
  Shield,
  TrendingDown,
  Tag,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useProductCompare } from "@/hooks/useProductCompare";
import { productPath } from "@/lib/productSlug";
import { resolveProductImage } from "@/lib/productImages";
import { savingsPct, wasPrice as calcWasPrice, savedAmount as calcSavedAmount, resolveCompareAt } from "@/lib/promoDisplay";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import type { RetailProduct } from "@/types/retail";

import type { GridColumnOption } from "@/components/retail/ColumnGridSwitcher";

interface CardProps {
  product: RetailProduct;
  onQuickView?: (product: RetailProduct) => void;
  customBadge?: string;
  layout?: "grid" | "list";
  columns?: GridColumnOption;
}

const fmt = (n?: number | null, fallback?: string | null) => {
  if (n != null && !Number.isNaN(n) && n > 0) return `₦${Math.round(n).toLocaleString("en-NG")}`;
  if (fallback) return fallback;
  return "Price on Request";
};

export const ProductCard = ({ product, onQuickView, customBadge, layout = "grid", columns }: CardProps) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useProductCompare();
  const { settings: promos } = useSiteSetting("promotions");
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isCompact = columns === 4 || columns === 5;

  const isSaved = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  // The struck-through price. Uses this product's recorded previous price when
  // one is set, otherwise the list-price markup from Admin > Settings. The real
  // charge is always product.numeric_price.
  const hasPrice = !!(product.numeric_price && product.numeric_price > 0);
  const compareAt = resolveCompareAt(product.numeric_price, (product as any).compare_at_price, promos);
  const pct = savingsPct(product.numeric_price, compareAt);
  const wasPrice = calcWasPrice(product.numeric_price, compareAt);
  const savedAmount = calcSavedAmount(product.numeric_price, compareAt);
  const monthlyEst = product.numeric_price ? Math.round(product.numeric_price / 3) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      refId: product.id,
      type: "product",
      name: product.name,
      price: product.price,
      numericPrice: product.numeric_price,
      image: product.image_url,
      category: product.category,
      quantity: 1,
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id, product.name);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`group relative rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex ${
        layout === "list" ? "flex-col sm:flex-row items-stretch" : "flex-col"
      } overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Image Container */}
      <div
        className={`relative ${
          layout === "list"
            ? "w-full sm:w-60 shrink-0 aspect-square sm:aspect-auto sm:min-h-[220px]"
            : "aspect-square w-full"
        } overflow-hidden bg-muted/15 flex items-center justify-center p-3 sm:p-4`}
      >
        <Link to={productPath(product)} className="w-full h-full flex items-center justify-center">
          <img
            src={resolveProductImage(product.image_url, product.category, product.name)}
            alt={product.name}
            loading="lazy"
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-sm"
          />
        </Link>

        {/* Gradient overlay for bottom legibility */}
        {/* Left Badges (top-left stack) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none max-w-[65%]">
          {pct && (
            <span className="px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur-md border border-white/25 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1 w-fit">
              <TrendingDown size={10} /> Save {pct}%
            </span>
          )}
          {customBadge && (
            <span className="px-2 py-0.5 rounded-full bg-primary/90 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 w-fit">
              {customBadge}
            </span>
          )}
          {product.is_featured && !customBadge && !pct && (
            <span className="px-2 py-0.5 rounded-full bg-gold/90 backdrop-blur-md border border-gold/40 text-midnight text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md w-fit">
              Featured
            </span>
          )}
        </div>

        {/* Floating Action Buttons (top-right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlist}
            aria-label={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
              isSaved
                ? "bg-red-500 text-white shadow-red-500/20 scale-110"
                : "bg-background/80 hover:bg-background text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>

          <button
            onClick={handleCompare}
            aria-label="Compare Product"
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
              isCompared
                ? "bg-primary text-primary-foreground scale-110"
                : "bg-background/80 hover:bg-background text-muted-foreground hover:text-primary"
            }`}
          >
            <SlidersHorizontal size={15} />
          </button>

          {onQuickView && (
            <button
              onClick={handleQuickView}
              aria-label="Quick View"
              className="p-2 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground backdrop-blur-md transition-all shadow-md"
            >
              <Eye size={15} />
            </button>
          )}
        </div>

        {/* Quick Add Overlay on Hover */}
        <div
          className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
              addedAnimation
                ? "bg-emerald-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {addedAnimation ? (
              <>
                <Check size={14} className="animate-bounce" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Quick Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className={`${isCompact ? "p-3 sm:p-3.5" : "p-4 sm:p-5"} flex flex-col flex-1`}>
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="uppercase tracking-wider font-semibold text-[10px] text-primary truncate">
              {product.category}
            </span>
            {(product.serial_number || product.sku) && (
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-muted/80 text-[9px] font-mono font-bold text-muted-foreground border border-border">
                {product.serial_number || product.sku}
              </span>
            )}
          </div>
          {/* Only real ratings. This used to fall back to 5.0 with 12 reviews
              for every product, including ones nobody had reviewed. */}
          {product.rating && product.review_count ? (
            <div className="flex items-center gap-1 font-medium text-amber-500 shrink-0">
              <Star size={13} fill="currentColor" />
              <span className="text-foreground font-bold">{product.rating}</span>
              <span className="text-muted-foreground text-[10px]">({product.review_count})</span>
            </div>
          ) : null}
        </div>

        {/* Product Title */}
        <Link
          to={productPath(product)}
          className={`font-display font-bold ${isCompact ? "text-xs sm:text-sm leading-snug" : "text-sm leading-snug"} text-foreground hover:text-primary transition-colors line-clamp-2 mb-2 min-h-[2.25rem]`}
        >
          {product.name}
        </Link>

        {/* Highlights / Specs Chips */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {Object.entries(product.specifications).slice(0, isCompact ? 1 : 2).map(([key, val]) => (
              <span
                key={key}
                className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium max-w-full truncate"
              >
                <span className="truncate">{key}: <strong className="text-foreground">{val}</strong></span>
              </span>
            ))}
          </div>
        )}

        {/* Price & Financing */}
        <div className="mt-auto pt-2.5 border-t border-border/60">
          <div className="flex items-start justify-between gap-1.5 mb-1.5 flex-wrap">
            <div className="min-w-0 flex-1">
              {/* Main Price */}
              <p className={`${isCompact ? "text-sm sm:text-base" : "text-base sm:text-lg"} font-display font-bold text-foreground leading-tight`}>
                {product.numeric_price ? (
                  <AnimatedCounter target={product.numeric_price} prefix="₦" />
                ) : (
                  fmt(product.numeric_price, product.price)
                )}
              </p>
              {/* Was Price (slashed) */}
              {wasPrice && savedAmount && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    ₦{Math.round(wasPrice).toLocaleString("en-NG")}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 whitespace-nowrap">
                    <Tag size={9} /> Save <AnimatedCounter target={Math.round(savedAmount)} prefix="₦" />
                  </span>
                </div>
              )}
              {/* Monthly payment hint */}
              {monthlyEst && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Or from <strong className="text-primary"><AnimatedCounter target={monthlyEst} prefix="₦" suffix="/mo" /></strong>
                </p>
              )}
            </div>

            {/* In stock badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Stock
            </span>
          </div>

          {/* Quick Add Button (always visible on mobile, or in list layout on desktop) */}
          <button
            onClick={handleAddToCart}
            className={`mt-2 w-full py-2 px-4 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-2 transition-all ${
              layout === "list" ? "flex sm:w-auto sm:self-start" : "lg:hidden"
            } ${
              addedAnimation
                ? "bg-emerald-600 text-white"
                : "bg-primary/10 border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {addedAnimation ? (
              <><Check size={13} /> Added!</>
            ) : (
              <><ShoppingCart size={13} /> Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
