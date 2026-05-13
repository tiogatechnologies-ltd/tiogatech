import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Fades the route content out (180ms) and the new route in (450ms expo-out + 8px translateY)
 * on every pathname change. CSS-only, no extra deps.
 */
const RouteFade = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [stage, setStage] = useState<"in" | "out">("in");
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    setStage("out");
    const t = setTimeout(() => {
      lastPath.current = pathname;
      setStage("in");
    }, 180);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      style={{
        opacity: stage === "in" ? 1 : 0,
        transform: stage === "in" ? "translateY(0)" : "translateY(8px)",
        transition:
          stage === "in"
            ? "opacity 450ms cubic-bezier(0.16,1,0.3,1), transform 450ms cubic-bezier(0.16,1,0.3,1)"
            : "opacity 180ms ease-out, transform 180ms ease-out",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
};

export default RouteFade;
