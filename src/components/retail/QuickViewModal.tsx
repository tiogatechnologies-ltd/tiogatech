import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Shield, Check, Heart, ArrowRight, X, TrendingDown, Tag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { productPath } from "@/lib/productSlug";
import { resolveProductImage } from "@/lib/productImages";
import type { RetailProduct } from "@/types/retail";

interface QuickViewProps {
  product: RetailProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmt = (n?: number | null, fallback?: string | null) => {
  if (n != null && !Number.isNaN(n) && n > 0) return `₦${Math.round(n).toLocaleString("en-NG")}`;
  if (fallback) return fallback;
  return "Price on Request";
};

const PROMO_LIFT = 1.13;
const hashNum = (id: string, mod: number, offset = 0) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return offset + (h % mod);
};
const savingsPct = (id: string) => hashNum(id, 9, 8);

export const QuickViewModal = ({ product, open, onOpenChange }: QuickViewProps) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const isSaved = isInWishlist(product.id);
  const hasPrice = !!(product.numeric_price && product.numeric_price > 0);
  const pct = hasPrice ? savingsPct(product.id) : null;
  const wasPrice = hasPrice ? Math.round(product.numeric_price! * PROMO_LIFT) : null;
  const savedAmount = hasPrice && wasPrice ? wasPrice - product.numeric_price! : null;

  const handleAddToCart = () => {
    add({
      refId: product.id,
      type: "product",
      name: product.name,
      price: product.price,
      numericPrice: product.numeric_price,
      image: product.image_url,
      category: product.category,
      quantity,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onOpenChange(false);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Image */}
          <div className="relative bg-muted/30 p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            <img
              src={resolveProductImage(product.image_url, product.category)}
              alt={product.name}
              className="max-h-72 w-full object-contain drop-shadow-lg"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.brand && (
                <span className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md">
                  {product.brand}
                </span>
              )}
              {pct && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow flex items-center gap-1">
                  <TrendingDown size={10} /> Save {pct}%
                </span>
              )}
            </div>
          </div>

          {/* Right: Details & Actions */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="uppercase tracking-wider font-bold text-primary text-[10px]">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Star size={14} fill="currentColor" />
                  <span className="text-foreground">{product.rating || "5.0"}</span>
                  <span className="text-muted-foreground text-xs">({product.review_count || 12} reviews)</span>
                </div>
              </div>

              <DialogTitle className="text-xl font-display font-bold text-foreground leading-snug">
                {product.name}
              </DialogTitle>

              <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                <p className="text-2xl font-display font-bold text-foreground">
                  {fmt(product.numeric_price, product.price)}
                </p>
                {wasPrice && savedAmount && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground line-through">
                      ₦{Math.round(wasPrice).toLocaleString("en-NG")}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Save ₦{Math.round(savedAmount).toLocaleString("en-NG")}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                {product.description}
              </p>

              {/* Specs Glance */}
              {product.specifications && (
                <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-muted/40 text-xs">
                  {Object.entries(product.specifications).slice(0, 4).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-muted-foreground text-[10px] block uppercase tracking-wider">{k}</span>
                      <strong className="text-foreground font-medium">{v}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity and CTA */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-foreground hover:bg-muted font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 font-mono font-bold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2 text-foreground hover:bg-muted font-bold transition-colors"
                  >
                    +
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={added}
                  className="flex-1 py-5 rounded-xl font-bold gap-2 text-sm shadow-md"
                >
                  {added ? (
                    <>
                      <Check size={16} className="text-white" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} />
                      <span>Add to Cart ({quantity})</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => toggleWishlist(product.id, product.name)}
                  className={`p-3 rounded-xl ${isSaved ? "text-red-500 border-red-300" : ""}`}
                >
                  <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <Link
                  to={productPath(product)}
                  onClick={() => onOpenChange(false)}
                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <span>View Full Technical Specs & Reviews</span>
                  <ArrowRight size={13} />
                </Link>
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Shield size={12} className="text-emerald-500" />
                  Warranty Protected
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
