import { useLocation } from "react-router-dom";
import { Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { trackConversion } from "@/lib/tracking";

// Public Telegram community link.
export const TELEGRAM_COMMUNITY_URL = "https://t.me/+VTYITwpTx64xYTQ0";

/**
 * Floating Telegram community button (bottom-right).
 * Hidden on /admin/* routes.
 *
 * To swap to a full embedded live chat widget (Elfsight, Social Intents, Re:amaze, Boei):
 * 1. Sign up with provider and paste your BotFather token + group ID into their dashboard.
 * 2. Replace the <a> below with their <script> snippet (or render it via useEffect).
 */
const TelegramWidget = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2">
      {open && !dismissed && (
        <div className="relative max-w-[240px] rounded-2xl bg-card border border-border shadow-xl p-3 pr-8 animate-fade-up">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute top-1.5 right-1.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X size={12} />
          </button>
          <p className="text-xs font-semibold text-foreground mb-0.5">Join our community</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Chat with our team and other Tioga customers on Telegram.
          </p>
        </div>
      )}
      <a
        href={TELEGRAM_COMMUNITY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join Tioga Telegram community"
        onClick={() => trackConversion("cta_click", { kind: "telegram_community", surface: "floating_widget" })}
        className="inline-flex items-center justify-center h-13 w-13 sm:h-14 sm:w-14 rounded-full text-white shadow-2xl active:scale-95 transition-transform"
        style={{ background: "linear-gradient(135deg, #229ED9, #1d8dc2)", height: 52, width: 52 }}
      >
        <Send size={22} className="-ml-0.5" />
      </a>
    </div>
  );
};

export default TelegramWidget;
