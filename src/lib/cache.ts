// Global SWR-style cache invalidation. Every cache key produced by useBlog,
// useSolarPackages, useSmartLocks, useHomeAutomationPackages, useLandingContent
// is prefixed with CACHE_VERSION. Admins can force a global purge via the
// "Clear cache" button in Admin → Settings which bumps site_settings.cache_bust.

import { supabase } from "@/integrations/supabase/client";

// Bump this whenever we change the cache shape on disk.
export const CACHE_VERSION = "v4";

const LOCAL_KEY = "tioga.cacheBust";

export const cacheKey = (name: string) => `tioga:${name}:${CACHE_VERSION}`;

/** Wipe every cached read we control. */
export const purgeLocalCache = () => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("tioga:")) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
};

/** Check server cache_bust value and wipe local cache if it moved. Runs once at app boot. */
let bootChecked = false;
export const initCacheBustCheck = async () => {
  if (bootChecked) return;
  bootChecked = true;
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "cache_bust")
      .maybeSingle();
    const remote = (data?.value as any)?.bumped_at ?? null;
    if (!remote) return;
    const local = localStorage.getItem(LOCAL_KEY);
    if (local !== remote) {
      purgeLocalCache();
      try { localStorage.setItem(LOCAL_KEY, remote); } catch {}
    }
  } catch {
    // network hiccup — silently ignore, cache remains valid
  }
};

/** Called by the admin "Clear cache" button. Bumps server marker + purges own storage. */
export const bumpGlobalCache = async () => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "cache_bust", value: { bumped_at: now } as any }, { onConflict: "key" });
  if (error) throw error;
  purgeLocalCache();
  try { localStorage.setItem(LOCAL_KEY, now); } catch {}
  return now;
};
