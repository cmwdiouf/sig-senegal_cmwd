/**
 * Module de Géolocalisation pour SIG Sénégal - VERSION CORRIGÉE
 * Fournit les fonctionnalités de localisation GPS et de suivi en temps réel
 */

const GEOLOCATION_MODULE = (() => {
  // ==================== ÉTAT INTERNE ====================
  const geoState = {
    isTracking: false,
    watchId: null,
    currentLocation: null,
    accuracy: null,
    locationHistory: [],
    markers: {
      current: null,
      accuracy: null,
      trail: null
    }
  };

  let mapReference = null;

  // Configuration par défaut
  const config = {
    highAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
    updateInterval: 5000,
    showAccuracyCircle: true,
    showTrail: true,
    trailColor: '#10b981',
    trailWeight: 2,
    trailOpacity: 0.7,
    currentMarkerColor: '#1e293b',
    maxHistorySize: 50
  };

  // ==================== FONCTIONS INTERNES ====================

  /**
   * Crée une icône SVG personnalisée pour la position actuelle
   */
  function createLocationIcon() {
    return L.divIcon({
      html: `
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="white" stroke="${config.currentMarkerColor}" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="${config.currentMarkerColor}"/>
          <circle cx="16" cy="16" r="3" fill="white"/>
          <path d="M16 2 A14 14 0 0 1 28 16" fill="none" stroke="${config.currentMarkerColor}" stroke-width="1.5" opacity="0.3" stroke-dasharray="3,2"/>
        </svg>
      `,
      iconSize: [32, 32],
      className: 'location-icon',
      popupAnchor: [0, -16]
    });
  }

  /**
   * Extrait les données de localisation d'un objet position
   */
  function extractLocationData(position) {
    const { coords, timestamp } = position;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude || null,
      altitudeAccuracy: coords.altitudeAccuracy || null,
      heading: coords.heading || null,
      speed: coords.speed || null,
      timestamp: new Date(timestamp).toISOString(),
      isOnline: navigator.onLine
    };
  }

  /**
   * Met à jour l'historique avec une nouvelle position
   */
  function addToHistory(location) {
    geoState.locationHistory.push(location);
    
    if (geoState.locationHistory.length > config.maxHistorySize) {
      geoState.locationHistory.shift();
    }

    // Synchroniser avec le service worker
    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.controller?.postMessage({
          type: 'STORE_LOCATION',
          payload: location
        });
      } catch (e) {
        console.warn('[GEOLOCATION] Impossible de synchroniser avec le SW', e);
      }
    }

    console.log('[GEOLOCATION] Position ajoutée à l\'historique:', location);
  }

  /**
   * Met à jour la trace de déplacement
   */
  function updateTrail(map) {
    if (!geoState.markers.trail || geoState.locationHistory.length < 2) {
      return;
    }

    // Nettoyer les anciens polylines
    geoState.markers.trail.clearLayers();

    // Créer la polyline avec la trace
    const points = geoState.locationHistory.map(loc => 
      L.latLng(loc.latitude, loc.longitude)
    );

    const polyline = L.polyline(points, {
      color: config.trailColor,
      weight: config.trailWeight,
      opacity: config.trailOpacity,
      dashArray: '5, 5'
    });

    geoState.markers.trail.addLayer(polyline);

    // Ajouter des petits cercles à intervalles réguliers
    const step = Math.max(1, Math.floor(points.length / 10));
    for (let i = 0; i < points.length; i += step) {
      const marker = L.circleMarker(points[i], {
        radius: 3,
        color: config.trailColor,
        fillColor: config.trailColor,
        fillOpacity: 0.6,
        weight: 1
      });
      geoState.markers.trail.addLayer(marker);
    }

    console.log('[GEOLOCATION] Trace mise à jour avec', points.length, 'points');
  }

  /**
   * Met à jour les marqueurs sur la carte
   */
  function updateMapMarkers(map, location) {
    if (!map) {
      console.warn('[GEOLOCATION] Carte non disponible pour mise à jour');
      return;
    }

    const { latitude, longitude, accuracy } = location;
    const latLng = L.latLng(latitude, longitude);

    // Créer ou mettre à jour le marqueur actuel
    if (!geoState.markers.current) {
      const icon = createLocationIcon();
      geoState.markers.current = L.marker(latLng, { icon, draggable: false })
        .bindPopup(`
          <div class="geoloc-popup">
            <strong>Position actuelle</strong><br>
            Lat: ${latitude.toFixed(6)}<br>
            Lon: ${longitude.toFixed(6)}<br>
            Précision: ${accuracy.toFixed(0)}m
          </div>
        `)
        .addTo(map);
      console.log('[GEOLOCATION] Marqueur créé');
    } else {
      // Mettre à jour la position du marqueur existant
      geoState.markers.current.setLatLng(latLng);
      console.log('[GEOLOCATION] Marqueur mis à jour');
    }

    // Gérer le cercle de précision
    if (config.showAccuracyCircle) {
      if (geoState.markers.accuracy) {
        geoState.markers.accuracy.setLatLng(latLng).setRadius(accuracy);
      } else {
        geoState.markers.accuracy = L.circle(latLng, {
          radius: accuracy,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5'
        }).addTo(map);
        console.log('[GEOLOCATION] Cercle de précision créé');
      }
    }

    // Mettre à jour la trace si le suivi est actif
    if (config.showTrail && geoState.isTracking) {
      updateTrail(map);
    }
  }

  /**
   * Gère les erreurs de géolocalisation
   */
  function handlePositionError(error) {
    let message = 'Erreur de géolocalisation';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Vous avez refusé l\'accès à votre position GPS.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Les services de localisation ne sont pas disponibles.';
        break;
      case error.TIMEOUT:
        message = 'La localisation a expiré. Vérifiez votre connexion GPS.';
        break;
      default:
        message = 'Erreur inconnue: ' + error.message;
    }

    console.error('[GEOLOCATION] Erreur:', message);
    
    // Essayer de notifier l'utilisateur
    if (typeof PWA_MODULE !== 'undefined' && PWA_MODULE.showNotification) {
      PWA_MODULE.showNotification('Géolocalisation', message);
    }
  }

  /**
   * Traite une position réussie
   */
  function handlePositionSuccess(position, map) {
    try {
      const location = extractLocationData(position);
      geoState.currentLocation = location;
      geoState.accuracy = location.accuracy;

      console.log('[GEOLOCATION] Position reçue:', location);

      // Ajouter à l'historique
      addToHistory(location);

      // Mettre à jour la carte
      if (map) {
        updateMapMarkers(map, location);
      }

      // Émettre un événement personnalisé
      window.dispatchEvent(new CustomEvent('geolocation-update', { detail: location }));

    } catch (err) {
      console.error('[GEOLOCATION] Erreur lors du traitement de la position:', err);
    }
  }

  /**
   * Obtient la position actuelle une seule fois
   */
  function getCurrentPositionOnce(map, callback) {
    if (!navigator.geolocation) {
      console.error('[GEOLOCATION] Géolocalisation non disponible');
      if (callback) callback(null);
      return;
    }

    console.log('[GEOLOCATION] Demande de position unique...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = extractLocationData(position);
        geoState.currentLocation = location;
        geoState.accuracy = location.accuracy;
        
        addToHistory(location);
        
        if (map) {
          updateMapMarkers(map, location);
        }
        
        console.log('[GEOLOCATION] Position obtenue:', location);
        
        if (callback) callback(location);
        
        window.dispatchEvent(new CustomEvent('geolocation-update', { detail: location }));
      },
      (error) => {
        handlePositionError(error);
        if (callback) callback(null);
      },
      {
        enableHighAccuracy: config.highAccuracy,
        timeout: config.timeout,
        maximumAge: config.maximumAge
      }
    );
  }

  /**
   * Efface l'historique de position
   */
  function clearHistory() {
    geoState.locationHistory = [];
    if (geoState.markers.trail) {
      geoState.markers.trail.clearLayers();
    }
    console.log('[GEOLOCATION] Historique effacé');
  }

  /**
   * Modifie la configuration
   */
  function setConfig(newConfig) {
    Object.assign(config, newConfig);
    console.log('[GEOLOCATION] Configuration mise à jour:', config);
  }

  /**
   * Demande les permissions de géolocalisation
   */
  function requestLocationPermission() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non disponible'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          console.log('[GEOLOCATION] Permission de géolocalisation accordée');
          resolve();
        },
        (error) => {
          console.error('[GEOLOCATION] Permission de géolocalisation refusée:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Demande les permissions de notification
   */
  function requestNotificationPermission() {
    return new Promise((resolve, reject) => {
      if (!('Notification' in window)) {
        reject(new Error('Notifications non supportées'));
        return;
      }

      if (Notification.permission === 'granted') {
        resolve();
        return;
      }

      if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            resolve();
          } else {
            reject(new Error('Permission refusée'));
          }
        });
      } else {
        reject(new Error('Permission refusée'));
      }
    });
  }

  /**
   * Exporte les données de localisation
   */
  function exportData() {
    return {
      currentLocation: geoState.currentLocation,
      history: [...geoState.locationHistory],
      timestamp: new Date().toISOString(),
      isTracking: geoState.isTracking
    };
  }

  // ==================== API PUBLIQUE ====================

  /**
   * Initialise le module de géolocalisation
   */
  function init(map, options = {}) {
    if (!map) {
      console.error('[GEOLOCATION] Carte non fournie à l\'initialisation');
      return null;
    }

    if (!navigator.geolocation) {
      console.error('[GEOLOCATION] Géolocalisation non disponible dans ce navigateur');
      return null;
    }

    mapReference = map;
    Object.assign(config, options);

    // Créer le groupe de couches pour le suivi
    geoState.markers.trail = L.featureGroup().addTo(map);

    console.log('[GEOLOCATION] Module initialisé avec succès');

    // Retourner l'API publique
    return {
      // Méthodes principales
      startTracking: () => startTracking(mapReference),
      stopTracking: () => stopTracking(),
      getPosition: (callback) => getCurrentPositionOnce(mapReference, callback),
      
      // Getters
      getCurrentLocation: () => geoState.currentLocation,
      getLocationHistory: () => [...geoState.locationHistory],
      getState: () => ({ ...geoState }),
      isTracking: () => geoState.isTracking,
      
      // Configuration
      setConfig: (newConfig) => setConfig(newConfig),
      
      // Utilitaires
      clearHistory: () => clearHistory(),
      exportData: () => exportData(),
      
      // Permissions
      requestLocationPermission: () => requestLocationPermission(),
      requestNotificationPermission: () => requestNotificationPermission(),
      
      // Accès à l'état (pour compatibilité)
      geoState: geoState
    };
  }

  /**
   * Démarre le suivi continu de la position
   */
  function startTracking(map) {
    const targetMap = map || mapReference;
    
    if (!targetMap) {
      console.error('[GEOLOCATION] Aucune carte disponible pour le suivi');
      return null;
    }

    if (geoState.isTracking) {
      console.warn('[GEOLOCATION] Suivi déjà actif');
      return geoState.watchId;
    }

    console.log('[GEOLOCATION] Démarrage du suivi de position...');
    geoState.isTracking = true;

    // Obtenir la position initiale
    getCurrentPositionOnce(targetMap, () => {
      console.log('[GEOLOCATION] Position initiale obtenue');
    });

    // Démarrer le suivi continu
    geoState.watchId = navigator.geolocation.watchPosition(
      (position) => {
        handlePositionSuccess(position, targetMap);
      },
      (error) => {
        handlePositionError(error);
      },
      {
        enableHighAccuracy: config.highAccuracy,
        timeout: config.timeout,
        maximumAge: config.maximumAge
      }
    );

    // Notifier le service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'TRACKING_STARTED',
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[GEOLOCATION] Impossible de notifier le SW', e);
      }
    }

    return geoState.watchId;
  }

  /**
   * Arrête le suivi de la position
   */
  function stopTracking() {
    if (!geoState.isTracking) {
      console.warn('[GEOLOCATION] Aucun suivi actif');
      return;
    }

    if (geoState.watchId !== null) {
      navigator.geolocation.clearWatch(geoState.watchId);
      console.log('[GEOLOCATION] Suivi arrêté (watchId:', geoState.watchId, ')');
    }

    geoState.isTracking = false;
    geoState.watchId = null;

    // Notifier le service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'TRACKING_STOPPED',
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[GEOLOCATION] Impossible de notifier le SW', e);
      }
    }
  }

  // ==================== EXPORT ====================
  return {
    init,
    geoState,
    STATES: {
      IDLE: 'idle',
      LOCATING: 'locating',
      TRACKING: 'tracking',
      ERROR: 'error'
    }
  };
})();

// Enregistrer le module globalement
if (typeof window !== 'undefined') {
  window.GEOLOCATION_MODULE = GEOLOCATION_MODULE;
  console.log('[GEOLOCATION] Module enregistré globalement');
}
