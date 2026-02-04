/**
 * 🧪 SCRIPT DE VALIDATION PWA - SIG Sénégal
 * Lancez dans F12 Console: VALIDATE()
 * Teste: Service Worker, Géolocalisation, Manifest, HTML
 */

window.VALIDATE = async function() {
  console.clear();
  console.log('%c🧪 VALIDATION PWA - SIG Sénégal %c', 'background:#1e293b; color:white; padding:10px; border-radius:4px; font-weight:bold', '');
  console.log('═══════════════════════════════════════════════\n');

  // 1. MODULES JAVASCRIPT
  console.log('%c📦 MODULES JAVASCRIPT%c', 'color:#10b981; font-weight:bold', '');
  console.log(`  ${typeof PWA_MODULE !== 'undefined' ? '✅' : '❌'} PWA_MODULE (pwa.js)`);
  console.log(`  ${typeof GEOLOCATION_MODULE !== 'undefined' ? '✅' : '❌'} GEOLOCATION_MODULE (geolocation.js)`);
  console.log(`  ${typeof L !== 'undefined' ? '✅' : '❌'} Leaflet L (leaflet.js)`);

  // 2. CAPABILITIES
  console.log('\n%c🔧 CAPACITÉS NAVIGATEUR%c', 'color:#10b981; font-weight:bold', '');
  console.log(`  ${navigator.serviceWorker ? '✅' : '❌'} Service Worker API`);
  console.log(`  ${navigator.geolocation ? '✅' : '❌'} Geolocation API`);
  console.log(`  ${navigator.onLine ? '✅' : '⚠️'} Connectivité (actuellement: ${navigator.onLine ? 'online' : 'offline'})`);
  console.log(`  ${location.protocol === 'https:' ? '✅' : '⚠️'} HTTPS (${location.protocol})`);

  // 3. MANIFEST.JSON
  console.log('\n%c📱 MANIFEST & META TAGS%c', 'color:#10b981; font-weight:bold', '');
  const manifest = document.querySelector('link[rel="manifest"]');
  console.log(`  ${manifest ? '✅' : '❌'} Manifest link présent`);
  if (manifest) {
    try {
      const manifestResponse = await fetch(manifest.href);
      const manifestData = await manifestResponse.json();
      console.log(`     • name: "${manifestData.name}"`);
      console.log(`     • display: "${manifestData.display}"`);
      console.log(`     • scope: "${manifestData.scope}"`);
      console.log(`     • icons: ${manifestData.icons ? manifestData.icons.length : 0} icons`);
    } catch (e) {
      console.warn(`     ⚠️ Erreur lecture manifest: ${e.message}`);
    }
  }

  // 4. SERVICE WORKER
  console.log('\n%c🔄 SERVICE WORKER%c', 'color:#10b981; font-weight:bold', '');
  if (navigator.serviceWorker) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        registrations.forEach((reg, i) => {
          console.log(`  ✅ Enregistrement ${i + 1}:`);
          console.log(`     • scope: ${reg.scope}`);
          console.log(`     • status: ${reg.active ? 'active ✅' : 'inactive'}`);
          console.log(`     • worker: ${reg.active ? 'v' + (reg.active.scriptURL.includes('sw-v2') ? '2' : '1') : 'N/A'}`);
          console.log(`     • controller: ${navigator.serviceWorker.controller ? '✅ Contrôle la page' : '❌ Ne contrôle pas'}`);
        });
      } else {
        console.log('  ❌ Aucun Service Worker enregistré');
        console.log('     Attendre quelques secondes et réessayer');
      }
    } catch (e) {
      console.error(`  ❌ Erreur: ${e.message}`);
    }
  } else {
    console.log('  ❌ Service Worker API non disponible');
  }

  // 5. CACHE STORAGE
  console.log('\n%c💾 CACHE STORAGE%c', 'color:#10b981; font-weight:bold', '');
  try {
    const cacheNames = await caches.keys();
    if (cacheNames.length > 0) {
      console.log(`  ✅ ${cacheNames.length} cache(s) trouvé(s):`);
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        console.log(`     • ${name}: ${requests.length} items`);
      }
    } else {
      console.log('  ⚠️ Aucun cache trouvé (normal si première visite)');
    }
  } catch (e) {
    console.warn(`  ⚠️ Cache Storage: ${e.message}`);
  }

  // 6. ÉLÉMENTS HTML GÉOLOCALISATION
  console.log('\n%c📍 ÉLÉMENTS HTML GÉOLOCALISATION%c', 'color:#10b981; font-weight:bold', '');
  const geoElements = {
    'btn-locate-once': 'Bouton localiser',
    'btn-locate-track': 'Bouton suivi',
    'btn-locate-stop': 'Bouton arrêt',
    'location-info': 'Div info position',
    'loc-latitude': 'Latitude',
    'loc-longitude': 'Longitude',
    'loc-accuracy': 'Précision',
    'loc-altitude': 'Altitude',
    'loc-speed': 'Vitesse',
  };
  Object.entries(geoElements).forEach(([id, desc]) => {
    const el = document.getElementById(id);
    const status = el ? '✅' : '❌';
    console.log(`  ${status} #${id} (${desc})`);
  });

  // 7. STATUT APPLICATION
  console.log('\n%c⚙️ STATUT APPLICATION%c', 'color:#10b981; font-weight:bold', '');
  if (typeof PWA_MODULE !== 'undefined') {
    console.log('  ✅ PWA_MODULE.init() appelé');
  }
  if (typeof GEOLOCATION_MODULE !== 'undefined' && GEOLOCATION_MODULE.getState) {
    const state = GEOLOCATION_MODULE.getState();
    console.log('  ✅ GEOLOCATION_MODULE.init() appelé');
    if (state) {
      console.log(`     • Suivi actif: ${state.isTracking ? '✅' : '❌'}`);
      console.log(`     • Position actuelle: ${state.currentLocation ? '✅' : '❌'}`);
      console.log(`     • Historique: ${state.locationHistory ? state.locationHistory.length : 0} positions`);
    }
  }

  // 8. RÉSUMÉ
  console.log('\n%c═══════════════════════════════════════════════%c', 'color:#10b981', '');
  console.log('%c✅ VALIDATION TERMINÉE!%c', 'background:#10b981; color:white; padding:8px; border-radius:4px; font-weight:bold', '');
  console.log('\n%c💡 PROCHAINES ÉTAPES:%c', 'color:#e67e22; font-weight:bold', '');
  console.log('  1. Cliquez "Localiser ma position"');
  console.log('  2. Autorisez l\'accès GPS');
  console.log('  3. Vérifiez que la position s\'affiche');
  console.log('  4. Testez le suivi en temps réel');
  console.log('  5. Testez le mode offline (F12 > Network > Offline)');
  console.log('');
};

// Auto-message au chargement
console.log('%c🚀 SIG Sénégal PWA%c Validez avec: VALIDATE()', 'background:#1e293b; color:#10b981; padding:5px 10px; border-radius:3px; font-weight:bold', '');
