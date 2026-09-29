import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

const SCROLL_THRESHOLD = 300; // Must scroll down at least 300px before button can appear
const STAGNANT_DELAY_MS = 2000; // Disappear after 2 seconds of scroll stagnation

/**
 * Floating "Back to Top" button.
 * - Appears ONLY when the user is actively scrolling back UP after having scrolled down.
 * - Disappears immediately when scrolling DOWN or near the top (<300px).
 * - Disappears when the user becomes STAGNANT (stops scrolling for 2 seconds).
 * - Smoothly scrolls to the top when clicked.
 */
const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const lastScrollY = useRef(0);
  const stagnationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clearance for product/package detail pages that feature a fixed mobile bottom action bar
  const isDetailPage = /^\/(packages\/(solar|lock|automation|cctv)\/|product\/)/.test(location.pathname);
  const isAdmin = location.pathname.startsWith("/admin");

  const clearTimer = () => {
    if (stagnationTimer.current) {
      clearTimeout(stagnationTimer.current);
      stagnationTimer.current = null;
    }
  };

  // Reset visibility and scroll position on page/route transition
  useEffect(() => {
    clearTimer();
    setVisible(false);
    lastScrollY.current = typeof window !== "undefined" ? window.scrollY : 0;
  }, [location.pathname]);

  useEffect(() => {
    if (isAdmin || typeof window === "undefined") return;

    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const prevY = lastScrollY.current;
      const delta = prevY - currentY; // positive = scrolling UP, negative = scrolling DOWN

      // Near top: always hide immediately
      if (currentY < SCROLL_THRESHOLD) {
        clearTimer();
        setVisible(false);
        lastScrollY.current = currentY;
        return;
      }

      // Scrolling DOWN: hide immediately
      if (delta < -4) {
        clearTimer();
        setVisible(false);
        lastScrollY.current = currentY;
        return;
      }

      // Scrolling UP: show button and reset stagnation timer
      if (delta > 6) {
        setVisible(true);

        clearTimer();
        stagnationTimer.current = setTimeout(() => {
          setVisible(false);
        }, STAGNANT_DELAY_MS);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimer();
    };
  }, [isAdmin]);

  const scrollToTop = () => {
    clearTimer();
    setVisible(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isAdmin) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to top"
      className={`fixed ${
        isDetailPage ? "bottom-36 sm:bottom-24" : "bottom-20 sm:bottom-24"
      } right-3.5 sm:right-6 z-30 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-card/95 text-foreground border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 ease-out hover:text-primary hover:border-primary/50 hover:shadow-primary/20 active:scale-95 ${
        visible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-3 scale-90 pointer-events-none"
      }`}
    >
      <ArrowUp size={19} className="transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
};

export default ScrollToTopButton;
