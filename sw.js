// Service Worker pour PWA SIG Sénégal
const CACHE_NAME = 'sig-senegal-v1';
const RUNTIME_CACHE = 'sig-senegal-runtime';
const GEOLOCATION_CACHE = 'sig-senegal-locations';

// Liste des ressources critiques à mettre en cache
const CRITICAL_URLS = [
  './',
  './index.html',
  './css/qgis2web.css',
  './js/labels.js',
  './js/Autolinker.min.js',
  './js/leaflet.js',
  './js/leaflet.markercluster.js',
  './data/Arrondissement_3.js',
  './data/Departement_2.js',
  './data/localites_5.js',
  './data/Region_1.js',
  './data/Routes_4.js'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache créé:', CACHE_NAME);
        // Cache des ressources critiques
        return cache.addAll(CRITICAL_URLS).catch(err => {
          console.warn('[SW] Erreur lors du cache des ressources critiques:', err);
          // Continuer même si certaines ressources ne sont pas disponibles
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== GEOLOCATION_CACHE)
            .map((cacheName) => {
              console.log('[SW] Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Stratégie de récupération (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes externes au domaine local
  if (url.origin !== self.location.origin) {
    // Pour les ressources externes (CDN), utiliser network-first
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // Pour les fichiers HTML, CSS, JS: cache-first avec fallback réseau
  if (request.destination === 'document' || 
      request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Pour les données GeoJSON: cache-first avec update en arrière-plan
  if (request.url.includes('/data/')) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Pour les images et autres ressources: cache-first
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE, 'image/*'));
    return;
  }

  // Pour les autres requêtes: network-first
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

// Stratégie Cache First
function cacheFirst(request, cacheName, fallbackContentType = null) {
  return caches.match(request)
    .then((response) => {
      if (response) {
        console.log('[SW] Cache hit:', request.url);
        return response;
      }

      return fetch(request)
        .then((response) => {
          // Ne mettre en cache que les réponses valides
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(cacheName)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return response;
        })
        .catch((err) => {
          console.error('[SW] Erreur fetch:', request.url, err);
          // Essayer de retourner une réponse en cache comme fallback
          return caches.match(request)
            .then((response) => {
              if (response) return response;
              
              // Retourner une page offline pour les documents
              if (request.destination === 'document') {
                return caches.match('./index.html');
              }
              
              return new Response('Ressource non disponible', { status: 503 });
            });
        });
    });
}

// Stratégie Network First
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }

      const responseToCache = response.clone();
      caches.open(cacheName)
        .then((cache) => {
          cache.put(request, responseToCache);
        });

      return response;
    })
    .catch((err) => {
      console.log('[SW] Fallback au cache:', request.url);
      return caches.match(request)
        .then((response) => {
          if (response) return response;
          return new Response('Ressource non disponible (mode hors ligne)', { status: 503 });
        });
    });
}

// Stratégie Stale While Revalidate
function staleWhileRevalidate(request, cacheName) {
  return caches.match(request)
    .then((response) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(cacheName)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return networkResponse;
        })
        .catch(() => {
          // En cas d'erreur réseau, retourner la réponse en cache
          return response || new Response('Ressource non disponible', { status: 503 });
        });

      return response || fetchPromise;
    });
}

// Gestion des messages depuis le client
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE)
      .then(() => console.log('[SW] Cache nettoyé'));
  }

  if (event.data && event.data.type === 'STORE_LOCATION') {
    // Stocker les données de géolocalisation en cache
    caches.open(GEOLOCATION_CACHE)
      .then((cache) => {
        const response = new Response(JSON.stringify(event.data.payload), {
          headers: { 'Content-Type': 'application/json' }
        });
        cache.put(new Request('./current-location'), response);
      });
  }
});

// Synchronisation en arrière-plan pour la géolocalisation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

function syncLocation() {
  return caches.open(GEOLOCATION_CACHE)
    .then((cache) => {
      return cache.match('./current-location')
        .then((response) => {
          if (!response) return Promise.resolve();
          
          return response.json()
            .then((data) => {
              // Envoyer la location au serveur si nécessaire
              console.log('[SW] Sync location:', data);
              return Promise.resolve();
            });
        });
    });
}

// Gestion des notifications push (optionnel)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22><rect fill=%22%231e293b%22 width=%22192%22 height=%22192%22/><text x=%2296%22 y=%22128%22 font-size=%2296%22 font-weight=%22bold%22 text-anchor=%22middle%22 fill=%22%2310b981%22 font-family=%22Arial%22>S</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22><rect fill=%221e293b%22 width=%2296%22 height=%2296%22/><path d=%22M48 20 C35 20 25 30 25 48 C25 68 48 85 48 85 C48 85 71 68 71 48 C71 30 61 20 48 20 Z%22 fill=%2210b981%22/></svg>',
    tag: data.tag || 'sig-notification',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SIG Sénégal', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});

console.log('[SW] Service Worker chargé');
