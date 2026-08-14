import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackConversion } from "@/lib/tracking";

function getSessionId(): string {
  let sid = sessionStorage.getItem("tioga_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("tioga_session_id", sid);
  }
  return sid;
}

/** Capture and persist UTMs for the session on first hit. */
function captureUtm(): Record<string, string | null> {
  const cached = sessionStorage.getItem("tioga_utm");
  if (cached) {
    try { return JSON.parse(cached); } catch { /* fallthrough */ }
  }
  const p = new URLSearchParams(window.location.search);
  const utm = {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_term: p.get("utm_term"),
    utm_content: p.get("utm_content"),
  };
  sessionStorage.setItem("tioga_utm", JSON.stringify(utm));
  return utm;
}

/** Returns { isNew, landing } and remembers landing path for the session. */
function sessionMeta(path: string): { isNew: boolean; landing: string } {
  const key = "tioga_session_meta";
  const raw = sessionStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return { isNew: false, landing: parsed.landing || path };
    } catch { /* fallthrough */ }
  }
  sessionStorage.setItem(key, JSON.stringify({ landing: path, startedAt: Date.now() }));
  return { isNew: true, landing: path };
}

export function usePageTracker() {
  const location = useLocation();
  const lastPath = useRef<string>("");
  const scrollFired = useRef<Set<number>>(new Set());
  const pageEnter = useRef<number>(Date.now());
  const activeMs = useRef<number>(0);
  const lastActive = useRef<number>(Date.now());

  // Web Vitals & Performance Observer
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          trackConversion("vitals", { metric: "LCP", value: Math.round(lastEntry.startTime) });
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsVal = 0;
        for (const entry of entryList.getEntries() as any[]) {
          if (!entry.hadRecentInput) clsVal += entry.value;
        }
        if (clsVal > 0) {
          trackConversion("vitals", { metric: "CLS", value: Number(clsVal.toFixed(3)) });
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      // Error Listener
      const handleError = (e: ErrorEvent) => {
        trackConversion("error", { message: e.message, filename: e.filename, lineno: e.lineno });
      };
      window.addEventListener("error", handleError);
      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        window.removeEventListener("error", handleError);
      };
    } catch { /* ignored */ }
  }, []);

  // Session end / duration flush
  useEffect(() => {
    const flush = () => {
      const dur = activeMs.current + Math.max(0, Date.now() - lastActive.current);
      if (dur < 2000) return; // ignore ultra-short bounces
      try {
        trackConversion("session_end", { duration_ms: dur });
      } catch { /* noop */ }
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        activeMs.current += Date.now() - lastActive.current;
        flush();
      } else {
        lastActive.current = Date.now();
      }
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Scroll depth tracking
  useEffect(() => {
    const thresholds = [25, 50, 75, 100];
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height <= 0) return;
      const pct = Math.min(100, Math.round((scrollTop / height) * 100));
      for (const t of thresholds) {
        if (pct >= t && !scrollFired.current.has(t)) {
          scrollFired.current.add(t);
          trackConversion("scroll_depth", { pct: t, path: window.location.pathname });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  // Page hit tracking
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/admin") || path === lastPath.current) return;
    lastPath.current = path;
    scrollFired.current = new Set();
    pageEnter.current = Date.now();
    lastActive.current = Date.now();

    const session_id = getSessionId();
    const utm = captureUtm();
    const { isNew, landing } = sessionMeta(path);

    // Direct database write to page_views table
    supabase.from("page_views").insert({
      session_id,
      page_path: path,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      landing_path: landing,
      is_new_session: isNew,
      utm_source: utm?.utm_source || null,
      utm_medium: utm?.utm_medium || null,
      utm_campaign: utm?.utm_campaign || null,
    }).then(() => {}).catch(() => {});
  }, [location.pathname]);
}
