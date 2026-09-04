import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating, semi-transparent "scroll to top" arrow.
 * Appears when the user scrolls down past 600px AND begins scrolling up.
 */
const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const scrollingUp = y < lastY;
      setVisible(y > 600 && scrollingUp);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-[30] hidden sm:grid h-11 w-11 place-items-center rounded-full backdrop-blur-md bg-foreground/30 hover:bg-foreground/50 text-background shadow-lg border border-background/20 transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp size={18} />
    </button>
  );
};

export default ScrollToTopButton;
