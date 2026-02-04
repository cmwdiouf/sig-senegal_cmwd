/**
 * Service Worker optimisé pour PWA SIG Sénégal
 * Gestion intelligente du cache pour les tuiles cartographiques
 * Compatible GitHub Pages HTTPS
 */

const CACHE_VERSION = 'sig-senegal-v2';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  tiles: `${CACHE_VERSION}-tiles`,
  data: `${CACHE_VERSION}-data`,
  runtime: `${CACHE_VERSION}-runtime`
};

// Déterminer le chemin de base (localhost ou GitHub Pages)
const basePath = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1' ? '/' : '/sig-senegal_cmwd/';

// Ressources statiques critiques (adapté au contexte)
const CRITICAL_ASSETS = [
  basePath,
  basePath + 'index.html',
  basePath + 'manifest.json',
  basePath + 'css/leaflet.css',
  basePath + 'js/leaflet.js',
  basePath + 'js/leaflet.markercluster.js',
  basePath + 'js/geolocation.js',
  basePath + 'js/pwa.js'
];

// === INSTALLATION ===
self.addEventListener('install', (event) => {
  console.log('[SW] Installation v2...');
  event.waitUntil(
    (async () => {
      try {
        // Créer le cache statique
        const staticCache = await caches.open(CACHE_NAMES.static);
        await staticCache.addAll(CRITICAL_ASSETS).catch(err => {
          console.warn('[SW] Quelques ressources critiques manquent:', err);
        });

        // Créer les autres caches
        await caches.open(CACHE_NAMES.tiles);
        await caches.open(CACHE_NAMES.data);
        await caches.open(CACHE_NAMES.runtime);

        console.log('[SW] Installation complétée');
        await self.skipWaiting();
      } catch (err) {
        console.error('[SW] Erreur installation:', err);
      }
    })()
  );
});

// === ACTIVATION ===
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    (async () => {
      // Supprimer les anciens caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => !Object.values(CACHE_NAMES).includes(name));
      
      await Promise.all(oldCaches.map(name => {
        console.log('[SW] Suppression cache:', name);
        return caches.delete(name);
      }));

      await self.clients.claim();
      console.log('[SW] Activation complétée');
    })()
  );
});

// === FETCH HANDLER ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // === TUILES CARTOGRAPHIQUES (OSM, Mapbox, etc.) ===
  if (isTileUrl(url)) {
    // Stratégie: Cache first, avec update en arrière-plan
    event.respondWith(
      cacheFirst(request, CACHE_NAMES.tiles)
        .then(response => response || networkFetch(request))
        .catch(() => offlineTilePlaceholder())
    );
    return;
  }

  // === RESSOURCES LOCALES (CSS, JS, HTML, images) ===
  if (isLocalResource(url)) {
    event.respondWith(
      cacheFirst(request, CACHE_NAMES.static)
        .catch(() => networkFetch(request))
    );
    return;
  }

  // === DONNÉES GÉOJSON (data/*.js) ===
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      staleWhileRevalidate(request, CACHE_NAMES.data)
    );
    return;
  }

  // === REQUÊTES EXTERNES (CDN, API) ===
  event.respondWith(
    networkFirst(request, CACHE_NAMES.runtime)
  );
});

// === STRATÉGIES DE CACHE ===

/**
 * Cache First: Vérifier le cache d'abord, puis le réseau
 * Idéal pour: Ressources statiques, assets, tuiles
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  return networkFetch(request).then(response => {
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  });
}

/**
 * Network First: Réseau d'abord, puis le cache
 * Idéal pour: Requêtes API, données dynamiques
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await networkFetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.log('[SW] Réseau échoué, utilisation du cache');
    return caches.match(request);
  }
}

/**
 * Stale While Revalidate: Retourner le cache immédiatement, 
 * mettre à jour en arrière-plan
 * Idéal pour: Données qui changent rarement
 */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = networkFetch(request).then(response => {
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

/**
 * Fetch réseau avec gestion d'erreur
 */
async function networkFetch(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (err) {
    console.error('[SW] Erreur fetch:', request.url, err);
    return null;
  }
}

/**
 * Tuile placeholder pour l'offline
 */
function offlineTilePlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <rect fill="#e5e7eb" width="256" height="256"/>
    <text x="128" y="128" font-size="16" text-anchor="middle" fill="#9ca3af" dy=".3em">
      Hors ligne
    </text>
  </svg>`;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// === UTILITAIRES ===

/**
 * Vérifier si c'est une tuile cartographique
 */
function isTileUrl(url) {
  // OpenStreetMap
  if (url.hostname.includes('tile.openstreetmap.org')) return true;
  if (url.hostname.includes('opentopomap.org')) return true;
  
  // ArcGIS
  if (url.hostname.includes('arcgisonline.com')) return true;
  
  // CartoDB
  if (url.hostname.includes('basemaps.cartocdn.com')) return true;
  
  // Mapbox
  if (url.hostname.includes('api.mapbox.com')) return true;
  if (url.hostname.includes('tiles.mapbox.com')) return true;
  
  // Patterns génériques pour les tuiles
  if (url.pathname.match(/\/\d+\/\d+\/\d+\.(png|jpg|jpeg|webp)$/i)) {
    return true;
  }
  
  return false;
}

/**
 * Vérifier si c'est une ressource locale
 */
function isLocalResource(url) {
  // Même domaine
  if (url.origin !== self.location.origin) {
    return false;
  }
  
  const pathname = url.pathname;
  
  // Fichiers à cacher
  return pathname.endsWith('.html') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.json') ||
         pathname.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i) ||
         pathname.endsWith('/');
}

// === MESSAGES DEPUIS LE CLIENT ===

self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }

  if (event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ size });
    });
  }
});

/**
 * Vider tous les caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] Tous les caches vidés');
}

/**
 * Obtenir la taille totale du cache
 */
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// === BACKGROUND SYNC ===

/**
 * Synchronisation en arrière-plan pour les données
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    event.waitUntil(syncLocationData());
  }
});

async function syncLocationData() {
  console.log('[SW] Synchronisation des données...');
  // Implémentation future pour synchronisation avec serveur
  return Promise.resolve();
}

// === PUSH NOTIFICATIONS ===

self.addEventListener('push', (event) => {
  console.log('[SW] Notification push reçue');
  
  const options = {
    body: event.data?.text?.() || 'Nouvelle notification',
    icon: '/sig-senegal_cmwd/data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22><rect fill=%22%231e293b%22 width=%2296%22 height=%2296%22/><circle cx=%2248%22 cy=%2248%22 r=%2230%22 fill=%22%2310b981%22/></svg>',
    badge: '/sig-senegal_cmwd/data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22><circle cx=%2248%22 cy=%2248%22 r=%2248%22 fill=%22%2310b981%22/></svg>',
    tag: 'sig-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('SIG Sénégal', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Focus la fenêtre si déjà ouverte
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.includes('/sig-senegal_cmwd/')) {
          return windowClients[i].focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      return clients.openWindow('/sig-senegal_cmwd/');
    })
  );
});

console.log('[SW] Service Worker v2 chargé');
