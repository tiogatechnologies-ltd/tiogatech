import type { RetailProduct } from "@/types/retail";
type StockStatus = RetailProduct["stock_status"];

export function resolveStockStatus(status: unknown, quantity?: number | null): StockStatus {
  if (status === "preorder") return "pre_order";
  if (status === "in_stock" || status === "low_stock" || status === "pre_order" || status === "out_of_stock") return status;
  return typeof quantity === "number" && Number.isFinite(quantity) ? quantity > 0 ? "in_stock" : "out_of_stock" : undefined;
}

export function stockStatusLabel(status: StockStatus) {
  switch (status) {
    case "in_stock": return "In stock";
    case "low_stock": return "Limited stock";
    case "pre_order": return "Pre-order";
    case "out_of_stock": return "Out of stock";
    default: return "Check availability";
  }
}
