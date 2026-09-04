import { useLocation } from "react-router-dom";
import { Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { trackConversion } from "@/lib/tracking";

// Public Telegram community link.
export const TELEGRAM_COMMUNITY_URL = "https://t.me/+VTYITwpTx64xYTQ0";

const DISMISS_KEY = "tioga_tg_popup_dismissed_at";
const DELAY_MS = 2 * 60 * 1000; // 2 minutes
const SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days after dismiss

/**
 * Community popup. Appears once after 2 minutes on site.
 * Replaces the previous floating Telegram button.
 * Hidden on /admin/* routes.
 */
const TelegramWidget = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    try {
      const last = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (last && Date.now() - last < SUPPRESS_MS) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  if (pathname.startsWith("/admin") || !open) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tg-popup-title"
      onClick={dismiss}
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 animate-fade-up"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X size={16} />
        </button>
        <div
          className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4"
          style={{ background: "linear-gradient(135deg, #229ED9, #1d8dc2)" }}
        >
          <Send size={26} className="-ml-0.5" />
        </div>
        <h2 id="tg-popup-title" className="font-display text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
          Join our community
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
          Chat with the Tioga team and other customers on Telegram. Get setup tips, deals, and quick answers.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Not now
          </button>
          <a
            href={TELEGRAM_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackConversion("cta_click", { kind: "telegram_community", surface: "popup_2min" });
              dismiss();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
            style={{ background: "linear-gradient(135deg, #229ED9, #1d8dc2)" }}
          >
            <Send size={15} /> Join on Telegram
          </a>
        </div>
      </div>
    </div>
  );
};

export default TelegramWidget;
