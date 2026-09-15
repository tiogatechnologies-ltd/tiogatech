import { useState, useEffect } from "react";
import { Flame, Clock, Truck, Tag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";

export interface FlashDealContent {
  is_active: boolean;
  headline: string;
  discount_label: string;
  discount_code: string;
  description: string;
  perk_label: string;
  ends_at: string; // ISO
}

export const DEFAULT_FLASH_DEAL: FlashDealContent = {
  is_active: true,
  headline: "Limited-Time Clean Energy Flash Deals",
  discount_label: "Free Express Shipping",
  discount_code: "",
  description: "Priority 24-hour dispatch and transit insurance on all Tier-1 hybrid inverters, LiFePO4 batteries & smart security.",
  perk_label: "24h Priority Dispatch",
  ends_at: "",
};

/**
 * Calculates countdown timer.
 * If endsAt is provided and in the future, counts down to endsAt.
 * If endsAt is empty or past, provides a dynamic rolling countdown to midnight
 * so the storefront always has an active, urgent ticking timer.
 */
const useCountdown = (endsAt: string | undefined) => {
  const [left, setLeft] = useState<{ h: number; m: number; s: number }>({ h: 12, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      let targetTime = 0;
      if (endsAt) {
        const parsed = new Date(endsAt).getTime();
        if (!Number.isNaN(parsed) && parsed > Date.now()) {
          targetTime = parsed;
        }
      }

      // If no valid future deadline was provided, roll over to midnight tonight
      if (!targetTime) {
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        targetTime = endOfDay.getTime();
      }

      const diff = Math.max(0, targetTime - Date.now());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLeft({ h, m, s });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return left;
};

export const FlashDealsBar = () => {
  const { content } = useLandingContent("flash_deal");

  // If admin explicitly disabled the flash deal, respect that choice
  if (content && content.is_active === false) {
    return null;
  }

  // Merge loaded content with default fallback so the bar is always complete and working
  const deal: FlashDealContent = {
    ...DEFAULT_FLASH_DEAL,
    ...(content as Partial<FlashDealContent>),
  };

  const timeLeft = useCountdown(deal.ends_at);
  const format = (n: number) => n.toString().padStart(2, "0");

  return (
    <aside
      aria-label="Promotional Flash Deals Banner"
      className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/[0.10] via-amber-500/[0.06] to-amber-500/[0.12] border-2 border-amber-500/40 dark:border-amber-400/40 p-4 sm:p-5 mb-6 sm:mb-8 shadow-[0_0_35px_-8px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/25 transition-all"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Highlight Flame & Promo Announcement */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/30 shrink-0 animate-pulse">
            <Flame size={22} className="fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {deal.headline}
              </span>
              {deal.discount_label && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  <Tag size={10} /> {deal.discount_label}
                </span>
              )}
            </div>
            {deal.description && (
              <p className="text-xs text-foreground/85 mt-1 leading-relaxed">
                {deal.discount_code && (
                  <>
                    Apply code{" "}
                    <strong className="text-amber-700 dark:text-amber-400 font-mono bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                      {deal.discount_code}
                    </strong>{" "}
                  </>
                )}
                {deal.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Standout Countdown & Fast Delivery */}
        <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-amber-500/20">
          {/* Live Countdown Timer */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Clock size={15} className="animate-spin-slow" />
              <span className="font-bold tracking-wide uppercase text-[11px]">Ends In:</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-sm font-extrabold">
              <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/35 text-foreground shadow-xs">
                {format(timeLeft.h)}
                <span className="text-[9px] text-muted-foreground font-sans ml-0.5 font-normal">h</span>
              </div>
              <span className="text-amber-500 font-bold animate-pulse">:</span>
              <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/35 text-foreground shadow-xs">
                {format(timeLeft.m)}
                <span className="text-[9px] text-muted-foreground font-sans ml-0.5 font-normal">m</span>
              </div>
              <span className="text-amber-500 font-bold animate-pulse">:</span>
              <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-xs">
                {format(timeLeft.s)}
                <span className="text-[9px] text-muted-foreground font-sans ml-0.5 font-normal">s</span>
              </div>
            </div>
          </div>

          {/* Value Badge */}
          {deal.perk_label && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-xl shadow-xs">
              <Truck size={14} />
              <span>{deal.perk_label}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default FlashDealsBar;
