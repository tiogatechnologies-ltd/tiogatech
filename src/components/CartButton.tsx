import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface Props { onDark?: boolean }

const CartButton = ({ onDark }: Props) => {
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Open cart (${count} items)`}
      className={cn(
        "relative inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all active:scale-95",
        onDark
          ? "border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 text-white shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.2)]"
          : "border border-border/80 border-t-white/80 bg-background/80 hover:bg-background backdrop-blur-2xl backdrop-saturate-150 text-foreground shadow-sm",
      )}
    >
      <ShoppingBag size={16} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-midnight text-[10px] font-bold grid place-items-center shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
};

export default CartButton;
