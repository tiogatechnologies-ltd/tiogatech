// Captures affiliate code + UTM params from URL once and persists them in
// localStorage so any lead form submitted later can be attributed correctly.

const STORAGE_KEY = "tioga_attribution_v1";

export type Attribution = {
  affiliate_code?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
  captured_at?: string;
};

const isExpired = (iso: string | undefined) => {
  if (!iso) return true;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return true;
  // 60 day attribution window
  return Date.now() - ts > 60 * 24 * 60 * 60 * 1000;
};

export function captureAttributionFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const aff = params.get("aff") || params.get("ref");
    const us = params.get("utm_source");
    const um = params.get("utm_medium");
    const uc = params.get("utm_campaign");
    if (!aff && !us && !um && !uc) {
      // Nothing in URL — only store referrer if we have none stored yet
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
    const next: Attribution = {
      affiliate_code: aff ? aff.slice(0, 80) : null,
      utm_source: us ? us.slice(0, 120) : null,
      utm_medium: um ? um.slice(0, 120) : null,
      utm_campaign: uc ? uc.slice(0, 120) : null,
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
    utm_source: a.utm_source || null,
    utm_medium: a.utm_medium || null,
    utm_campaign: a.utm_campaign || null,
    referrer: a.referrer || null,
  };
}
