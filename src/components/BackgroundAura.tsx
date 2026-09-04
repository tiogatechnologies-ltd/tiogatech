import { useEffect, useRef, useState } from "react";

/**
 * Global mouse-follow green aura. Lives above content but pointer-events:none.
 * - Uses transform (GPU) instead of left/top to avoid layout thrash.
 * - rAF-throttled; only one update per frame.
 * - Disabled on touch / coarse-pointer devices (mobile/tablet) and when the
 *   user prefers reduced motion.
 */
const BackgroundAura = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;
    setEnabled(true);

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let curX = targetX;
    let curY = targetY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      // simple lerp for a lagged, smooth feel - no React, no layout
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      const el = ref.current;
      if (el) {
        el.style.transform = `translate3d(${curX - 110}px, ${curY - 110}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      <div
        ref={ref}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 45%, rgba(34,197,94,0) 70%)",
          filter: "blur(22px)",
          willChange: "transform",
          transform: "translate3d(-9999px,-9999px,0)",
        }}
      />
    </div>
  );
};

export default BackgroundAura;
