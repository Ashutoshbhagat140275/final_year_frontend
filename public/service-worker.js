/* Simple runtime-caching service worker for the RAG Audio PWA.
 * Strategy:
 *  - navigations: network-first, fall back to cached app shell ("/") when offline
 *  - same-origin GET assets (JS/CSS/images): cache-first, populated on demand
 *  - cross-origin requests (e.g. the backend API): not intercepted -> always network
 */
const CACHE = 'rag-audio-v1'
const SHELL = '/'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([SHELL])).catch(() => {})
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only handle same-origin requests; let the API (cross-origin) hit the network directly.
  if (url.origin !== self.location.origin) return

  // App navigations: network-first so users get fresh HTML, offline falls back to shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(SHELL, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(SHELL))
    )
    return
  }

  // Static assets: cache-first, then fill the cache on a miss.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
          return res
        })
        .catch(() => cached)
    })
  )
})
