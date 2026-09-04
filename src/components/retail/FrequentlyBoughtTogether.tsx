import { useState } from "react";
import { Plus, Check, ShoppingCart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { RetailProduct } from "@/types/retail";

interface BundleProps {
  currentProduct: RetailProduct;
  recommendedProducts: RetailProduct[];
}

export const FrequentlyBoughtTogether = ({ currentProduct, recommendedProducts }: BundleProps) => {
  const { add } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([
    currentProduct.id,
    ...(recommendedProducts.slice(0, 2).map((p) => p.id)),
  ]);

  if (!recommendedProducts || recommendedProducts.length === 0) return null;

  const allBundleProducts = [currentProduct, ...recommendedProducts.slice(0, 2)];

  const toggleItem = (id: string) => {
    if (id === currentProduct.id) return; // primary product is required
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const activeProducts = allBundleProducts.filter((p) => selectedIds.includes(p.id));
  const rawTotal = activeProducts.reduce((sum, p) => sum + (p.numeric_price || 0), 0);
  const bundleDiscount = Math.round(rawTotal * 0.08); // 8% bundle savings
  const discountedTotal = rawTotal - bundleDiscount;

  const handleAddBundle = () => {
    activeProducts.forEach((product) => {
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
    });
    toast.success("Bundle Added to Cart!", {
      description: `Added ${activeProducts.length} items with an 8% bundle discount (₦${bundleDiscount.toLocaleString()} saved).`,
    });
  };

  return (
    <div className="rounded-3xl border border-gold/30 bg-card p-6 md:p-8 shadow-[var(--shadow-card)] my-10">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold mb-1">
        <span>Frequently Bought Together</span>
      </div>
      <h3 className="text-xl font-display font-bold text-foreground mb-6">
        Complete the Setup & Save 8%
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Left: Product Selection Row */}
        <div className="lg:col-span-2 flex flex-wrap items-center gap-4">
          {allBundleProducts.map((prod, idx) => {
            const isSelected = selectedIds.includes(prod.id);
            const isPrimary = prod.id === currentProduct.id;
            return (
              <div key={prod.id} className="flex items-center gap-4">
                <div
                  onClick={() => !isPrimary && toggleItem(prod.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary/40 bg-card shadow-sm"
                      : "border-border/60 opacity-60 bg-muted/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground bg-card"
                    }`}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>

                  <img
                    src={prod.image_url || "/placeholder.svg"}
                    alt={prod.name}
                    className="w-14 h-14 object-contain rounded-lg bg-muted/30 p-1"
                  />

                  <div className="max-w-[160px]">
                    <p className="font-display font-bold text-xs text-foreground line-clamp-1">
                      {prod.name}
                    </p>
                    <p className="font-mono text-xs font-bold text-primary mt-0.5">
                      ₦{(prod.numeric_price || 0).toLocaleString()}
                    </p>
                    {isPrimary && (
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">
                        This Item
                      </span>
                    )}
                  </div>
                </div>

                {idx < allBundleProducts.length - 1 && (
                  <div className="hidden sm:flex text-muted-foreground font-bold">
                    <Plus size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Bundle Pricing & Checkout CTA */}
        <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <span className="text-xs text-muted-foreground">Total Price for {activeProducts.length} Items:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-display font-bold text-foreground">
                ₦{discountedTotal.toLocaleString()}
              </span>
              {bundleDiscount > 0 && (
                <span className="text-xs font-mono text-muted-foreground line-through">
                  ₦{rawTotal.toLocaleString()}
                </span>
              )}
            </div>

            {bundleDiscount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2">
                <Tag size={12} /> You Save ₦{bundleDiscount.toLocaleString()} (8% OFF)
              </span>
            )}
          </div>

          <Button
            onClick={handleAddBundle}
            className="w-full py-5 rounded-xl font-bold gap-2 text-sm shadow-md bg-gold hover:bg-gold-light text-midnight"
          >
            <ShoppingCart size={16} />
            <span>Add Bundle to Cart</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
