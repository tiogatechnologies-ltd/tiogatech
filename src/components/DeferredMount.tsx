import { useEffect, useState } from "react";

/**
 * Mount children only after the browser is idle or after a delay,
 * whichever comes first. Keeps non-critical UI (chat, popups) from
 * blocking initial paint and TTI.
 */
const DeferredMount = ({ children, delay = 1500 }: { children: React.ReactNode; delay?: number }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const go = () => { if (!cancelled) setReady(true); };
    const w = window as any;
    const idleId = w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: delay }) : null;
    const t = window.setTimeout(go, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      if (idleId && w.cancelIdleCallback) w.cancelIdleCallback(idleId);
    };
  }, [delay]);
  return ready ? <>{children}</> : null;
};

export default DeferredMount;
