import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft, Trash2, ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { productPath } from "@/lib/productSlug";
import { inferBrand, normalizeCategory } from "@/lib/productBrand";
import { mergeProducts } from "@/lib/mergeProducts";
import { resolveProductImage } from "@/lib/productImages";
import type { RetailProduct } from "@/types/retail";
import { toast } from "sonner";

export const Wishlist = () => {
  const { wishlistIds, toggleWishlist, clearWishlist, count } = useWishlist();
  const { add } = useCart();
  const [allProducts, setAllProducts] = useState<RetailProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (cancelled) return;

        const dbList: RetailProduct[] = ((data as any[]) || []).map((p) => ({
          id: p.id,
          name: p.name,
          category: normalizeCategory(p.category),
          series: p.series || null,
          description: p.description,
          features: Array.isArray(p.features) ? p.features : [],
          best_for: p.best_for || "Residential and commercial backup",
          price: p.price || null,
          numeric_price: p.numeric_price || Number(p.price?.replace(/[^\d.]/g, "") || 0),
          tier: p.tier || "premium",
          image_url: p.image_url || null,
          specifications: p.specifications || {},
          tags: p.tags || [],
          brand: p.brand || inferBrand(p.name, p.category),
          rating: 5.0,
          review_count: 14,
        }));

        const staticList: RetailProduct[] = STATIC_PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          category: normalizeCategory(p.category),
          series: p.series || null,
          description: p.description,
          features: p.features || [],
          best_for: p.best_for || p.bestFor || "Residential and commercial backup",
          price: p.price || null,
          numeric_price: p.numeric_price || Number(p.price?.replace(/[^\d.]/g, "") || 0),
          tier: p.tier || "premium",
          image_url: p.image_url || null,
          specifications: p.specifications || {},
          tags: p.tags || [],
          brand: p.brand || inferBrand(p.name, p.category),
          rating: p.rating || 5.0,
          review_count: p.review_count || 14,
        }));

        setAllProducts(mergeProducts(staticList, dbList));
      } catch (err) {
        console.error("Wishlist catalog error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  // Find products matching wishlist IDs
  const savedProducts = useMemo(() => {
    return allProducts.filter((p) => wishlistIds.includes(p.id));
  }, [allProducts, wishlistIds]);

  const handleMoveAllToCart = () => {
    savedProducts.forEach((p) => {
      add({
        refId: p.id,
        type: "product",
        name: p.name,
        price: p.price,
        numericPrice: p.numeric_price,
        image: p.image_url,
        category: normalizeCategory(p.category),
        quantity: 1,
      });
    });
    toast.success(`Moved ${savedProducts.length} items to cart`);
    clearWishlist();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="My Saved Wishlist - Tioga Technologies"
        description="View and manage your saved solar inverters, lithium batteries, and smart home hardware."
        path="/retail/wishlist"
      />
      <SiteHeader />

      <main className="flex-1 section-padding py-12 pt-[84px] sm:pt-[96px]">
        <div className="section-container max-w-5xl">
          {/* Back link */}
          <Link
            to="/retail"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Continue Shopping in Retail Store</span>
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Heart size={28} className="text-rose-500 fill-rose-500" />
                <span>My Saved Wishlist ({count})</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Your saved hardware stack ready for instant purchase or financing.
              </p>
            </div>

            {count > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearWishlist}
                  className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={13} />
                  <span>Clear List</span>
                </Button>

                <Button
                  onClick={handleMoveAllToCart}
                  size="sm"
                  className="rounded-xl font-bold text-xs gap-1.5 shadow-md bg-primary text-primary-foreground hover:brightness-110"
                >
                  <ShoppingCart size={14} />
                  <span>Move All to Cart</span>
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : count === 0 || savedProducts.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border p-8 space-y-4 shadow-sm">
              <div className="p-5 rounded-full bg-rose-500/10 text-rose-500 w-16 h-16 mx-auto flex items-center justify-center">
                <Heart size={28} />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">Your Wishlist is Empty</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Browse our retail store to save inverters, lithium batteries, and smart home locks for later.
              </p>
              <Button asChild className="rounded-xl font-bold text-xs gap-2 bg-primary text-primary-foreground">
                <Link to="/retail">
                  <ShoppingBag size={14} />
                  <span>Explore Retail Hardware</span>
                </Link>
              </Button>
            </div>
          ) : (
            /* Items Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] hover:shadow-xl hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted/20 mb-3 flex items-center justify-center p-3">
                      <Link to={productPath(product)} className="w-full h-full flex items-center justify-center">
                        <img
                          src={resolveProductImage(product.image_url, product.category)}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product.id, product.name)}
                        className="absolute top-2.5 right-2.5 p-2 rounded-full bg-background/80 hover:bg-background text-rose-500 backdrop-blur-md shadow-sm transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                      {product.category}
                    </span>
                    <Link
                      to={productPath(product)}
                      className="font-display font-bold text-sm text-foreground hover:text-primary transition-colors block line-clamp-2 mt-0.5"
                    >
                      {product.name}
                    </Link>
                    <p className="font-display font-extrabold text-base text-foreground mt-2">
                      {product.numeric_price ? `₦${product.numeric_price.toLocaleString("en-NG")}` : product.price || "Price on Request"}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border mt-4">
                    <Button
                      onClick={() => {
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
                        toggleWishlist(product.id);
                        toast.success(`Moved ${product.name} to cart`);
                      }}
                      className="w-full rounded-2xl font-bold text-xs gap-1.5 shadow-md bg-primary text-primary-foreground hover:brightness-110"
                    >
                      <ShoppingCart size={14} />
                      <span>Move to Cart</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Wishlist;
