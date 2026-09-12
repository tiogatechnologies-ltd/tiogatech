import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { RetailProduct } from "@/types/retail";

const COMPARE_KEY = "tioga_retail_compare";
export const MAX_COMPARE = 4;

export const useProductCompare = () => {
  const [compareItems, setCompareItems] = useState<RetailProduct[]>([]);
  const [isOpen, setIsOpenState] = useState(false);

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

    const onModalToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.open === "boolean") {
        setIsOpenState(customEvent.detail.open);
      }
    };

    window.addEventListener("tioga:compare-updated", onStorage);
    window.addEventListener("tioga:compare-modal-toggle", onModalToggle);
    return () => {
      window.removeEventListener("tioga:compare-updated", onStorage);
      window.removeEventListener("tioga:compare-modal-toggle", onModalToggle);
    };
  }, []);

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);
    window.dispatchEvent(
      new CustomEvent("tioga:compare-modal-toggle", { detail: { open } })
    );
  }, []);

  const openCompareModal = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const closeCompareModal = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const isSameProduct = (a: RetailProduct, b: RetailProduct): boolean => {
    if (a.id && b.id && a.id === b.id) return true;
    if (a.name && b.name && a.name.trim().toLowerCase() === b.name.trim().toLowerCase()) return true;
    return false;
  };

  const addCompare = useCallback((product: RetailProduct): boolean => {
    let current: RetailProduct[] = [];
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (stored) current = JSON.parse(stored);
    } catch {
      current = compareItems;
    }

    const exists = current.some((p) => isSameProduct(p, product));
    if (exists) {
      toast.info("Already in Compare", { description: `"${product.name}" is already in your comparison.` });
      return true;
    }

    if (current.length >= MAX_COMPARE) {
      toast.warning("Comparison Limit Reached", {
        description: `You can compare up to ${MAX_COMPARE} products at a time. Remove one first.`,
      });
      return false;
    }

    const next = [...current, product];
    setCompareItems(next);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
    toast.success("Added to Compare", { description: `"${product.name}" added (${next.length}/${MAX_COMPARE}).` });
    return true;
  }, [compareItems]);

  const toggleCompare = useCallback((product: RetailProduct) => {
    let current: RetailProduct[] = [];
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (stored) current = JSON.parse(stored);
    } catch {
      current = compareItems;
    }

    const exists = current.some((p) => isSameProduct(p, product));
    if (exists) {
      const next = current.filter((p) => !isSameProduct(p, product));
      setCompareItems(next);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
      toast.info("Removed from Compare", { description: `"${product.name}" was removed.` });
      return;
    }

    if (current.length >= MAX_COMPARE) {
      toast.warning("Comparison Limit Reached", {
        description: `You can compare up to ${MAX_COMPARE} products at a time. Remove one first.`,
      });
      return;
    }

    const next = [...current, product];
    setCompareItems(next);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
    toast.success("Added to Compare", { description: `"${product.name}" added (${next.length}/${MAX_COMPARE}).` });
  }, [compareItems]);

  const removeCompare = useCallback((productIdOrName: string) => {
    let current: RetailProduct[] = [];
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (stored) current = JSON.parse(stored);
    } catch {
      current = compareItems;
    }

    const target = productIdOrName.trim().toLowerCase();
    const next = current.filter(
      (p) => p.id !== productIdOrName && p.name.trim().toLowerCase() !== target
    );
    setCompareItems(next);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
  }, [compareItems]);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    localStorage.removeItem(COMPARE_KEY);
    window.dispatchEvent(new CustomEvent("tioga:compare-updated"));
    setIsOpen(false);
    toast.info("Comparison Cleared");
  }, [setIsOpen]);

  const isInCompare = useCallback(
    (productId: string, productName?: string) => {
      const normName = productName ? productName.trim().toLowerCase() : null;
      return compareItems.some(
        (p) => p.id === productId || (normName && p.name.trim().toLowerCase() === normName)
      );
    },
    [compareItems]
  );

  return {
    compareItems,
    count: compareItems.length,
    isOpen,
    setIsOpen,
    openCompareModal,
    closeCompareModal,
    addCompare,
    toggleCompare,
    removeCompare,
    clearCompare,
    isInCompare,
  };
};

