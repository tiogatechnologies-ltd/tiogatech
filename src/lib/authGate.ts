// Lightweight auth gating helpers: preserve in-progress work and route to /auth.
export const saveDraft = (key: string, data: unknown) => {
  try { sessionStorage.setItem(`draft:${key}`, JSON.stringify(data)); } catch {}
};
export const loadDraft = <T = any>(key: string): T | null => {
  try {
    const raw = sessionStorage.getItem(`draft:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
};
export const clearDraft = (key: string) => {
  try { sessionStorage.removeItem(`draft:${key}`); } catch {}
};

/** Build a link to /auth that returns the user to the given path afterwards. */
export const authHref = (next?: string, mode: "signin" | "signup" = "signup") => {
  const n = next ?? (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");
  return `/auth?mode=${mode}&next=${encodeURIComponent(n)}`;
};
