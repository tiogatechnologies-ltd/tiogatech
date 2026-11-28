import { useEffect, useState } from "react";

/**
 * F3 - Shared Countdown Ticker
 *
 * Maintains a single page-wide 1-second `setInterval` shared across all active
 * countdown widgets (hero banner, Black Friday deal row cards, package deals),
 * pausing automatically when `document.hidden` is true to save CPU/battery.
 *
 * Honesty rule (WS5): When `endsAtIso` is missing, invalid, or in the past,
 * `getCountdownParts` returns `{ active: false, expired: true }` and timers
 * disappear - never silently resetting to "next Friday".
 */

/** Official Black Friday 2026 campaign window (23–29 Nov 2026 WAT). */
export const BLACK_FRIDAY_START_ISO = "2026-11-23T00:00:00+01:00";
export const BLACK_FRIDAY_END_ISO = "2026-11-29T23:59:59+01:00";

export interface CountdownParts {
  active: boolean;
  expired: boolean;
  totalMs: number;
  d: number;
  h: number;
  m: number;
  s: number;
}

/**
 * Resolves the active campaign end timestamp cleanly:
 * - If an admin explicitly configured a date >= BLACK_FRIDAY_START_ISO (i.e. for
 *   this campaign or a future one), honor that exact date (including when it expires).
 * - If the DB row is empty OR still holds a legacy pre-Black-Friday date (e.g. from
 *   an older promotion earlier in 2026), and `nowMs` is within the official
 *   23–29 Nov 2026 Black Friday window, return `BLACK_FRIDAY_END_ISO`.
 * - After 29 Nov 2026 23:59:59 WAT, returns `BLACK_FRIDAY_END_ISO` (which is expired),
 *   so every timer hides automatically and NEVER resets to next Friday.
 */
export function resolveCampaignEndsAt(
  configuredEndsAt?: string | null,
  nowMs: number = Date.now(),
): string | null {
  const bfStart = Date.parse(BLACK_FRIDAY_START_ISO);
  const bfEnd = Date.parse(BLACK_FRIDAY_END_ISO);

  if (configuredEndsAt && typeof configuredEndsAt === "string" && configuredEndsAt.trim()) {
    const parsed = Date.parse(configuredEndsAt);
    if (Number.isFinite(parsed) && parsed >= bfStart) {
      return configuredEndsAt;
    }
  }

  // Within the official Black Friday 2026 window -> use official campaign end
  if (nowMs >= bfStart && nowMs <= bfEnd) {
    return BLACK_FRIDAY_END_ISO;
  }

  // Outside the window with no newer admin campaign configured -> expired / inactive
  return null;
}

export function getCountdownParts(
  endsAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): CountdownParts {
  if (!endsAtIso || typeof endsAtIso !== "string") {
    return { active: false, expired: true, totalMs: 0, d: 0, h: 0, m: 0, s: 0 };
  }
  const targetMs = Date.parse(endsAtIso);
  if (!Number.isFinite(targetMs)) {
    return { active: false, expired: true, totalMs: 0, d: 0, h: 0, m: 0, s: 0 };
  }
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return { active: false, expired: true, totalMs: 0, d: 0, h: 0, m: 0, s: 0 };
  }
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { active: true, expired: false, totalMs: diff, d, h, m, s };
}

type Listener = (nowMs: number) => void;

const listeners = new Set<Listener>();
let timerId: number | null = null;
let visibilityBound = false;

function broadcast() {
  const now = Date.now();
  listeners.forEach((fn) => fn(now));
}

function startTimer() {
  if (timerId !== null || typeof window === "undefined") return;
  if (typeof document !== "undefined" && document.hidden) return;
  timerId = window.setInterval(broadcast, 1000);
}

function stopTimer() {
  if (timerId !== null && typeof window !== "undefined") {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function handleVisibilityChange() {
  if (typeof document === "undefined") return;
  if (document.hidden) {
    stopTimer();
  } else if (listeners.size > 0) {
    broadcast();
    startTimer();
  }
}

export function subscribeCountdownTick(listener: Listener): () => void {
  listeners.add(listener);
  if (typeof document !== "undefined" && !visibilityBound) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityBound = true;
  }
  startTimer();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopTimer();
    }
  };
}

/**
 * React hook backed by the single shared page ticker.
 * Automatically unsubscribes if `endsAtIso` is missing or once it expires.
 */
export function useSharedCountdown(endsAtIso: string | null | undefined): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(() => getCountdownParts(endsAtIso));

  useEffect(() => {
    const initial = getCountdownParts(endsAtIso);
    setParts(initial);
    if (!initial.active) return;

    const unsubscribe = subscribeCountdownTick((nowMs) => {
      const next = getCountdownParts(endsAtIso, nowMs);
      setParts(next);
      if (!next.active) {
        unsubscribe();
      }
    });

    return unsubscribe;
  }, [endsAtIso]);

  return parts;
}
