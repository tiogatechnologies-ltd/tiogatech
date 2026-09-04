import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { RetailProduct } from "@/types/retail";

const COMPARE_KEY = "tioga_retail_compare";
const MAX_COMPARE = 4;

export const useProductCompare = () => {
  const [compareItems, setCompareItems] = useState<RetailProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (stored) setCompareItems(JSON.parse(stored));
    } catch {}

    const onStorage = () => {
      try {
        const updated = localStorage.getItem(COMPARE_KEY);
        if (updated) setCompareItems(JSON.parse(updated));
      } catch {}
    };
    window.addEventListener("tioga:compare-updated", onStorage);
    return () => window.removeEventListener("tioga:compare-updated", onStorage);
  }, []);

  const toggleCompare = useCallback((product: RetailProduct) => {
    setCompareItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        const next = prev.filter((p) => p.id !== product.id);
        localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
        toast.info("Removed from Compare", { description: `"${product.name}" was removed.` });
        return next;
      }

      if (prev.length >= MAX_COMPARE) {
        toast.warning("Comparison Limit Reached", {
          description: `You can compare up to ${MAX_COMPARE} products at a time. Remove one first.`,
        });
        return prev;
      }

      const next = [...prev, product];
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
      toast.success("Added to Compare", { description: `"${product.name}" added (${next.length}/${MAX_COMPARE}).` });
      return next;
    });
  }, []);

  const removeCompare = useCallback((productId: string) => {
    setCompareItems((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    localStorage.removeItem(COMPARE_KEY);
    window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
    setIsOpen(false);
    toast.info("Comparison Cleared");
  }, []);

  const isInCompare = useCallback(
    (productId: string) => compareItems.some((p) => p.id === productId),
    [compareItems]
  );

  return {
    compareItems,
    count: compareItems.length,
    isOpen,
    setIsOpen,
    toggleCompare,
    removeCompare,
    clearCompare,
    isInCompare,
  };
};
