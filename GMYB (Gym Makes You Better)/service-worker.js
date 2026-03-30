// Service Worker für GMYB - Gym Makes You Better PWA
const CACHE_NAME = 'gmyb-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/Login.html',
  '/Profil.html',
  '/Heutiges-Workout.html',
  '/Trainingsplan.html',
  '/Tips.html',
  '/Historie.html',
  '/lib/style.css',
  '/lib/script.js'
];

// Installation und Caching
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache.map(url => {
          // Versuche normale URL, fallback auf '/index.html'
          return url;
        })).catch(err => {
          console.log('Fehler beim Caching:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivierung
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Alter Cache gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Network first, then cache
self.addEventListener('fetch', event => {
  // Nur GET requests behandeln
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Nur successful responses cachen
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone die response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Offline fallback: Cache verwenden
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Fallback für Navigation
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            // Fallback für andere
            return new Response('Offline - Seite nicht verfügbar', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background Sync (optional für Zukunft)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(
      // Hier können Sie Workouts synchronisieren
      Promise.resolve()
    );
  }
});
