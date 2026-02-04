/**
 * Module de Géolocalisation pour SIG Sénégal
 * Fournit les fonctionnalités de localisation GPS et de suivi en temps réel
 */

const GEOLOCATION_MODULE = (() => {
  // État interne
  let geoState = {
    isTracking: false,
    watchId: null,
    currentLocation: null,
    accuracy: null,
    locationHistory: [],
    maxHistorySize: 50,
    markers: {
      current: null,
      accuracy: null,
      trail: null
    }
  };

  // Référence à la carte
  let mapReference = null;

  // Configuration
  const config = {
    highAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
    updateInterval: 5000, // Intervalle de mise à jour en ms
    showAccuracyCircle: true,
    showTrail: true,
    trailColor: '#10b981',
    trailWeight: 2,
    trailOpacity: 0.7,
    currentMarkerColor: '#1e293b'
  };

  /**
   * Initialise le module de géolocalisation
   * @param {Object} map - Instance de la carte Leaflet
   * @param {Object} options - Options de configuration
   */
  function init(map, options = {}) {
    if (!map) {
      console.error('[GEOLOCATION] Map non initialisée');
      return null;
    }

    // Stocker la référence à la carte
    mapReference = map;

    // Fusionner avec les options
    Object.assign(config, options);

    // Créer le groupe de couches pour le suivi
    geoState.markers.trail = L.featureGroup().addTo(map);

    // Vérifier la disponibilité de la géolocalisation
    if (!navigator.geolocation) {
      console.error('[GEOLOCATION] Géolocalisation non disponible dans ce navigateur');
      return null;
    }

    console.log('[GEOLOCATION] Module initialisé');
    return {
      startTracking: () => startTracking(mapReference),
      stopTracking: stopTracking,
      getLocation: (callback) => getLocation(mapReference, callback),
      getCurrentLocation: () => geoState.currentLocation,
      getLocationHistory: () => [...geoState.locationHistory],
      clearHistory: clearHistory,
      setConfig: setConfig,
      getState: () => ({ ...geoState })
    };
  }

  /**
   * Démarre le suivi de la position en temps réel
   */
  function startTracking(map) {
    // Utiliser la mapReference si aucune carte n'est passée en paramètre
    const targetMap = map || mapReference;
    
    if (!targetMap) {
      console.error('[GEOLOCATION] Aucune carte disponible pour le suivi');
      return null;
    }

    if (geoState.isTracking) {
      console.warn('[GEOLOCATION] Suivi déjà actif');
      return geoState.watchId;
    }

    console.log('[GEOLOCATION] Démarrage du suivi...');
    geoState.isTracking = true;

    // Première localisation
    getLocation(targetMap, (location) => {
      if (location) {
        console.log('[GEOLOCATION] Position initiale:', location);
      }
    });

    // Suivi continu
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

    // Notifier les clients (pour PWA)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRACKING_STARTED',
        timestamp: new Date().toISOString()
      });
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
      console.log('[GEOLOCATION] Suivi arrêté');
    }

    geoState.isTracking = false;
    geoState.watchId = null;

    // Notifier les clients
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRACKING_STOPPED',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtient une seule position
   */
  function getLocation(map, callback) {
    // Utiliser la mapReference si aucune carte n'est passée en paramètre
    const targetMap = map || mapReference;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = extractLocationData(position);
        geoState.currentLocation = location;
        
        // Ajouter à l'historique
        addToHistory(location);

        // Mettre à jour la carte
        if (targetMap) {
          updateMapMarkers(targetMap, location);
        }

        // Callback
        if (callback) callback(location);

        // Envoyer au service worker
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'STORE_LOCATION',
            payload: location
          });
        }

        console.log('[GEOLOCATION] Position obtenue:', location);
      },
      (error) => {
        const message = handlePositionError(error);
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
   * Gère le succès de la position
   */
  function handlePositionSuccess(position, map) {
    const location = extractLocationData(position);
    geoState.currentLocation = location;
    geoState.accuracy = position.coords.accuracy;

    // Ajouter à l'historique
    addToHistory(location);

    // Mettre à jour la carte
    updateMapMarkers(map, location);

    console.log('[GEOLOCATION] Position mise à jour:', location);
  }

  /**
   * Gère les erreurs de position
   */
  function handlePositionError(error) {
    const errorMessages = {
      1: 'Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position dans les paramètres.',
      2: 'Position indisponible. Veuillez réessayer.',
      3: 'Délai d\'attente dépassé. Vérifiez votre connexion GPS.'
    };

    const message = errorMessages[error.code] || 'Erreur de géolocalisation: ' + error.message;
    console.error('[GEOLOCATION] Erreur:', message, error);

    // Afficher une notification
    if (Notification.permission === 'granted') {
      new Notification('Erreur de géolocalisation', {
        body: message,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22><rect fill=%22%231e293b%22 width=%2296%22 height=%2296%22/><path d=%22M48 20 C35 20 25 30 25 48 C25 68 48 85 48 85 C48 85 71 68 71 48 C71 30 61 20 48 20 Z%22 fill=%22%2310b981%22/></svg>'
      });
    }

    return message;
  }

  /**
   * Extrait les données de position
   */
  function extractLocationData(position) {
    const { coords, timestamp } = position;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp: new Date(timestamp).toISOString(),
      isOnline: navigator.onLine
    };
  }

  /**
   * Ajoute une location à l'historique
   */
  function addToHistory(location) {
    geoState.locationHistory.push(location);

    // Limiter la taille de l'historique
    if (geoState.locationHistory.length > config.maxHistorySize) {
      geoState.locationHistory.shift();
    }

    // Synchroniser avec le service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'STORE_LOCATION',
        payload: location
      });
    }
  }

  /**
   * Met à jour les marqueurs sur la carte
   */
  function updateMapMarkers(map, location) {
    if (!map) return;

    const { latitude, longitude, accuracy } = location;
    const latLng = L.latLng(latitude, longitude);

    // Mettre à jour le marqueur actuel
    if (!geoState.markers.current) {
      // Créer le marqueur avec une icône SVG personnalisée
      const icon = createLocationIcon();
      geoState.markers.current = L.marker(latLng, { icon, draggable: false })
        .bindPopup(`
          <div style="font-size: 12px;">
            <strong>Position actuelle</strong><br>
            Lat: ${latitude.toFixed(6)}<br>
            Lon: ${longitude.toFixed(6)}<br>
            Précision: ${accuracy.toFixed(0)}m<br>
            ${new Date().toLocaleTimeString('fr-FR')}
          </div>
        `)
        .addTo(map);
    } else {
      geoState.markers.current.setLatLng(latLng);
    }

    // Afficher le cercle de précision
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
      }
    }

    // Afficher la trace
    if (config.showTrail && geoState.locationHistory.length > 1) {
      updateTrail(map);
    }
  }

  /**
   * Met à jour la trace de déplacement
   */
  function updateTrail(map) {
    if (!geoState.markers.trail) return;

    // Nettoyer les anciens polylines
    geoState.markers.trail.clearLayers();

    // Créer la polyline avec la trace
    if (geoState.locationHistory.length > 1) {
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
    }
  }

  /**
   * Crée une icône personnalisée pour la position actuelle
   */
  function createLocationIcon() {
    const svgIcon = L.divIcon({
      html: `
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="white" stroke="${config.currentMarkerColor}" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="${config.currentMarkerColor}"/>
          <circle cx="16" cy="16" r="3" fill="white"/>
          <path d="M16 2 A14 14 0 0 1 28 16" fill="none" stroke="${config.currentMarkerColor}" stroke-width="1.5" opacity="0.3" stroke-dasharray="3,2"/>
        </svg>
      `,
      iconSize: [32, 32],
      className: 'location-icon'
    });
    return svgIcon;
  }

  /**
   * Efface l'historique
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
   * Exporte les données de localisation
   */
  function exportData() {
    return {
      currentLocation: geoState.currentLocation,
      history: geoState.locationHistory,
      timestamp: new Date().toISOString(),
      isTracking: geoState.isTracking
    };
  }

  /**
   * Demande les permissions de notifications
   */
  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('[GEOLOCATION] Notifications non supportées');
      return Promise.reject('Notifications non supportées');
    }

    if (Notification.permission === 'granted') {
      return Promise.resolve();
    }

    if (Notification.permission !== 'denied') {
      return Notification.requestPermission();
    }

    return Promise.reject('Permission refusée');
  }

  /**
   * Demande les permissions de géolocalisation (pour iOS 13+)
   */
  function requestLocationPermission() {
    if (!navigator.geolocation) {
      return Promise.reject('Géolocalisation non disponible');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (error) => reject(error)
      );
    });
  }

  // API publique
  return {
    init,
    requestLocationPermission,
    requestNotificationPermission,
    exportData,
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
}
