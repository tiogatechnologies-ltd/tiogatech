import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { upgradeLegacyWishlistIds } from "@/lib/retailPricing";

const WISHLIST_KEY = "tioga_retail_wishlist";
const WISHLIST_VERSION = "tioga_retail_wishlist_ids_v2";
function readWishlist(): string[] {
  const ids: string[] = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  if (localStorage.getItem(WISHLIST_VERSION)) return ids;
  const upgraded = upgradeLegacyWishlistIds(ids);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(upgraded));
  localStorage.setItem(WISHLIST_VERSION, "1");
  return upgraded;
}

export const useWishlist = () => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setWishlistIds(readWishlist());
    } catch {
      // fallback
    }

    const onStorage = () => {
      try {
        setWishlistIds(readWishlist());
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
