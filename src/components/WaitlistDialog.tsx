import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Smartphone, Sparkles } from "lucide-react";
import AppWaitlistForm from "@/components/AppWaitlistForm";

let externalSetter: ((v: boolean) => void) | null = null;
export const openWaitlist = () => externalSetter?.(true);

const WaitlistDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    externalSetter = setOpen;
    const handler = () => setOpen(true);
    window.addEventListener("tioga:open-waitlist", handler);
    return () => {
      window.removeEventListener("tioga:open-waitlist", handler);
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
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-midnight text-primary-foreground rounded-t-3xl sm:rounded-3xl border border-primary-foreground/15 shadow-2xl"
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-primary-foreground/10 text-primary-foreground/70 hover:text-primary-foreground z-10"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-gold font-semibold mb-4">
            <Sparkles size={12} /> Coming Soon
          </div>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center mb-3">
            <Smartphone size={22} />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-2 no-clip">
            Join the Tioga App waitlist
          </h2>
          <p className="text-sm text-primary-foreground/75 mb-5">
            Be first to control your solar, smart locks and home automation from one app.
          </p>

          <AppWaitlistForm />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WaitlistDialog;
