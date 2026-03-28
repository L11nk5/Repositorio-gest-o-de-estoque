/* PWA: cache do app para GitHub Pages / HTTPS — iOS (16.4+) e Android. */
const CACHE_NAME = "estoque-pwa-v10";

function scopeBase() {
  return self.registration.scope;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const base = scopeBase();
      const urls = [
        new URL("index.html", base).href,
        new URL("manifest.json", base).href,
        new URL("sw.js", base).href,
        new URL("logo.png", base).href,
        new URL("icon-192.png", base).href,
        new URL("icon-512.png", base).href,
        new URL("favicon.ico", base).href,
        new URL("favicon_io/favicon-32x32.png", base).href,
        new URL("favicon_io/apple-touch-icon.png", base).href,
        base,
      ];
      const cache = await caches.open(CACHE_NAME);
      for (const url of urls) {
        try {
          await cache.add(new Request(url, { cache: "reload" }));
        } catch (_) {}
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        const res = await fetch(event.request);
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, copy).catch(() => {});
        }
        return res;
      } catch {
        if (event.request.mode === "navigate") {
          const fallback = await caches.match(new URL("index.html", scopeBase()).href);
          if (fallback) return fallback;
        }
        return Response.error();
      }
    })()
  );
});
