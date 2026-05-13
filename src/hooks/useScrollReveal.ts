import { useEffect, useRef, useState, CSSProperties } from "react";

type Direction = "up" | "fade" | "left" | "right" | "scale";

interface RevealOptions {
  direction?: Direction;
  delay?: number;
  threshold?: number;
  distance?: number;
  duration?: number;
  once?: boolean;
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const initialTransform = (dir: Direction, d: number) => {
  switch (dir) {
    case "fade": return "none";
    case "left": return `translate3d(-${d}px,0,0)`;
    case "right": return `translate3d(${d}px,0,0)`;
    case "scale": return "scale(0.97)";
    case "up":
    default: return `translate3d(0,${d}px,0)`;
  }
};

export function useReveal<T extends HTMLElement = HTMLDivElement>(opts: RevealOptions = {}) {
  const {
    direction = "up",
    delay = 0,
    threshold = 0.12,
    distance = 18,
    duration = 1100,
    once = true,
  } = opts;

  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          if (once) obs.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : initialTransform(direction, distance),
    transition: `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
    willChange: "opacity, transform",
  };

  return { ref, isVisible: visible, style };
}

// Backward-compatible alias used across existing components
export const useScrollReveal = (threshold = 0.12) => {
  const { ref, isVisible } = useReveal({ threshold });
  return { ref, isVisible };
};
