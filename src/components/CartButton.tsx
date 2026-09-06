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
          ? "bg-midnight/65 hover:bg-midnight/80 backdrop-blur-xl text-primary-foreground border border-white/20 shadow-sm"
          : "bg-card/80 hover:bg-card backdrop-blur-xl text-foreground border border-border shadow-sm",
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
