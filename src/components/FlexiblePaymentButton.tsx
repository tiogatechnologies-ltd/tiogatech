import { useState } from "react";
import { Wallet } from "lucide-react";
import FlexiblePaymentDialog from "@/components/FlexiblePaymentDialog";

interface Props {
  itemName?: string;
  itemType?: "product" | "package" | "lock" | "automation";
  itemId?: string;
  price?: number | null;
  className?: string;
  compact?: boolean;
}

/**
 * CTA that opens a mini Easy Flex calculator + eligibility popup with a
 * link to the full Finance page.
 */
const FlexiblePaymentButton = ({ itemName, itemType, itemId, price, className = "", compact = false }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent-foreground px-3 py-1.5 text-[11px] font-semibold hover:bg-accent/20 hover:border-accent/60 transition-all ${compact ? "" : "w-full"} ${className}`}
        title="Pay 30% now, spread the rest — Easy Flex"
      >
        <Wallet size={12} />
        Easy Flex
      </button>
      <FlexiblePaymentDialog
        open={open}
        onOpenChange={setOpen}
        itemName={itemName}
        itemType={itemType}
        itemId={itemId}
        price={price}
      />
    </>
  );
};

export default FlexiblePaymentButton;
