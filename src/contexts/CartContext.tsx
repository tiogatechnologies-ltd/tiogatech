import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItemType = "product" | "package";

export interface CartItem {
  id: string;            // unique cart key
  refId: string;         // source id (product/package id)
  type: CartItemType;
  name: string;
  price: string | null;  // display label like "₦450,000" or null
  numericPrice?: number | null;
  image?: string | null;
  category?: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "quantity" | "id"> & { id?: string; quantity?: number }) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "tioga_cart_v1";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add: CartContextValue["add"] = useCallback((item) => {
    setItems((prev) => {
      const key = item.id ?? `${item.type}:${item.refId}`;
      const existing = prev.find((x) => x.id === key);
      const qty = item.quantity ?? 1;
      if (existing) {
        return prev.map((x) => (x.id === key ? { ...x, quantity: x.quantity + qty } : x));
      }
      return [...prev, { ...item, id: key, quantity: qty }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => setItems((p) => p.filter((x) => x.id !== id)), []);
  const updateQty = useCallback((id: string, qty: number) => {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, quantity: Math.max(1, qty) } : x)));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((s, x) => s + x.quantity, 0), [items]);

  const value: CartContextValue = { items, count, open, setOpen, add, remove, updateQty, clear };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
