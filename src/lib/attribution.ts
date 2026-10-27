// Captures affiliate code + UTM params from URL once and persists them in
// localStorage so any lead form submitted later can be attributed correctly.

import { loadSetting } from "@/hooks/useSiteSetting";

const STORAGE_KEY = "tioga_attribution_v1";

// Admin > Settings > Affiliates > "Referral tracking window". Starts at the
// long-standing 60 days and is replaced once the saved setting has loaded.
let attributionWindowDays = 60;
let windowRequested = false;
const refreshAttributionWindow = () => {
  if (windowRequested) return;
  windowRequested = true;
  loadSetting("affiliate")
    .then((cfg) => {
      const days = Number(cfg?.cookie_window_days);
      if (Number.isFinite(days) && days > 0) attributionWindowDays = days;
    })
    .catch(() => undefined);
};

// Codes are stored lower-case and matched exactly downstream, so a link typed
// as ?ref=JOHN must resolve to "john" or the sale is never credited.
const normalizeCode = (raw: string | null) => {
  const code = (raw ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return code || null;
};

export type Attribution = {
  affiliate_code?: string | null;
  affiliate_link_slug?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
  captured_at?: string;
};

const isExpired = (iso: string | undefined) => {
  if (!iso) return true;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > attributionWindowDays * 24 * 60 * 60 * 1000;
};

export function captureAttributionFromUrl() {
  if (typeof window === "undefined") return;
  refreshAttributionWindow();
  try {
    const params = new URLSearchParams(window.location.search);
    const aff = normalizeCode(params.get("aff") || params.get("ref"));
    const alk = params.get("alk");
    const us = params.get("utm_source");
    const um = params.get("utm_medium");
    const uc = params.get("utm_campaign");
    const ut = params.get("utm_term");
    const ucn = params.get("utm_content");
    if (!aff && !alk && !us && !um && !uc) {
      // Nothing in URL - only store referrer if we have none stored yet
      const existing = getAttribution();
      if (!existing && document.referrer && !document.referrer.includes(window.location.host)) {
        const next: Attribution = {
          referrer: document.referrer.slice(0, 500),
          captured_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return;
    }
    // A later visit that only carries UTM tags (a newsletter, an ad) must not
    // wipe an affiliate who already referred this visitor. A new affiliate link
    // still wins (last affiliate click).
    const kept = !aff ? getAttribution() : null;
    const next: Attribution = {
      affiliate_code: aff ?? kept?.affiliate_code ?? null,
      affiliate_link_slug: alk ? alk.slice(0, 64) : aff ? null : kept?.affiliate_link_slug ?? null,
      utm_source: us ? us.slice(0, 120) : null,
      utm_medium: um ? um.slice(0, 120) : null,
      utm_campaign: uc ? uc.slice(0, 120) : null,
      utm_term: ut ? ut.slice(0, 120) : null,
      utm_content: ucn ? ucn.slice(0, 120) : null,
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
      captured_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  refreshAttributionWindow();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: Attribution = JSON.parse(raw);
    if (isExpired(parsed.captured_at)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function attributionForLead() {
  const a = getAttribution();
  if (!a) return {};
  return {
    affiliate_code: a.affiliate_code || null,
    affiliate_link_slug: a.affiliate_link_slug || null,
    utm_source: a.utm_source || null,
    utm_medium: a.utm_medium || null,
    utm_campaign: a.utm_campaign || null,
    utm_term: a.utm_term || null,
    utm_content: a.utm_content || null,
    referrer: a.referrer || null,
  };
}

/** Attribution fields accepted by the submit-order edge function. */
export function attributionForOrder() {
  const a = getAttribution();
  if (!a) return {};
  return {
    affiliate_code: a.affiliate_code || null,
    affiliate_link_slug: a.affiliate_link_slug || null,
  };
}
