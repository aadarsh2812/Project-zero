const CACHE_NAME = 'hotel-menu-v1';
const API_CACHE  = 'hotel-api-v1';

// Static shell
const SHELL_URLS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Cache-first for menu API
  if (url.pathname.startsWith('/api/menu/')) {
    e.respondWith(
      caches.open(API_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        cache.put(e.request, fresh.clone());
        return fresh;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for CDN images (unsplash, etc)
  if (url.hostname !== self.location.hostname && e.request.destination === 'image') {
    e.respondWith(
      caches.open(API_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        cache.put(e.request, fresh.clone());
        return fresh;
      }).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // Network-first for everything else
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
