/**
 * Aura Symphony Service Worker
 *
 * Caching strategies:
 *   - Static assets: Cache-First (fonts, CSS, JS bundles)
 *   - API responses: Network-First with cache fallback
 *   - Video frames: Cache-First with TTL
 *   - CDN resources: Stale-While-Revalidate
 */

const CACHE_NAME = 'aura-symphony-v1';
const STATIC_CACHE = 'aura-static-v1';
const API_CACHE = 'aura-api-v1';
const FRAME_CACHE = 'aura-frames-v1';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// ─── Install ──────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Some URLs may fail in development; that's OK
        console.log('[SW] Some precache URLs failed (expected in dev)');
      });
    }),
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old cache versions
            return (
              name.startsWith('aura-') &&
              name !== STATIC_CACHE &&
              name !== API_CACHE &&
              name !== FRAME_CACHE
            );
          })
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip WebSocket and chrome-extension requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.protocol === 'chrome-extension:') return;

  // Strategy selection based on URL pattern
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirst(event.request, API_CACHE));
  } else if (isCDNResource(url)) {
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
  } else {
    // Default: Network-First
    event.respondWith(networkFirst(event.request, CACHE_NAME));
  }
});

// ─── URL Classification ──────────────────────────────────────────────

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/i.test(url.pathname);
}

function isAPIRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/search') ||
    url.pathname.includes('/ingest') ||
    url.pathname.includes('/health')
  );
}

function isCDNResource(url) {
  return (
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  );
}

// ─── Caching Strategies ──────────────────────────────────────────────

/**
 * Cache-First: serve from cache, fall back to network.
 * Best for immutable static assets.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-First: try network, fall back to cache.
 * Best for API responses and dynamic content.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/**
 * Stale-While-Revalidate: serve from cache immediately,
 * update cache in the background.
 * Best for CDN resources that update occasionally.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ─── Background Sync ─────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_MUTATIONS' });
  }
}

// ─── Push Notifications (future) ─────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Aura Symphony', {
      body: data.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.url,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data;
  if (url) {
    event.waitUntil(self.clients.openWindow(url));
  }
});