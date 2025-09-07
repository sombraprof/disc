// Config do Service Worker
try { importScripts('./js/sw-config.js'); } catch(e) {}
const CACHE_NAME = (self.APP_CACHE_PREFIX || 'spa-starter') + '-' + (self.APP_CACHE_VERSION || 'v1');
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/tailwind.css',
  './js/main.js',
  './offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      // Navigation preload (melhora tempo para HTML)
      if ('navigationPreload' in self.registration) {
        try { await self.registration.navigationPreload.enable(); } catch (e) { console.error(e); }
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Navegações: cache first -> network -> offline
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match('./index.html');
        try {
          const preload = await event.preloadResponse;
          if (preload) return preload;
        } catch (e) { console.error(e); }
        try {
          const res = await fetch(req);
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        } catch {
          return cached || caches.match('./offline.html');
        }
      })()
    );
    return;
  }
  // Demais requisições: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
