import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { X, Calculator, Wallet, ArrowRight } from "lucide-react";

const STORAGE_KEY = "tioga.featureHighlight.dismissedAt";
const SUPPRESS_MS = 1000 * 60 * 60 * 24 * 3; // 3 days
const SHOW_DELAY_MS = 6000;

// Don't nag on these routes.
const HIDDEN_ROUTES = [
  /^\/admin/,
  /^\/auth/,
  /^\/checkout/,
  /^\/finance\/apply/,
  /^\/reset-password/,
  /^\/dashboard/,
  /^\/account/,
  /^\/energy-calculator/,
  /^\/finance$/,
];

const FeatureHighlightPopup = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (HIDDEN_ROUTES.some((r) => r.test(pathname))) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const when = Number(raw);
        if (!Number.isNaN(when) && Date.now() - when < SUPPRESS_MS) return;
      }
    } catch {}
    const t = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[70] pointer-events-none"
      aria-live="polite"
    >
      <div className="pointer-events-auto mx-auto sm:mx-0 w-full sm:w-[380px] max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="relative bg-primary/95 px-5 py-4 text-primary-foreground">
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
          >
            <X size={14} />
          </button>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-gold mb-1.5">
            New on Tioga
          </div>
          <p className="font-display font-bold text-lg leading-tight">
            Size your system. Pay your way.
          </p>
          <p className="text-xs text-primary-foreground/85 mt-1">
            Two new tools to make going solar effortless.
          </p>
        </div>

        <div className="p-3 space-y-2">
          <Link
            to="/energy-calculator"
            onClick={dismiss}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-background hover:bg-muted/60 p-3 transition-all"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Calculator size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground leading-tight">Energy Calculator</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Size your solar system in under 60 seconds.
              </p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <Link
            to="/finance"
            onClick={dismiss}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-background hover:bg-muted/60 p-3 transition-all"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent-foreground shrink-0">
              <Wallet size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground leading-tight">Flexible Payment</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Pay 30% now, spread the rest over 3–24 months.
              </p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <button
            onClick={dismiss}
            className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground py-1.5"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FeatureHighlightPopup;
