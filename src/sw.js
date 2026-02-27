import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies'

self.skipWaiting()
clientsClaim()

// App shell — auto-injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// Content packs — stale while revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/packs/'),
  new StaleWhileRevalidate({ cacheName: 'content-packs' })
)

// Firebase API — network first
registerRoute(
  ({ url }) => url.hostname.includes('firestore.googleapis.com'),
  new NetworkFirst({ cacheName: 'firebase-api', networkTimeoutSeconds: 3 })
)

// Offline fallback for navigation requests
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/offline.html'))
    )
  }
})
