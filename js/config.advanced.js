/**
 * Configuration avancée de la PWA SIG Sénégal
 * À modifier selon vos besoins spécifiques
 */

// ============================================================================
// CONFIGURATION DE LA GÉOLOCALISATION
// ============================================================================

const GEOLOCATION_CONFIG = {
  // Précision de la localisation
  highAccuracy: true,           // Demande haute précision (consomme plus)
  timeout: 30000,               // Timeout en ms (30 sec)
  maximumAge: 0,                // Age max du cache de position (0 = toujours récent)
  
  // Mise à jour
  updateInterval: 5000,         // Interval de mise à jour en ms
  maxHistorySize: 50,          // Nombre max de positions en historique
  
  // Affichage
  showAccuracyCircle: true,    // Afficher le cercle de précision
  showTrail: true,              // Afficher la trace de déplacement
  trailColor: '#10b981',       // Couleur de la trace
  trailWeight: 2,              // Épaisseur de la trace
  trailOpacity: 0.7,           // Transparence de la trace
  currentMarkerColor: '#1e293b' // Couleur du marqueur actuel
};

// ============================================================================
// CONFIGURATION DU SERVICE WORKER
// ============================================================================

const SW_CONFIG = {
  // Stratégies de cache
  strategies: {
    // Pour les documents HTML
    documents: 'cache-first',
    
    // Pour les CSS et JS
    assets: 'cache-first',
    
    // Pour les données GeoJSON
    data: 'stale-while-revalidate',
    
    // Pour les ressources externes (CDN)
    external: 'network-first'
  },
  
  // Taille des caches
  maxCacheSize: 50 * 1024 * 1024, // 50 MB
  
  // Temps de vie du cache
  cacheTTL: {
    documents: 7 * 24 * 60 * 60 * 1000,  // 7 jours
    data: 24 * 60 * 60 * 1000,            // 1 jour
    assets: 30 * 24 * 60 * 60 * 1000      // 30 jours
  }
};

// ============================================================================
// CONFIGURATION DE L'APPLICATION
// ============================================================================

const APP_CONFIG = {
  // Métadonnées
  name: 'SIG Sénégal - Expert Vision Pro',
  shortName: 'SIG Sénégal',
  version: '1.0.0',
  
  // Couleurs
  primaryColor: '#1e293b',
  accentColor: '#10b981',
  secondaryColor: '#334155',
  
  // Comportement
  autoCheckUpdates: true,       // Vérifier les mises à jour auto
  updateCheckInterval: 3600000, // Toutes les heures
  
  // Notifications
  notifications: {
    enabled: true,
    requestOnStart: false
  },
  
  // Stockage
  storage: {
    enabled: true,
    maxLocalStorageSize: 5 * 1024 * 1024 // 5 MB
  }
};

// ============================================================================
// CONFIGURATION CARTOGRAPHIQUE
// ============================================================================

const MAP_CONFIG = {
  // Vue par défaut
  defaultCenter: [14.6928, -14.6495],  // Dakar, Sénégal
  defaultZoom: 7,
  minZoom: 5,
  maxZoom: 19,
  
  // Fonds de carte
  basemaps: {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      name: 'OpenStreetMap Standard'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap',
      name: 'Topographique'
    },
    sat: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      name: 'Satellite ArcGIS'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© CartoDB',
      name: 'CartoDB Dark'
    }
  },
  
  // Couches de données
  layers: {
    regions: {
      url: './data/Region_1.js',
      style: {
        color: '#27ae60',
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.3
      }
    },
    departements: {
      url: './data/Departement_2.js',
      style: {
        color: '#e67e22',
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.2
      }
    },
    routes: {
      url: './data/Routes_4.js',
      style: {
        color: '#c0392b',
        weight: 3,
        opacity: 0.8
      }
    },
    localites: {
      url: './data/localites_5.js',
      style: {
        color: '#8e44ad',
        radius: 5,
        fillOpacity: 0.9
      }
    }
  }
};

// ============================================================================
// CONFIGURATION DES PERMISSIONS
// ============================================================================

const PERMISSIONS_CONFIG = {
  // Demander les permissions au démarrage
  requestOnStart: false,
  
  // Permissions requises
  required: [],
  
  // Permissions optionnelles
  optional: [
    'geolocation',
    'notifications'
  ],
  
  // Messages de permission
  messages: {
    geolocation: 'Nous avons besoin d\'accéder à votre GPS pour afficher votre position sur la carte.',
    notifications: 'Les notifications vous aideront à rester informé des événements importants.'
  }
};

// ============================================================================
// CONFIGURATION DES ÉVÉNEMENTS
// ============================================================================

const EVENTS_CONFIG = {
  // Événements de géolocalisation
  geolocation: {
    onLocationChange: null,      // Callback lors d'un changement de position
    onLocationError: null,        // Callback en cas d'erreur
    onTrackingStart: null,       // Callback au démarrage du suivi
    onTrackingStop: null         // Callback à l'arrêt du suivi
  },
  
  // Événements du Service Worker
  serviceWorker: {
    onUpdateFound: null,         // Callback si mise à jour disponible
    onActivate: null,            // Callback à l'activation
    onInstall: null              // Callback à l'installation
  },
  
  // Événements de l'application
  app: {
    onOnline: null,              // Callback quand en ligne
    onOffline: null,             // Callback quand hors ligne
    onInstall: null              // Callback quand l'app est installée
  }
};

// ============================================================================
// HELPER: Initialiser avec la configuration
// ============================================================================

function initializeWithConfig() {
  // Appliquer la configuration de géolocalisation
  if (window.GEOLOCATION_MODULE && window.GEOLOCATION_MODULE.setConfig) {
    GEOLOCATION_MODULE.setConfig(GEOLOCATION_CONFIG);
  }
  
  // Appliquer les callbacks d'événements
  if (EVENTS_CONFIG.geolocation.onLocationChange) {
    // À implémenter selon vos besoins
  }
  
  console.log('[CONFIG] Configuration appliquée avec succès');
}

// Auto-initialiser si chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWithConfig);
} else {
  initializeWithConfig();
}

// ============================================================================
// EXPORT POUR UTILISATION EXTERNE
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GEOLOCATION_CONFIG,
    SW_CONFIG,
    APP_CONFIG,
    MAP_CONFIG,
    PERMISSIONS_CONFIG,
    EVENTS_CONFIG
  };
}
