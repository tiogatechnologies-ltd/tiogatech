import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const WISHLIST_KEY = "tioga_retail_wishlist";

export const useWishlist = () => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      if (stored) setWishlistIds(JSON.parse(stored));
    } catch {
      // fallback
    }

    const onStorage = () => {
      try {
        const updated = localStorage.getItem(WISHLIST_KEY);
        if (updated) setWishlistIds(JSON.parse(updated));
      } catch {}
    };
    window.addEventListener("tioga:wishlist-updated", onStorage);
    return () => window.removeEventListener("tioga:wishlist-updated", onStorage);
  }, []);

  const toggleWishlist = useCallback((productId: string, productName?: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("tioga:wishlist-updated"));
      
      if (exists) {
        toast.info("Removed from Wishlist", { description: productName ? `"${productName}" was removed.` : undefined });
      } else {
        toast.success("Saved to Wishlist", { description: productName ? `"${productName}" was added.` : undefined });
      }
      return next;
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => wishlistIds.includes(productId), [wishlistIds]);

  const clearWishlist = useCallback(() => {
    setWishlistIds([]);
    localStorage.removeItem(WISHLIST_KEY);
    window.dispatchEvent(new CustomEvent("tioga:wishlist-updated"));
    toast.info("Wishlist Cleared");
  }, []);

  return {
    wishlistIds,
    count: wishlistIds.length,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
  };
};
