import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/hooks/useSiteSetting", () => ({ loadSetting: async () => ({ cookie_window_days: 60 }) }));
import { captureAttributionFromUrl, getAttribution } from "@/lib/attribution";

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00Z")); });
afterEach(() => { vi.useRealTimers(); });
const visit = (search: string) => { window.history.replaceState({}, "", `/${search}`); captureAttributionFromUrl(); };

it("does not restart the affiliate window when a newsletter or ad brings the visitor back", () => {
  visit("?aff=PARTNER");
  const first = getAttribution();
  vi.setSystemTime(new Date("2026-02-20T12:00:00Z"));
  visit("?utm_source=newsletter");
  expect(getAttribution()?.affiliate_code).toBe("partner");
  expect(getAttribution()?.captured_at).toBe(first?.captured_at);
  vi.setSystemTime(new Date("2026-03-03T12:00:00Z"));
  expect(getAttribution()).toBeNull();
});

it("starts a fresh window for a new affiliate click", () => {
  visit("?aff=first");
  vi.setSystemTime(new Date("2026-02-20T12:00:00Z"));
  visit("?aff=second");
  vi.setSystemTime(new Date("2026-03-03T12:00:00Z"));
  expect(getAttribution()?.affiliate_code).toBe("second");
});
