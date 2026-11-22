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
import { resolveProductImage, handleProductImageError, isRepresentativeProductImage, getProductPhotoCaption } from "@/lib/productImages";
import { savingsPct, wasPrice as calcWasPrice, savedAmount as calcSavedAmount, resolveCompareAt, resolvePromoBadge, isBlackFridayProduct } from "@/lib/promoDisplay";
import type { RetailProduct } from "@/types/retail";
import { stockStatusLabel } from "@/lib/productAvailability";
import { formatRetailPrice } from "@/lib/retailPricing";

import type { GridColumnOption } from "@/components/retail/ColumnGridSwitcher";

interface CardProps {
  product: RetailProduct;
  onQuickView?: (product: RetailProduct) => void;
  customBadge?: string;
  layout?: "grid" | "list";
  columns?: GridColumnOption;
}

const fmt = (n?: number | null, fallback?: string | null) => {
  if (n != null && !Number.isNaN(n) && n > 0) return formatRetailPrice(n);
  if (fallback) return fallback;
  return "Price on Request";
};

const formatSpecs = (specs: Record<string, string>, maxCount: number) => {
  const result: { label: string; value: string }[] = [];
  for (const [key, rawVal] of Object.entries(specs)) {
    if (!rawVal || /price|dealer|installer/i.test(key)) continue;
    // Clean raw value: take first segment before / or (
    const val = rawVal.split("/")[0].split("(")[0].trim();
    let label = key;
    if (key.includes("Rated AC Output") || key.includes("Power Output") || key.includes("Rated Power")) {
      label = "Power";
    } else if (key.includes("Nominal DC Voltage") || key.includes("Battery Voltage") || key.includes("Voltage")) {
      label = "Voltage";
    } else if (key.includes("Capacity") || key.includes("Usable Capacity")) {
      label = "Capacity";
    } else if (key.includes("Max Solar PV Input") || key.includes("PV Input")) {
      label = "Max PV";
    } else if (key.includes("MPPT")) {
      label = "MPPT";
    } else if (key.includes("Warranty")) {
      label = "Warranty";
    } else if (key.includes("Switch Time")) {
      label = "UPS Switch";
    } else if (key.includes("Resolution")) {
      label = "Res";
    }
    result.push({ label, value: val });
    if (result.length >= maxCount) break;
  }
  return result;
};

