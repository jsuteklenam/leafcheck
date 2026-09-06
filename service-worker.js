// LeafCheck service worker
// Caches the app shell so the interface loads instantly and works offline.
// Note: actual leaf diagnosis still requires an internet connection, since
// that step calls the Claude API. This only makes the app *open* offline.

const CACHE_NAME = 'leafcheck-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache or intercept calls to the Claude API — those need to hit
  // the network live so diagnosis results are always fresh.
  if (url.hostname === 'api.anthropic.com') {
    return;
  }

  // Cache-first for the app shell, falling back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
