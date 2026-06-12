import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";

interface Props {
  itemName?: string;
  itemType?: "product" | "package" | "lock" | "automation";
  itemId?: string;
  price?: number | null;
  className?: string;
  compact?: boolean;
}

/**
 * Small CTA linking to the Finance page, optionally pre-filling the
 * calculator with the item's price and name via query params.
 */
const FlexiblePaymentButton = ({ itemName, itemType, itemId, price, className = "", compact = false }: Props) => {
  const params = new URLSearchParams();
  if (itemName) params.set("item", itemName);
  if (itemType) params.set("type", itemType);
  if (itemId) params.set("id", itemId);
  if (price) params.set("amount", String(price));
  const to = `/finance${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent-foreground px-3 py-1.5 text-[11px] font-semibold hover:bg-accent/20 hover:border-accent/60 transition-all ${compact ? "" : "w-full"} ${className}`}
      title="Pay 30% now, spread the rest"
    >
      <Wallet size={12} />
      Flexible Payment
    </Link>
  );
};

export default FlexiblePaymentButton;
