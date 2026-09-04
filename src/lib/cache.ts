// App-owned cache/version cleanup. Public content must render from fresh backend
// reads on every page load; this file only clears legacy Tioga caches and stale
// app-shell service workers that can hide new pages for returning visitors.

import { supabase } from "@/integrations/supabase/client";

declare const __APP_VERSION__: string;

export const APP_VERSION = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";
export const APP_PREFIX = "tioga_";
export const LEGACY_APP_PREFIXES = ["tioga:", "tioga.", "_tid_"];

const BUILD_KEY = `${APP_PREFIX}build_id`;
const LOCAL_KEY = `${APP_PREFIX}cache_bust`;

export const cacheKey = (name: string) => `${APP_PREFIX}cache_${name}_${APP_VERSION}`;

const isTiogaCacheKey = (key: string) => {
  if (key === "tioga_cart_v1") return false;
  if (key === "tioga_tg_popup_dismissed_at") return false;
  return (
    key.startsWith(`${APP_PREFIX}cache_`) ||
    key === BUILD_KEY ||
    key === LOCAL_KEY ||
    LEGACY_APP_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
};

const removeMatchingStorageKeys = (storage: Storage) => {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && isTiogaCacheKey(key)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
};

/** Wipe every cached read we control. */
export const purgeLocalCache = () => {
  try { removeMatchingStorageKeys(sessionStorage); } catch {}
  try { removeMatchingStorageKeys(localStorage); } catch {}
};

const purgeServiceWorkerCaches = async () => {
  if (typeof window === "undefined") return;
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        registrations
          .filter((registration) => {
            const script = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";
            return script.includes("/sw.js") || script.includes("/service-worker.js");
          })
          .map((registration) => registration.unregister()),
      );
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.allSettled(
        names
          .filter((name) => name.startsWith("tioga") || /(^|-)precache-v\d+-|(^|-)runtime-/.test(name))
          .map((name) => caches.delete(name)),
      );
    }
  } catch {}
};

export const markUpdatedNotice = () => {
  try { sessionStorage.setItem(`${APP_PREFIX}updated_notice`, "1"); } catch {}
};

export const consumeUpdatedNotice = () => {
  try {
    const value = sessionStorage.getItem(`${APP_PREFIX}updated_notice`) === "1";
    sessionStorage.removeItem(`${APP_PREFIX}updated_notice`);
    return value;
  } catch {
    return false;
  }
};

/** Check server cache_bust value and wipe local cache if it moved. Runs once at app boot. */
let bootChecked = false;
export const initCacheBustCheck = async () => {
  if (bootChecked) return;
  bootChecked = true;
  let shouldReload = false;
  try {
    const localBuild = localStorage.getItem(BUILD_KEY);
    if (localBuild !== APP_VERSION) {
      purgeLocalCache();
      await purgeServiceWorkerCaches();
      localStorage.setItem(BUILD_KEY, APP_VERSION);
      if (localBuild) {
        markUpdatedNotice();
        shouldReload = true;
      }
    }

    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "cache_bust")
      .maybeSingle();
    const remote = (data?.value as any)?.bumped_at ?? null;
    if (!remote) {
      if (shouldReload) window.location.reload();
      return;
    }
    const local = localStorage.getItem(LOCAL_KEY);
    if (local !== remote) {
      purgeLocalCache();
      await purgeServiceWorkerCaches();
      localStorage.setItem(LOCAL_KEY, remote);
      if (local) {
        markUpdatedNotice();
        shouldReload = true;
      }
    }
  } catch {
    // network hiccup - silently ignore, cache remains valid
  } finally {
    if (shouldReload) window.location.reload();
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
  await purgeServiceWorkerCaches();
  try { localStorage.setItem(LOCAL_KEY, now); } catch {}
  return now;
};
