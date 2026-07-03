// One-release cleanup worker for old app-shell caches.
// The current app does not register a service worker; this file exists so
// returning browsers with an older /sw.js registration can update, delete the
// old Tioga/Workbox caches, refresh controlled pages, and unregister itself.
function isTiogaAppCache(name) {
  return name.startsWith("tioga") || /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.allSettled(cacheNames.filter(isTiogaAppCache).map((name) => caches.delete(name)));
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(clients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);