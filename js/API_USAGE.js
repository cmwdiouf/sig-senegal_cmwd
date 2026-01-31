/**
 * API DE GÉOLOCALISATION - Guide d'utilisation
 * Exemples et documentation pour les développeurs
 */

// ============================================================================
// 1. INITIALISATION DE BASE
// ============================================================================

// Au chargement du DOM, le module se crée automatiquement
// Initialiser avec la carte Leaflet:

const geoApi = GEOLOCATION_MODULE.init(map, {
  highAccuracy: true,
  showAccuracyCircle: true,
  showTrail: true,
  trailColor: '#10b981'
});

// ============================================================================
// 2. LOCALISATION SIMPLE (UNE FOIS)
// ============================================================================

// Obtenir la position actuelle
async function getMyLocation() {
  try {
    // Demander la permission d'abord
    await GEOLOCATION_MODULE.requestLocationPermission();
    
    // Récupérer une seule position
    geoApi.startTracking();
    
    setTimeout(() => {
      const location = geoApi.getCurrentLocation();
      
      if (location) {
        console.log('Position:', {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy + ' mètres',
          altitude: location.altitude + ' mètres'
        });
        
        // Centrer la carte
        map.setView([location.latitude, location.longitude], 15);
      }
      
      // Arrêter après récupération
      geoApi.stopTracking();
    }, 2000);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// 3. SUIVI EN TEMPS RÉEL
// ============================================================================

// Démarrer le suivi continu
function startRealTimeTracking() {
  geoApi.startTracking();
  
  // Mettre à jour l'interface toutes les secondes
  window.trackingInterval = setInterval(() => {
    const location = geoApi.getCurrentLocation();
    
    if (location) {
      console.log('Position mise à jour:', {
        lat: location.latitude.toFixed(6),
        lon: location.longitude.toFixed(6),
        temps: location.timestamp
      });
      
      // Faire quelque chose avec la position...
    }
  }, 1000);
}

// Arrêter le suivi
function stopRealTimeTracking() {
  geoApi.stopTracking();
  clearInterval(window.trackingInterval);
}

// ============================================================================
// 4. ACCÉDER À L'HISTORIQUE
// ============================================================================

// Récupérer tous les points enregistrés
function viewTrackingHistory() {
  const history = geoApi.getLocationHistory();
  
  console.log(`Nombre de points: ${history.length}`);
  
  history.forEach((loc, idx) => {
    console.log(`${idx}: (${loc.latitude}, ${loc.longitude}) - ${loc.timestamp}`);
  });
  
  return history;
}

// Compter les positions
function getHistoryStats() {
  const history = geoApi.getLocationHistory();
  
  const stats = {
    totalPoints: history.length,
    timespan: history.length > 1 ? 
      (new Date(history[history.length-1].timestamp) - new Date(history[0].timestamp)) / 1000 + 's'
      : 'N/A',
    minAccuracy: Math.min(...history.map(h => h.accuracy)),
    maxAccuracy: Math.max(...history.map(h => h.accuracy))
  };
  
  console.log('Statistiques du suivi:', stats);
  return stats;
}

// ============================================================================
// 5. CALCULER LA DISTANCE
// ============================================================================

// Distance entre deux points (Formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Distance totale parcourue
function getTotalDistance() {
  const history = geoApi.getLocationHistory();
  let totalDistance = 0;
  
  for (let i = 1; i < history.length; i++) {
    const dist = calculateDistance(
      history[i-1].latitude, history[i-1].longitude,
      history[i].latitude, history[i].longitude
    );
    totalDistance += dist;
  }
  
  return totalDistance;
}

// Afficher le total
function displayTotalDistance() {
  const distance = getTotalDistance();
  console.log(`Distance totale parcourue: ${distance.toFixed(2)} km`);
}

// ============================================================================
// 6. EXPORTER LES DONNÉES
// ============================================================================

// Exporter en GeoJSON
function exportAsGeoJSON() {
  const data = GEOLOCATION_MODULE.exportData();
  
  const geojson = {
    type: 'FeatureCollection',
    features: data.history.map((loc, idx) => ({
      type: 'Feature',
      properties: {
        index: idx,
        timestamp: loc.timestamp,
        accuracy: loc.accuracy,
        speed: loc.speed,
        altitude: loc.altitude
      },
      geometry: {
        type: 'Point',
        coordinates: [loc.longitude, loc.latitude]
      }
    })),
    metadata: {
      exportDate: new Date().toISOString(),
      totalPoints: data.history.length,
      isTracking: data.isTracking
    }
  };
  
  return geojson;
}

// Télécharger le fichier
function downloadGeoJSON() {
  const geojson = exportAsGeoJSON();
  const blob = new Blob([JSON.stringify(geojson, null, 2)], 
    { type: 'application/json' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trace-${new Date().toISOString().split('T')[0]}.geojson`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Exporter en CSV
function exportAsCSV() {
  const history = geoApi.getLocationHistory();
  
  let csv = 'Index,Latitude,Longitude,Accuracy,Altitude,Speed,Timestamp\n';
  
  history.forEach((loc, idx) => {
    csv += `${idx},"${loc.latitude}","${loc.longitude}",${loc.accuracy},${loc.altitude},${loc.speed},"${loc.timestamp}"\n`;
  });
  
  return csv;
}

// Télécharger CSV
function downloadCSV() {
  const csv = exportAsCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trace-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// ============================================================================
// 7. TRAVAILLER AVEC LE SERVICE WORKER
// ============================================================================

// Synchroniser les données
function syncLocationData() {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    const data = GEOLOCATION_MODULE.exportData();
    
    navigator.serviceWorker.controller.postMessage({
      type: 'STORE_LOCATION',
      payload: data
    });
    
    console.log('Données synchronisées avec le Service Worker');
  }
}

// Vider le cache
async function clearPWACache() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('Cache vidé');
}

// Obtenir le statut PWA
function getPWAStatus() {
  return PWA_MODULE.getStatus();
}

// ============================================================================
// 8. GÉRER LES PERMISSIONS
// ============================================================================

// Demander les permissions
async function requestAllPermissions() {
  try {
    const locationPerm = await GEOLOCATION_MODULE.requestLocationPermission();
    console.log('Permission de localisation:', locationPerm ? 'Accordée' : 'Refusée');
    
    const notificationPerm = await GEOLOCATION_MODULE.requestNotificationPermission();
    console.log('Permission de notifications:', notificationPerm ? 'Accordée' : 'Refusée');
    
  } catch (error) {
    console.error('Erreur de permission:', error);
  }
}

// ============================================================================
// 9. FAIRE DES FILTRES AVANCÉS
// ============================================================================

// Filtrer par précision
function getPointsWithHighAccuracy(maxAccuracy = 20) {
  const history = geoApi.getLocationHistory();
  return history.filter(loc => loc.accuracy <= maxAccuracy);
}

// Filtrer par heure
function getPointsInTimeRange(startTime, endTime) {
  const history = geoApi.getLocationHistory();
  
  return history.filter(loc => {
    const time = new Date(loc.timestamp);
    return time >= startTime && time <= endTime;
  });
}

// Filtrer par zone géographique
function getPointsInBounds(lat1, lon1, lat2, lon2) {
  const history = geoApi.getLocationHistory();
  
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  const minLon = Math.min(lon1, lon2);
  const maxLon = Math.max(lon1, lon2);
  
  return history.filter(loc =>
    loc.latitude >= minLat && loc.latitude <= maxLat &&
    loc.longitude >= minLon && loc.longitude <= maxLon
  );
}

// ============================================================================
// 10. INTÉGRATION AVEC LA CARTE
// ============================================================================

// Afficher toute la trace sur la carte
function displayTraceOnMap() {
  const history = geoApi.getLocationHistory();
  
  if (history.length < 2) {
    console.warn('Pas assez de points pour afficher une trace');
    return;
  }
  
  // Créer une polyline
  const points = history.map(loc => L.latLng(loc.latitude, loc.longitude));
  const polyline = L.polyline(points, {
    color: '#10b981',
    weight: 3,
    opacity: 0.8
  }).addTo(map);
  
  // Fit map to bounds
  map.fitBounds(polyline.getBounds());
}

// Créer des heatmaps
function createHeatmapFromTrack() {
  const history = geoApi.getLocationHistory();
  
  // Nécessite leaflet-heat.js
  if (!L.heatLayer) {
    console.error('Leaflet Heat non chargé');
    return;
  }
  
  const points = history.map(loc => [
    loc.latitude,
    loc.longitude,
    1 // intensité
  ]);
  
  const heatmap = L.heatLayer(points, {
    radius: 25,
    blur: 15,
    maxZoom: 17
  }).addTo(map);
  
  return heatmap;
}

// ============================================================================
// EXEMPLES D'UTILISATION COMPLÈTE
// ============================================================================

/*
// Exemple 1: Suivre un itinéraire de livraison
async function trackDelivery() {
  const geoApi = GEOLOCATION_MODULE.init(map);
  
  // Démarrer le suivi
  geoApi.startTracking();
  
  // Attendre la fin (bouton stop appelé manuellement)
  // Puis exporter
  setTimeout(() => {
    downloadGeoJSON();
    geoApi.stopTracking();
  }, 60000); // 1 minute
}

// Exemple 2: Analyser un trajet
async function analyzeJourney() {
  const history = geoApi.getLocationHistory();
  
  console.log({
    duration: new Date(history[history.length-1].timestamp) - new Date(history[0].timestamp),
    distance: getTotalDistance(),
    points: history.length,
    avgAccuracy: history.reduce((a, b) => a + b.accuracy, 0) / history.length
  });
}

// Exemple 3: Notifier quand on quitte une zone
function monitorGeofence(lat, lon, radius) {
  const initialDistance = calculateDistance(
    lat, lon,
    geoApi.getCurrentLocation().latitude,
    geoApi.getCurrentLocation().longitude
  );
  
  const checkInterval = setInterval(() => {
    const current = geoApi.getCurrentLocation();
    const distance = calculateDistance(lat, lon, current.latitude, current.longitude);
    
    if (distance > radius && initialDistance <= radius) {
      console.log('Vous avez quitté la zone définie');
      clearInterval(checkInterval);
    }
  }, 5000);
}
*/
