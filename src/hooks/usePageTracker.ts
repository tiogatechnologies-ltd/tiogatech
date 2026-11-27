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

// Same rules as supabase/functions/track-pageview, which this hook replaced
// with a direct insert (one write per view instead of an edge invocation plus
// a read and a write). The direct insert had silently dropped the device type,
// the bot filter and the 30s de-dupe; they are applied here instead.
const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|preview|headless|lighthouse|pingdom|uptimerobot|gtmetrix/i;

export function parseDeviceType(ua: string, maxTouchPoints = 0): "mobile" | "tablet" | "desktop" {
  if (/ipad/i.test(ua)) return "tablet";
  // iPadOS 13+ reports itself as a Mac; it still exposes touch points.
  if (/macintosh/i.test(ua) && maxTouchPoints > 1) return "tablet";
  if (/tablet|playbook|silk|kindle/i.test(ua)) return "tablet";
  if (/android/i.test(ua) && !/mobile/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

const DEDUPE_KEY = "tioga_pv_last";
const DEDUPE_MS = 30_000;

/** True when this session recorded the same path in the last 30s (e.g. a reload). */
function isRecentDuplicate(sessionId: string, path: string): boolean {
  try {
    const raw = sessionStorage.getItem(DEDUPE_KEY);
    const prev = raw ? JSON.parse(raw) : null;
    const now = Date.now();
    sessionStorage.setItem(DEDUPE_KEY, JSON.stringify({ s: sessionId, p: path, t: now }));
    return !!prev && prev.s === sessionId && prev.p === path && now - Number(prev.t) < DEDUPE_MS;
  } catch {
    return false;
  }
}

export function usePageTracker() {
  const location = useLocation();
  const lastPath = useRef<string>("");
  const scrollFired = useRef<Set<number>>(new Set());
  const activeMs = useRef<number>(0);
  const lastActive = useRef<number>(Date.now());
  const visible = useRef<boolean>(typeof document === "undefined" || document.visibilityState !== "hidden");

  // Web vitals and runtime errors are reported once per page load by
  // initWebVitals() in main.tsx. This hook used to run its own LCP/CLS/error
  // observers as well, which wrote every vital and error twice (LCP once per
  // candidate entry) and skewed the Performance tab.

  // Session end / duration flush. Only visible time counts, and route changes
  // no longer reset the clock (they used to drop all time spent before the
  // last navigation, and a hidden span was counted twice on flush).
  useEffect(() => {
    const visibleSpan = () => (visible.current ? Math.max(0, Date.now() - lastActive.current) : 0);
    const flush = () => {
      const dur = activeMs.current + visibleSpan();
      if (dur < 2000) return; // ignore ultra-short bounces
      try {
        trackConversion("session_end", { duration_ms: dur });
      } catch { /* noop */ }
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        activeMs.current += visibleSpan();
        visible.current = false;
        flush();
      } else {
        visible.current = true;
        lastActive.current = Date.now();
      }
    };
    // pagehide right after visibilitychange->hidden would report the same total again.
    const onPageHide = () => { if (visible.current) flush(); };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
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

    const ua = navigator.userAgent || "";
    if (navigator.webdriver || BOT_RE.test(ua)) return;

    const session_id = getSessionId();
    if (isRecentDuplicate(session_id, path)) return;
    const utm = captureUtm();
    const { isNew, landing } = sessionMeta(path);

    // Direct database write to page_views table
    supabase.from("page_views").insert({
      session_id,
      page_path: path,
      referrer: document.referrer || null,
      user_agent: ua,
      device_type: parseDeviceType(ua, navigator.maxTouchPoints || 0),
      landing_path: landing,
      is_new_session: isNew,
      utm_source: utm?.utm_source || null,
      utm_medium: utm?.utm_medium || null,
      utm_campaign: utm?.utm_campaign || null,
    // The typed client returns a PromiseLike, so use the rejection handler on
    // `then` instead of chaining Promise-only `catch` for this fire-and-forget
    // analytics write.
    }).then(({ error }) => {
      if (error) console.warn("[tracking] page view insert failed", error.message);
    }, () => undefined);
  }, [location.pathname]);
}
