import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Global mouse-follow green aura. Lives behind everything (z-0, pointer-events-none).
 * Uses spring physics for a lagged, premium feel.
 */
const BackgroundAura = () => {
  const x = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const y = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);

  const sx = useSpring(x, { stiffness: 60, damping: 20, mass: 0.8 });
  const sy = useSpring(y, { stiffness: 60, damping: 20, mass: 0.8 });

  // Render as CSS background via transform on a positioned div
  const left = useTransform(sx, (v) => `${v - 110}px`);
  const top = useTransform(sy, (v) => `${v - 110}px`);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      x.set(t.clientX);
      y.set(t.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [x, y]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      <motion.div
        style={{
          left,
          top,
          width: 220,
          height: 220,
          position: "absolute",
          background:
            "radial-gradient(circle, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 45%, rgba(34,197,94,0) 70%)",
          filter: "blur(22px)",
          willChange: "transform, left, top",
        }}
      />
    </div>
  );
};

export default BackgroundAura;
