const CACHE_NAME = 'tetralink-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo_suk.jpg',
  './TETRALINK_LOGO-removebg-preview.png'
];

// Installation — mise en cache des ressources statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('TetraLink SW: mise en cache initiale');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — stratégie Network First (Firebase temps réel), Cache en fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase et EmailJS — toujours réseau (pas de cache)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('emailjs') ||
    url.hostname.includes('jsdelivr')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Ressources locales — Network First avec fallback cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache la nouvelle version
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Offline — servir depuis le cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback sur index.html si rien en cache
          return caches.match('./index.html');
        });
      })
  );
});
