const CACHE_NAME = 'swarmag-app-style-guide-shell-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.png']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)
  if (requestUrl.origin !== self.location.origin) return

  event.respondWith((async () => {
    const cached = await caches.match(event.request)
    if (cached) return cached

    try {
      const response = await fetch(event.request)
      const cache = await caches.open(CACHE_NAME)
      if (response.ok && requestUrl.pathname.startsWith('/assets/')) {
        cache.put(event.request, response.clone())
      }
      return response
    } catch {
      const accept = event.request.headers.get('accept') ?? ''
      if (accept.includes('text/html')) {
        const fallback = await caches.match('/index.html')
        if (fallback) return fallback
      }
      throw new Error('Network request failed and no fallback is available')
    }
  })())
})
