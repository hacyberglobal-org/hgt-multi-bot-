const CACHE_NAME = 'hgt-spark-bot-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') {
    return;
  }

  // Only handle same-origin HTTP/HTTPS requests
  const isSameOrigin = e.request.url.startsWith(self.location.origin);
  if (!isSameOrigin) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
