import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value?: string | number | null;
  target?: number | null;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * AnimatedCounter: Automatically extracts numbers, prefixes (e.g. ₦, $, €),
 * and suffixes (e.g. +, %, /mo, M, kW) and animates the count up smoothly when
 * scrolled into viewport using an iPhone-smooth easeOutExpo curve.
 */
export const AnimatedCounter = ({
  value,
  target,
  prefix = "",
  suffix = "",
  duration = 1600,
  className = "",
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  // Parse target number, prefix, and suffix from string value if not explicitly given
  let finalTarget: number | null = target ?? null;
  let finalPrefix = prefix;
  let finalSuffix = suffix;
  let rawDisplay = typeof value === "number" ? value.toLocaleString() : (value || "");

  if (finalTarget === null && typeof value === "string") {
    // Check for patterns like "100+", "250+", "₦1,850,000", "30%", "12-18%", "5.0", "$14B"
    const cleaned = value.trim();
    const match = cleaned.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (match) {
      if (!finalPrefix && match[1]) finalPrefix = match[1];
      const parsedNum = parseFloat(match[2].replace(/,/g, ""));
      if (!Number.isNaN(parsedNum)) {
        finalTarget = parsedNum;
      }
      if (!finalSuffix && match[3]) finalSuffix = match[3];
    }
  } else if (finalTarget === null && typeof value === "number") {
    finalTarget = value;
  }

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (finalTarget === null) return;
    const element = ref.current;
    if (!element) return;

    // The counter starts at 0, so anything that stops the animation from
    // running leaves a price reading "₦0" - a throttled background tab, an
    // in-app browser, reduced-motion users, or a crawler that renders the page
    // without scrolling. This safety net guarantees the real figure is shown
    // even when the animation never gets a frame.
    const settle = () => { started.current = true; setCurrent(finalTarget!); };

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      settle();
      return;
    }

    const fallback = window.setTimeout(() => { if (!started.current) settle(); }, duration + 1500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            // easeOutExpo for high-end Apple-like fluid feel
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            setCurrent(finalTarget! * eased);
            if (t < 1) {
              requestAnimationFrame(tick);
            } else {
              setCurrent(finalTarget!);
            }
          };
          requestAnimationFrame(tick);
          // If frames never arrive, land on the real number anyway.
          window.setTimeout(() => setCurrent((c) => (c === finalTarget! ? c : finalTarget!)), duration + 500);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(element);
    return () => { observer.disconnect(); window.clearTimeout(fallback); };
  }, [finalTarget, duration]);

  if (finalTarget === null) {
    return <span className={className}>{rawDisplay}</span>;
  }

  // Format decimal if original had decimals
  const isDecimal = Number.isInteger(finalTarget) ? false : true;
  const formattedVal = isDecimal
    ? current.toFixed(1)
    : Math.round(current).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {finalPrefix}
      {formattedVal}
      {finalSuffix}
    </span>
  );
};

export default AnimatedCounter;
