/**
 * Service Worker Optimisé v3 pour SIG Sénégal
 * Cache stratégique pour tuiles cartographiques haute performance
 * Offline-first avec sync en arrière-plan
 */

const CACHE_VERSION = 'sig-senegal-v3';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  tiles: `${CACHE_VERSION}-tiles`,
  data: `${CACHE_VERSION}-data`,
  runtime: `${CACHE_VERSION}-runtime`,
  images: `${CACHE_VERSION}-images`
};

const basePath = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1' ? '/' : '/sig-senegal_cmwd/';

// Ressources critiques
const CRITICAL_ASSETS = [
  basePath,
  basePath + 'index.html',
  basePath + 'manifest.json',
  basePath + 'css/leaflet.css',
  basePath + 'css/mobile-pro.css',
  basePath + 'js/leaflet.js',
  basePath + 'js/leaflet.markercluster.js',
  basePath + 'js/geolocation.js',
  basePath + 'js/pwa.js'
];

// Tuiles acceptées (OpenStreetMap, etc.)
const TILE_URLS = [
  /tile\.openstreetmap\.org/,
  /server\.arcgisonline\.com/,
  /tile\.opentopomap\.org/,
  /basemaps\.cartocdn\.com/
];

// === INSTALLATION ===
self.addEventListener('install', (event) => {
  console.log('[SW v3] Installation...');
  event.waitUntil(
    (async () => {
      try {
        // Cache statique
        const staticCache = await caches.open(CACHE_NAMES.static);
        await staticCache.addAll(CRITICAL_ASSETS).catch(err => {
          console.warn('[SW v3] Erreur cache critique:', err);
        });

        // Créer les autres caches
        await caches.open(CACHE_NAMES.tiles);
        await caches.open(CACHE_NAMES.data);
        await caches.open(CACHE_NAMES.runtime);
        await caches.open(CACHE_NAMES.images);

        console.log('[SW v3] Installation complète');
        await self.skipWaiting();
      } catch (err) {
        console.error('[SW v3] Erreur installation:', err);
      }
    })()
  );
});

// === ACTIVATION ===
self.addEventListener('activate', (event) => {
  console.log('[SW v3] Activation...');
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      
      // Nettoyer les anciens caches
      const validCaches = Object.values(CACHE_NAMES);
      await Promise.all(
        cacheNames
          .filter(name => !validCaches.includes(name) && name.startsWith('sig-senegal'))
          .map(name => {
            console.log('[SW v3] Suppression ancien cache:', name);
            return caches.delete(name);
          })
      );

      console.log('[SW v3] Activation complète');
      await self.clients.claim();
    })()
  );
});

// === FETCH STRATEGY ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // 1. TUILES CARTOGRAPHIQUES - Network first, cache fallback
  if (isTileRequest(url)) {
    return event.respondWith(networkFirstTileStrategy(request));
  }

  // 2. DONNÉES GÉOJSON - Cache first, network fallback
  if (isDataRequest(url)) {
    return event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.data));
  }

  // 3. IMAGES - Cache first
  if (isImageRequest(url)) {
    return event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
  }

  // 4. HTML/CSS/JS - Stale while revalidate
  if (isStaticAsset(url)) {
    return event.respondWith(staleWhileRevalidateStrategy(request));
  }

  // 5. Par défaut - Network first
  return event.respondWith(networkFirstStrategy(request));
});

// === STRATÉGIES DE CACHE ===

/**
 * Network First - Essayer réseau d'abord
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    // Mettre en cache si succès
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.runtime);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback cache
    const cached = await caches.match(request);
    return cached || offlineResponse();
  }
}

/**
 * Cache First - Utiliser cache d'abord
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return offlineResponse();
  }
}

/**
 * Network First pour tuiles (avec timeout)
 */
async function networkFirstTileStrategy(request) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(request, {
      signal: controller.signal,
      headers: {
        ...request.headers,
        'Accept': 'image/webp,image/png,image/*;q=0.8'
      }
    });

    clearTimeout(timeout);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.tiles);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Fallback cache pour tuiles
    const cached = await caches.match(request);
    return cached || blankTileResponse();
  }
}

/**
 * Stale While Revalidate - Servir cache, mettre à jour en arrière-plan
 */
async function staleWhileRevalidateStrategy(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAMES.static);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => offlineResponse());

  return cached || fetchPromise;
}

// === HELPERS ===

function isTileRequest(url) {
  return TILE_URLS.some(pattern => pattern.test(url.hostname)) && 
         /\.png|\.jpg|\.webp/.test(url.pathname);
}

function isDataRequest(url) {
  return /\.json|\.geojson/.test(url.pathname) && 
         url.pathname.includes('/data/');
}

function isImageRequest(url) {
  return /\.(png|jpg|webp|svg|gif)$/i.test(url.pathname) &&
         !isTileRequest(url);
}

function isStaticAsset(url) {
  return /\.(js|css)$/i.test(url.pathname) ||
         /index\.html/.test(url.pathname);
}

/**
 * Réponse offline
 */
function offlineResponse() {
  return new Response(
    '<h1>🌐 Hors ligne</h1><p>Vérifiez votre connexion.</p>',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/html; charset=UTF-8'
      })
    }
  );
}

/**
 * Tuile vide (pour les tuiles manquantes)
 */
function blankTileResponse() {
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 256, 256);
  
  return canvas.convertToBlob().then(blob => 
    new Response(blob, {
      headers: { 'Content-Type': 'image/png' }
    })
  );
}

// === MESSAGE HANDLING ===
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_CACHE_SIZE') {
    (async () => {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }

      event.ports[0].postMessage({ size: totalSize });
    })();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    (async () => {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.startsWith('sig-senegal')) {
          await caches.delete(name);
        }
      }
      event.ports[0].postMessage({ cleared: true });
    })();
  }
});

console.log('[SW v3] Service Worker prêt');
