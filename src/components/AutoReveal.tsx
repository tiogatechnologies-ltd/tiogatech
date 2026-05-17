import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Global scroll-reveal: finds every <section> on the current page and
 * fades + lifts it into view as it enters the viewport. Re-scans on every
 * route change so it works on every page without per-component edits.
 *
 * Components that opt out can add `data-no-reveal` on the section.
 */
const AutoReveal = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let observer: IntersectionObserver | null = null;
    const tracked = new Set<Element>();

    const arm = (el: Element) => {
      if (tracked.has(el)) return;
      if (el.hasAttribute("data-no-reveal")) return;
      tracked.add(el);
      el.classList.add("auto-reveal");
      observer!.observe(el);
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("auto-reveal-in");
            observer!.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 5% 0px" }
    );

    // Initial scan
    document.querySelectorAll("section").forEach(arm);

    // Watch DOM for late-mounted sections (modals, async data, etc.)
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.tagName === "SECTION") arm(n);
          n.querySelectorAll?.("section").forEach(arm);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Re-scan shortly after route mount
    const t = setTimeout(() => {
      document.querySelectorAll("section").forEach(arm);
    }, 50);

    return () => {
      clearTimeout(t);
      mo.disconnect();
      observer?.disconnect();
      tracked.forEach((el) => {
        el.classList.remove("auto-reveal", "auto-reveal-in");
      });
    };
  }, [pathname]);

  return null;
};

export default AutoReveal;
