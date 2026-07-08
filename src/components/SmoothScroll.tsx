import { useEffect } from "react";
import Lenis from "lenis";

const SmoothScroll = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.075,
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
      smoothWheel: true,
      // @ts-ignore - older types
      smoothTouch: false,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Keyboard scroll support (arrow keys, PageUp/Down, Space, Home/End)
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable ||
        el.closest("[data-lenis-prevent]") !== null
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const vh = window.innerHeight;
      let delta = 0;
      switch (e.key) {
        case "ArrowDown": delta = 80; break;
        case "ArrowUp": delta = -80; break;
        case "PageDown": delta = vh * 0.9; break;
        case "PageUp": delta = -vh * 0.9; break;
        case " ": delta = e.shiftKey ? -vh * 0.9 : vh * 0.9; break;
        case "Home":
          e.preventDefault();
          lenis.scrollTo(0);
          return;
        case "End":
          e.preventDefault();
          lenis.scrollTo(document.documentElement.scrollHeight);
          return;
        default: return;
      }
      e.preventDefault();
      lenis.scrollTo(lenis.scroll + delta);
    };
    window.addEventListener("keydown", onKey, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      lenis.destroy();
    };
  }, []);

  return null;
};

export default SmoothScroll;
