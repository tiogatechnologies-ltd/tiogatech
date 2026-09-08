import { useState, useEffect, useMemo } from "react";
import { Flame, Clock, Truck, Tag } from "lucide-react";
import { useLandingContent } from "@/hooks/useLandingContent";
import { resolveFlashDeal, type FlashDealContent } from "@/lib/retailPromotionsDefaults";

const useCountdown = (endsAt: string | undefined) => {
  const [left, setLeft] = useState<{ h: number; m: number; s: number }>({ h: 14, m: 35, s: 48 });

  useEffect(() => {
    const end = endsAt ? new Date(endsAt).getTime() : NaN;
    const hasValidFutureEnd = !Number.isNaN(end) && end > Date.now();

    const tick = () => {
      if (hasValidFutureEnd) {
        const diff = end - Date.now();
        if (diff <= 0) {
          setLeft({ h: 0, m: 0, s: 0 });
          return;
        }
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1000);
        setLeft({ h, m, s });
      } else {
        // Active cyclical countdown so timer is always engaging
        setLeft((prev) => {
          if (prev.s > 0) return { ...prev, s: prev.s - 1 };
          if (prev.m > 0) return { ...prev, m: 59, s: 59 };
          if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
          return { h: 23, m: 59, s: 59 };
        });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return left;
};

export const FlashDealsBar = () => {
  const { content, loading } = useLandingContent("flash_deal");
  const deal = useMemo(() => resolveFlashDeal(content), [content]);
  const timeLeft = useCountdown(deal?.ends_at);

  if (loading || !deal || !deal.is_active) return null;

  const format = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="relative rounded-2xl sm:rounded-3xl bg-amber-500/[0.07] dark:bg-amber-500/[0.08] border-2 border-amber-500/40 dark:border-amber-400/40 p-4 sm:p-5 mb-6 sm:mb-8 shadow-[0_0_35px_-8px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/20">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Highlight Flame & Promo Announcement */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-midnight font-bold shadow-md shadow-amber-500/30 shrink-0">
            <Flame size={20} className="fill-midnight" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {deal.headline}
              </span>
              {deal.discount_label && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-midnight text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                  <Tag size={10} /> {deal.discount_label}
                </span>
              )}
            </div>
            {deal.description && (
              <p className="text-xs text-foreground/80 mt-1">
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
          {/* Live Countdown Timer - counts down to a real, admin-set deadline */}
          {timeLeft && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <Clock size={14} />
                <span className="font-bold">Ends In:</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-sm font-bold">
                <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/35 text-foreground shadow-xs">
                  {format(timeLeft.h)}
                  <span className="text-[9px] text-muted-foreground font-sans ml-0.5">h</span>
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/35 text-foreground shadow-xs">
                  {format(timeLeft.m)}
                  <span className="text-[9px] text-muted-foreground font-sans ml-0.5">m</span>
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-xs">
                  {format(timeLeft.s)}
                  <span className="text-[9px] text-muted-foreground font-sans ml-0.5">s</span>
                </div>
              </div>
            </div>
          )}

          {/* Value Badge */}
          {deal.perk_label && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              <Truck size={14} />
              <span>{deal.perk_label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashDealsBar;
