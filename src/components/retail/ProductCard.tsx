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
  Flame,
  Users,
  Tag,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useProductCompare } from "@/hooks/useProductCompare";
import { productPath } from "@/lib/productSlug";
import { resolveProductImage } from "@/lib/productImages";
import { PROMO_LIFT, viewerCount, soldCount, savingsPct } from "@/lib/promoDisplay";
import type { RetailProduct } from "@/types/retail";

interface CardProps {
  product: RetailProduct;
  onQuickView?: (product: RetailProduct) => void;
  customBadge?: string;
}

const fmt = (n?: number | null, fallback?: string | null) => {
  if (n != null && !Number.isNaN(n) && n > 0) return `₦${Math.round(n).toLocaleString("en-NG")}`;
  if (fallback) return fallback;
  return "Price on Request";
};

export const ProductCard = ({ product, onQuickView, customBadge }: CardProps) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useProductCompare();
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isSaved = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  // Cosmetic promo values - real price is always product.numeric_price
  const hasPrice = !!(product.numeric_price && product.numeric_price > 0);
  const pct = hasPrice ? savingsPct(product.id) : null;
  const wasPrice = hasPrice ? Math.round(product.numeric_price! * PROMO_LIFT) : null;
  const savedAmount = hasPrice && wasPrice ? wasPrice - product.numeric_price! : null;
  const viewers = viewerCount(product.id);
  const sold = soldCount(product.id);
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
      className="group relative rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
        <Link to={productPath(product)} className="block w-full h-full">
          <img
            src={resolveProductImage(product.image_url, product.category)}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Gradient overlay for bottom legibility */}
        <div className="absolute inset-0 bg-midnight/30 pointer-events-none" />

        {/* Left Badges (top-left stack) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none max-w-[65%]">
          {pct && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow flex items-center gap-1 w-fit">
              <TrendingDown size={10} /> Save {pct}%
            </span>
          )}
          {customBadge && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow flex items-center gap-1 w-fit">
              {customBadge}
            </span>
          )}
          {product.is_featured && !customBadge && !pct && (
            <span className="px-2 py-0.5 rounded-full bg-gold text-midnight text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow w-fit">
              Featured
            </span>
          )}
        </div>

        {/* Live Viewers (bottom-left overlay on image) */}
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold bg-midnight/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full shadow-sm">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            {viewers} viewing
          </span>
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
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span className="uppercase tracking-wider font-semibold text-[10px] text-primary">
            {product.category}
          </span>
          <div className="flex items-center gap-1 font-medium text-amber-500">
            <Star size={13} fill="currentColor" />
            <span className="text-foreground font-bold">{product.rating || "5.0"}</span>
            <span className="text-muted-foreground text-[10px]">({product.review_count || 12})</span>
          </div>
        </div>

        {/* Product Title */}
        <Link
          to={productPath(product)}
          className="font-display font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-2"
        >
          {product.name}
        </Link>

        {/* Highlights / Specs Chips */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(product.specifications).slice(0, 2).map(([key, val]) => (
              <span
                key={key}
                className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-medium"
              >
                {key}: <strong className="text-foreground">{val}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Sold count urgency */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3">
          <Users size={11} className="text-emerald-500 shrink-0" />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{sold} sold this week</span>
          <span className="opacity-50">·</span>
          <Flame size={11} className="text-amber-500 shrink-0" />
          <span className="text-amber-600 dark:text-amber-400 font-semibold">In demand</span>
        </div>

        {/* Price & Financing */}
        <div className="mt-auto pt-3 border-t border-border/60">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              {/* Main Price */}
              <p className="text-base sm:text-lg font-display font-bold text-foreground leading-none">
                {fmt(product.numeric_price, product.price)}
              </p>
              {/* Was Price (slashed) */}
              {wasPrice && savedAmount && (
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    ₦{Math.round(wasPrice).toLocaleString("en-NG")}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 whitespace-nowrap">
                    <Tag size={9} /> Save ₦{Math.round(savedAmount).toLocaleString("en-NG")}
                  </span>
                </div>
              )}
              {/* Monthly payment hint */}
              {monthlyEst && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Or from <strong className="text-primary">₦{monthlyEst.toLocaleString()}/mo</strong>
                </p>
              )}
            </div>

            {/* In stock badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Stock
            </span>
          </div>

          {/* Quick Add Button (always visible on mobile) */}
          <button
            onClick={handleAddToCart}
            className={`mt-2 w-full py-2 px-4 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-2 transition-all lg:hidden ${
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
