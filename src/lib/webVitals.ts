/**
 * Lightweight web vitals + error monitoring.
 * No dependencies — uses native PerformanceObserver.
 * Reports once per page session to console + a single conversion row.
 */
import { supabase } from "@/integrations/supabase/client";

type Metric = { name: string; value: number; rating?: string; meta?: Record<string, any> };

const sent = new Set<string>();
const QUEUE: Metric[] = [];
let flushTimer: number | null = null;

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("tioga_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("tioga_session_id", sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

function rating(name: string, v: number): string {
  if (name === "LCP") return v <= 2500 ? "good" : v <= 4000 ? "needs-improvement" : "poor";
  if (name === "INP") return v <= 200 ? "good" : v <= 500 ? "needs-improvement" : "poor";
  if (name === "CLS") return v <= 0.1 ? "good" : v <= 0.25 ? "needs-improvement" : "poor";
  return "n/a";
}

function send(m: Metric) {
  if (sent.has(m.name)) return;
  sent.add(m.name);
  m.rating = rating(m.name, m.value);
  // eslint-disable-next-line no-console
  console.info(`[vitals] ${m.name} = ${Math.round(m.value * 100) / 100} (${m.rating})`, m.meta || "");
  QUEUE.push(m);
  if (flushTimer == null) {
    flushTimer = window.setTimeout(flush, 3000);
  }
}

async function flush() {
  flushTimer = null;
  if (!QUEUE.length) return;
  const batch = QUEUE.splice(0, QUEUE.length);
  try {
    await supabase.from("conversions").insert(
      batch.map((m) => ({
        session_id: getSessionId(),
        event_type: "vitals" as any,
        page_path: location.pathname,
        metadata: { metric: m.name, value: m.value, rating: m.rating, ...m.meta } as any,
      })),
    );
  } catch {
    /* swallow */
  }
}

export function initWebVitals() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  // LCP
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];
      const last = entries[entries.length - 1];
      if (last) {
        send({
          name: "LCP",
          value: last.renderTime || last.loadTime || last.startTime,
          meta: { element: last.element?.tagName, url: last.url },
        });
      }
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") po.takeRecords();
    });
  } catch {}

  // CLS
  try {
    let cls = 0;
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as any[]) {
        if (!e.hadRecentInput) cls += e.value;
      }
    });
    po.observe({ type: "layout-shift", buffered: true });
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sent.delete("CLS");
        send({ name: "CLS", value: cls });
      }
    });
  } catch {}

  // INP (approximate via slowest event duration)
  try {
    let worst = 0;
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as any[]) {
        if (e.duration > worst) worst = e.duration;
      }
    });
    po.observe({ type: "event", durationThreshold: 40, buffered: true } as any);
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && worst > 0) {
        sent.delete("INP");
        send({ name: "INP", value: worst });
      }
    });
  } catch {}

  // Runtime errors
  const reportError = (err: any, kind: string) => {
    try {
      // eslint-disable-next-line no-console
      console.error(`[error:${kind}]`, err);
      supabase.from("conversions").insert({
        session_id: getSessionId(),
        event_type: "error" as any,
        page_path: location.pathname,
        metadata: {
          kind,
          message: String(err?.message || err),
          stack: err?.stack?.slice(0, 1000),
        } as any,
      });
    } catch {}
  };
  addEventListener("error", (e) => reportError(e.error || e.message, "window"));
  addEventListener("unhandledrejection", (e) => reportError(e.reason, "promise"));
}
