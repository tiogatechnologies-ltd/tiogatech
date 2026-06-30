import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X, Calculator, ArrowRight } from "lucide-react";
import LumiVoltSizer from "@/components/LumiVoltSizer";

let externalSetter: ((v: boolean) => void) | null = null;
export const openEnergyCalculator = () => externalSetter?.(true);

const EnergyCalculatorDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    externalSetter = setOpen;
    const handler = () => setOpen(true);
    window.addEventListener("tioga:open-energy-calculator", handler);
    return () => {
      window.removeEventListener("tioga:open-energy-calculator", handler);
      externalSetter = null;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <Calculator size={16} />
            </span>
            <div>
              <p className="font-display font-bold text-foreground text-sm sm:text-base leading-tight">Energy Calculator</p>
              <p className="text-[11px] text-muted-foreground">Size your solar system in 60 seconds</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <LumiVoltSizer />
          <div className="mt-5 pt-4 border-t border-border text-center">
            <Link
              to="/energy-calculator"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Open full Energy Calculator page <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EnergyCalculatorDialog;