export const ProductCard = ({ product, onQuickView, customBadge, layout = "grid", columns }: CardProps) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useProductCompare();
  const { settings: promos } = useSiteSetting("promotions");
  const { settings: features } = useSiteSetting("features");
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isCompact = columns === 4 || columns === 5;
  const isMobileTwoCol = layout === "grid" && columns !== 1;
  const isListLayout = layout === "list";
  const productImage = resolveProductImage(product.image_url, product.category, product.name);

  const isSaved = isInWishlist(product.id);
  const isCompared = isInCompare(product.id, product.name);

  // The struck-through price. Uses per-product override when set, otherwise storewide markup
  const compareAt = resolveCompareAt(
    product.numeric_price,
    (product as any).compare_at_price,
    promos,
    product.id,
    product.brand
  );
  const pct = savingsPct(product.numeric_price, compareAt);
  const wasPrice = calcWasPrice(product.numeric_price, compareAt);
  const savedAmount = calcSavedAmount(product.numeric_price, compareAt);
  const promoBadge = resolvePromoBadge(product.id, promos, customBadge);
  const isBlackFriday = isBlackFridayProduct(product.category, product.name, promos);
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
      image: productImage,
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
      className={`group relative rounded-xl sm:rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex ${
        isListLayout ? "flex-row items-stretch" : "flex-col"
      } overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top / Left Image Container */}
      <div
        className={`relative ${
          isListLayout
            ? "w-28 xs:w-32 sm:w-56 md:w-60 shrink-0 min-h-[132px] sm:min-h-[210px] p-2 sm:p-4"
            : `${isCompact ? "aspect-square" : isMobileTwoCol ? "aspect-square sm:aspect-[4/3]" : "aspect-[4/3]"} w-full p-2 sm:p-4`
        } overflow-hidden bg-muted/15 flex items-center justify-center`}
      >
        <Link data-product-photo-container to={productPath(product)} className="w-full h-full flex items-center justify-center">
          <img onError={handleProductImageError}
            src={productImage}
            alt={product.name}
            data-product-category={product.category}
                    data-product-brand={product.brand}
            loading="lazy"
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-sm"
          />
          <span data-product-photo-note hidden={!isRepresentativeProductImage(product.image_url, product.category, product.name)} className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-muted-foreground bg-background/80 py-0.5">{getProductPhotoCaption(product.image_url, product.name)}</span>
        </Link>

        {/* Gradient overlay for bottom legibility */}
        {/* Left Badges (top-left stack) */}
        <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 flex flex-col gap-1 z-10 pointer-events-none max-w-[78%]">
          {isBlackFriday && (
            <span
              data-testid="black-friday-badge"
              className="px-1.5 sm:px-2 py-0.5 rounded-full bg-zinc-950/95 text-white border border-emerald-400/60 text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-md flex items-center w-fit"
            >
              <span>BLACK FRIDAY</span>
            </span>
          )}
          {pct && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-red-600 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-0.5 sm:gap-1 w-fit">
              <TrendingDown size={9} className="stroke-[2.5] shrink-0" />
              {promos?.badge_format === "save_pct" ? `Save ${pct}%` : `${pct}% OFF`}
            </span>
          )}
          {promoBadge && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/95 backdrop-blur-md border border-white/20 text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-0.5 sm:gap-1 w-fit">
              <Zap size={9} /> {promoBadge}
            </span>
          )}
        </div>

        {/* Floating Action Buttons (top-right) */}
        <div className={`absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 flex flex-col ${isCompact ? "gap-1" : "gap-1 sm:gap-1.5"} z-10`}>
          <button
            onClick={handleWishlist}
            aria-label={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
            className={`${isCompact ? "h-8 w-8 sm:h-9 sm:w-9" : "h-7 w-7 sm:h-10 sm:w-10"} grid place-items-center rounded-full backdrop-blur-md transition-all shadow-md ${
              isSaved
                ? "bg-red-500 text-white shadow-red-500/20 scale-105"
                : "bg-background/85 hover:bg-background text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart size={isCompact ? 13 : 13} className="sm:w-[15px] sm:h-[15px]" fill={isSaved ? "currentColor" : "none"} />
          </button>

          <button
            onClick={handleCompare}
            aria-label="Compare Product"
            className={`${isCompact ? "h-8 w-8 sm:h-9 sm:w-9" : "h-7 w-7 sm:h-10 sm:w-10"} ${isListLayout || isMobileTwoCol ? "hidden sm:grid" : "grid"} place-items-center rounded-full backdrop-blur-md transition-all shadow-md ${
              isCompared
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-background/85 hover:bg-background text-muted-foreground hover:text-primary"
            }`}
          >
            <SlidersHorizontal size={isCompact ? 13 : 13} className="sm:w-[15px] sm:h-[15px]" />
          </button>

          {onQuickView && (
            <button
              onClick={handleQuickView}
              aria-label="Quick View"
              className={`${isCompact ? "h-8 w-8 sm:h-9 sm:w-9" : "h-7 w-7 sm:h-10 sm:w-10"} ${isListLayout ? "hidden sm:grid" : "grid"} place-items-center rounded-full bg-background/85 hover:bg-background text-muted-foreground hover:text-foreground backdrop-blur-md transition-all shadow-md`}
            >
              <Eye size={isCompact ? 13 : 13} className="sm:w-[15px] sm:h-[15px]" />
            </button>
          )}
        </div>

        {/* Quick Add Overlay on Hover (desktop grid only) */}
        <div
          className={`hidden lg:block absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ${
            isHovered && !isListLayout ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <button
            onClick={handleAddToCart}
            disabled={!product.numeric_price}
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
                <span>{product.numeric_price ? "Quick Add to Cart" : "Price on Request"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className={`${isCompact ? "p-2.5 sm:p-3.5" : isListLayout ? "p-2.5 sm:p-4" : isMobileTwoCol ? "p-2.5 sm:p-4" : "p-3.5 sm:p-4"} flex flex-col flex-1 min-w-0`}>
        {/* Category & Stock Status Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="uppercase tracking-wider font-semibold text-[9px] sm:text-[10px] text-primary truncate">
              {product.category}
            </span>
            {(product.serial_number || product.sku) && (
              <span className={`shrink-0 px-1 py-0.2 rounded bg-muted/80 text-[8.5px] font-mono font-bold text-muted-foreground border border-border ${isMobileTwoCol ? "hidden sm:inline-block" : ""}`}>
                {product.serial_number || product.sku}
              </span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 text-[8.5px] sm:text-[9.5px] font-semibold shrink-0 ${product.stock_status === "in_stock" || product.stock_status === "low_stock" ? "text-emerald-600 dark:text-emerald-400" : product.stock_status === "out_of_stock" ? "text-destructive" : "text-muted-foreground"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {stockStatusLabel(product.stock_status)}
          </span>
        </div>

        {/* Product Title */}
        <Link
          to={productPath(product)}
          className={`font-display font-bold ${isCompact ? "text-xs leading-snug" : isMobileTwoCol ? "text-xs sm:text-sm leading-snug" : "text-sm leading-snug"} text-foreground hover:text-primary transition-colors line-clamp-2 mb-1.5 sm:mb-2 min-h-[2rem] sm:min-h-[2.2rem]`}
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Highlights / Specs Chips - CONCISE CLEAN FORMAT */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-2">
            {formatSpecs(product.specifications, isCompact ? 1 : 2).map((spec, idx) => (
              <span
                key={idx}
                className={`px-1.5 py-0.5 rounded-md bg-muted/60 text-[8.5px] sm:text-[10px] text-muted-foreground font-medium max-w-full truncate ${isMobileTwoCol && idx > 0 ? "hidden sm:inline-block" : ""}`}
              >
                <span className="truncate">{spec.label}: <strong className="text-foreground">{spec.value}</strong></span>
              </span>
            ))}
          </div>
        )}

        {/* Price & Financing */}
        <div className="mt-auto pt-1.5 sm:pt-2 border-t border-border/60">
          <div className="space-y-0.5">
            {/* Price Row: Selling Price & Slashed Was Price */}
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <p className={`${isCompact ? "text-xs sm:text-base" : isMobileTwoCol ? "text-xs sm:text-lg" : "text-base sm:text-lg"} font-display font-bold text-foreground leading-tight`}>
                {fmt(product.numeric_price, product.price)}
              </p>
              {wasPrice && (
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                  ₦{Math.round(wasPrice).toLocaleString("en-NG")}
                </span>
              )}
            </div>

            {/* Slashed Save Badge */}
            {savedAmount && pct && (
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Tag size={9} className="shrink-0" />
                <span className="truncate">Save ₦{Math.round(savedAmount).toLocaleString("en-NG")} ({pct}%)</span>
              </div>
            )}

            {/* Monthly payment hint (hidden when Easy Flex is turned off by Admin) */}
            {features?.flexible_payment_enabled !== false && monthlyEst && (
              <p className="text-[9px] sm:text-[9.5px] text-muted-foreground truncate">
                From <strong className="text-primary font-bold">₦{Math.round(monthlyEst).toLocaleString("en-NG")}/mo</strong>
              </p>
            )}
          </div>

          {/* Quick Add Button (always visible on mobile, or in list layout on desktop) */}
          <button
            onClick={handleAddToCart}
            disabled={!product.numeric_price}
            className={`mt-1.5 sm:mt-2 w-full ${isMobileTwoCol ? "py-1.5 px-2.5 sm:py-2 sm:px-4 text-[11px] sm:text-xs" : "py-2 px-3 sm:px-4 text-xs"} rounded-lg sm:rounded-xl font-bold shadow flex items-center justify-center gap-1.5 transition-all ${
              isListLayout ? "flex sm:w-auto sm:self-start" : "lg:hidden"
            } ${
              addedAnimation
                ? "bg-emerald-600 text-white"
                : "bg-primary/10 border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {addedAnimation ? (
              <><Check size={12} className="shrink-0" /> <span>Added!</span></>
            ) : (
              <><ShoppingCart size={12} className="shrink-0" /> <span className="truncate">{product.numeric_price ? (isMobileTwoCol ? "Add" : "Add to Cart") : "Quote"}</span></>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
