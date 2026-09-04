import { useState } from "react";
import { SlidersHorizontal, X, ArrowRight, Check, Trash2, ShoppingBag, Scale, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProductCompare } from "@/hooks/useProductCompare";
import { useCart } from "@/contexts/CartContext";
import { productPath } from "@/lib/productSlug";
import { resolveProductImage } from "@/lib/productImages";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const ProductCompareTray = () => {
  const { compareItems, count, removeCompare, clearCompare, isOpen, setIsOpen } = useProductCompare();
  const { add } = useCart();
  const [highlightDiffs, setHighlightDiffs] = useState(false);

  if (count === 0) return null;

  // Gather all unique specification keys across comparing items
  const allSpecKeys = Array.from(
    new Set(
      compareItems.flatMap((p) => (p.specifications ? Object.keys(p.specifications) : []))
    )
  );

  const handleAddToCart = (item: any) => {
    add({
      refId: item.id,
      type: "product",
      name: item.name,
      price: item.price,
      numericPrice: item.numeric_price,
      image: item.image_url,
      category: item.category,
      quantity: 1,
    });
    toast.success(`Added ${item.name} to cart`);
  };

  return (
    <>
      {/* Floating Bottom Bar (Sticky across site) */}
      <div className="fixed bottom-5 inset-x-4 md:inset-x-auto md:right-8 z-40 max-w-xl mx-auto bg-card/95 text-foreground backdrop-blur-xl border border-primary/40 rounded-3xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
            <SlidersHorizontal size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              Compare Products ({count}/4)
            </p>
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto">
              {compareItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group w-9 h-9 rounded-xl overflow-hidden border border-border bg-muted/30 p-0.5 shrink-0"
                >
                  <img
                    src={resolveProductImage(item.image_url, item.category)}
                    alt={item.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeCompare(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="absolute inset-0 bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearCompare}
            className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-xl transition-colors font-medium"
          >
            Clear
          </button>
          <Button
            onClick={() => setIsOpen(true)}
            size="sm"
            className="bg-primary text-primary-foreground font-bold text-xs rounded-2xl shadow-md px-4 py-2 gap-1.5 hover:brightness-110"
          >
            <span>Compare Now</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      {/* Comparison Modal Table */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl p-6 sm:p-8 bg-card border-border rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4 gap-4">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2.5">
                <Scale size={22} className="text-primary" />
                Side-by-Side Hardware Comparison
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Direct head-to-head engineering specifications, pricing, and factory warranties.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={highlightDiffs ? "default" : "outline"}
                size="sm"
                onClick={() => setHighlightDiffs((h) => !h)}
                className="text-xs rounded-xl h-8 font-semibold"
              >
                {highlightDiffs ? "Show All" : "Highlight Differences"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompare}
                className="text-xs text-muted-foreground hover:text-destructive gap-1 rounded-xl h-8"
              >
                <Trash2 size={13} />
                Clear
              </Button>
            </div>
          </DialogHeader>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto mt-4 rounded-2xl border border-border bg-card">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 font-bold text-foreground w-44 min-w-[150px]">
                    Hardware Overview
                  </th>
                  {compareItems.map((item) => (
                    <th key={item.id} className="p-4 text-center min-w-[200px] align-top">
                      <div className="flex flex-col items-center space-y-2.5">
                        <div className="relative aspect-square w-24 h-24 rounded-2xl overflow-hidden bg-card border border-border p-2 flex items-center justify-center">
                          <img
                            src={resolveProductImage(item.image_url, item.category)}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => removeCompare(item.id)}
                            className="absolute top-1 right-1 p-1 rounded-md bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remove from comparison"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        <Link
                          to={productPath(item)}
                          onClick={() => setIsOpen(false)}
                          className="font-display font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-2 text-center"
                        >
                          {item.name}
                        </Link>

                        <p className="font-display font-black text-base text-primary">
                          {item.numeric_price ? `₦${item.numeric_price.toLocaleString("en-NG")}` : item.price || "Price on Request"}
                        </p>

                        <div className="grid grid-cols-2 gap-1.5 w-full pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            className="w-full py-1.5 text-[11px] rounded-xl font-bold gap-1"
                          >
                            <ShoppingBag size={13} />
                            Add
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="w-full py-1.5 text-[11px] rounded-xl font-bold"
                          >
                            <Link to={productPath(item)} onClick={() => setIsOpen(false)}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* Category Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20">Category</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center font-medium text-muted-foreground capitalize">
                      {item.category.replace("_", " ")}
                    </td>
                  ))}
                </tr>

                {/* Brand Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20">Brand / Manufacturer</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center font-semibold text-foreground">
                      {item.brand || "Tioga Certified"}
                    </td>
                  ))}
                </tr>

                {/* Series Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20">Product Series</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center font-medium text-muted-foreground">
                      {item.series || "Standard Line"}
                    </td>
                  ))}
                </tr>

                {/* Stock Status Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20">Availability</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check size={13} />
                        In Stock (Ships in 24h)
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Official Warranty Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20">Official Warranty</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center font-semibold text-foreground">
                      5-Year Direct Warranty
                    </td>
                  ))}
                </tr>

                {/* Dynamic Specification Rows */}
                {allSpecKeys.map((key) => {
                  const values = compareItems.map((item) => item.specifications?.[key] || "-");
                  const allSame = values.every((v) => v === values[0]);

                  if (highlightDiffs && allSame) return null;

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-muted/10 ${
                        !allSame ? "bg-primary/5 font-semibold" : ""
                      }`}
                    >
                      <td className="p-3.5 font-bold text-foreground bg-muted/20 flex items-center justify-between">
                        <span>{key}</span>
                        {!allSame && (
                          <span className="text-[10px] uppercase font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                            Diff
                          </span>
                        )}
                      </td>
                      {compareItems.map((item) => (
                        <td key={item.id} className="p-3.5 text-center text-foreground font-mono">
                          {item.specifications?.[key] || "-"}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Best For Application Row */}
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground bg-muted/20">Recommended For</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-3.5 text-center text-xs text-muted-foreground leading-relaxed">
                      {item.best_for}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCompareTray;
