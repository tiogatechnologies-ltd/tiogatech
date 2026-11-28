import { useEffect } from "react";

/**
 * F1 - Floating Layer Manager
 *
 * Tracks active fixed bottom bars (e.g., StickyBuyBar on PDPs or StillDecidingBar
 * across shop routes) and exposes the tallest active bar height via the CSS custom
 * property `--bottom-bar-h` on `document.documentElement` and `document.body`.
 *
 * Floating widgets (AI chat bubble, ScrollToTopButton, SocialProofToast) position
 * themselves with `calc(... + var(--bottom-bar-h, 0px))` so nothing overlaps on
 * either desktop or 375px mobile viewports.
 */

const activeBars = new Map<string, number>();

function syncCssVariable() {
  if (typeof document === "undefined") return;
  let maxHeight = 0;
  for (const h of activeBars.values()) {
    if (h > maxHeight) maxHeight = h;
  }
  const value = `${Math.round(maxHeight)}px`;
  document.documentElement.style.setProperty("--bottom-bar-h", value);
  if (document.body) {
    document.body.style.setProperty("--bottom-bar-h", value);
  }
}

export function setBottomBarHeight(id: string, heightPx: number): void {
  if (heightPx <= 0) {
    activeBars.delete(id);
  } else {
    activeBars.set(id, heightPx);
  }
  syncCssVariable();
}

export function clearBottomBarHeight(id: string): void {
  if (activeBars.delete(id)) {
    syncCssVariable();
  }
}

export function getActiveBottomBarHeight(): number {
  let maxHeight = 0;
  for (const h of activeBars.values()) {
    if (h > maxHeight) maxHeight = h;
  }
  return maxHeight;
}

export function hasActiveBottomBar(exceptId?: string): boolean {
  for (const [id, h] of activeBars.entries()) {
    if (id !== exceptId && h > 0) return true;
  }
  return false;
}

/**
 * Registers a fixed bottom bar's height while `active` is true, and cleans up
 * automatically on unmount or when hidden.
 */
export function useRegisterBottomBar(id: string, active: boolean, heightPx: number): void {
  useEffect(() => {
    if (active && heightPx > 0) {
      setBottomBarHeight(id, heightPx);
    } else {
      clearBottomBarHeight(id);
    }
    return () => {
      clearBottomBarHeight(id);
    };
  }, [id, active, heightPx]);
}
