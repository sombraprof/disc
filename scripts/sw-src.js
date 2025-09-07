/* Workbox InjectManifest source */
/* global workbox */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Precache will be injected here by workbox-build
self.__WB_DISABLE_DEV_LOGS = true;

// Navigation fallback to index.html
// Using workbox-routing + workbox-strategies at runtime
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  workbox.core.clientsClaim();
  workbox.navigationPreload.enable();

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // App shell for navigations
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 5,
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 50, purgeOnQuotaError: true })],
    })
  );

  // Static assets: CSS/JS within origin
  workbox.routing.registerRoute(
    ({ request, url }) => url.origin === self.location.origin && /\.(?:css|js)$/.test(url.pathname),
    new workbox.strategies.StaleWhileRevalidate({ cacheName: 'static-assets' })
  );

  // Images
  workbox.routing.registerRoute(
    ({ url }) => url.origin === self.location.origin && /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname),
    new workbox.strategies.CacheFirst({ cacheName: 'images', plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })] })
  );

  // CDN fallbacks (highlight.js / fontawesome)
  workbox.routing.registerRoute(
    ({ url }) => url.hostname.includes('cdnjs.cloudflare.com'),
    new workbox.strategies.StaleWhileRevalidate({ cacheName: 'cdn-cached' })
  );
}

