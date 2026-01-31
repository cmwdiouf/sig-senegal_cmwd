/**
 * EXEMPLES DE PERSONNALISATION
 * Copiez et adaptez le code selon vos besoins
 */

// ============================================================================
// 1. PERSONNALISER LES COULEURS
// ============================================================================

// Dans index.html, modifier la section :root (ligne ~20)
/*
:root {
    --primary: #1e293b;        ← Couleur principale (barre supérieure)
    --secondary: #334155;      ← Couleur secondaire (sous-menu)
    --accent: #10b981;         ← Couleur accentuation (boutons verts)
    --sidebar-w: 380px;        ← Largeur de la sidebar
    --bg-canvas: #f1f5f9;      ← Couleur de fond
}
*/

// Exemples de palettes:
const PALETTES = {
  senegal: {
    primary: '#1e293b',     // Bleu marine
    accent: '#10b981',      // Vert émeraude
    secondary: '#334155'
  },
  france: {
    primary: '#002395',     // Bleu français
    accent: '#FFF000',      // Or
    secondary: '#ef2b2d'    // Rouge
  },
  traditional: {
    primary: '#8B4513',     // Marron
    accent: '#FFD700',      // Or
    secondary: '#DAA520'    // Doré
  }
};

// ============================================================================
// 2. CHANGER LE NOM DE L'APPLICATION
// ============================================================================

// Dans manifest.json:
/*
{
  "name": "SIG Sénégal - Expert Vision Pro",    ← Nom complet (installation)
  "short_name": "SIG Sénégal",                  ← Nom court (écran d'accueil)
  "description": "Application de cartographie du Sénégal",
  "categories": ["maps", "navigation"]
}
*/

// ============================================================================
// 3. AJOUTER DE NOUVELLES COUCHES DE DONNÉES
// ============================================================================

// Exemple: Ajouter une couche de points d'intérêt
async function addCustomLayer() {
  // 1. Créer le fichier GeoJSON: data/POI_6.js
  /*
  var json_POI_6 = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "Hôpital X",
          "type": "healthcare"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [-14.6495, 14.6928]
        }
      }
    ]
  };
  */

  // 2. Charger le fichier
  const response = await fetch('./data/POI_6.js');
  const script = document.createElement('script');
  script.src = './data/POI_6.js';
  document.head.appendChild(script);

  // 3. Créer la couche
  setTimeout(() => {
    if (window.json_POI_6) {
      const poiLayer = L.geoJSON(json_POI_6, {
        pointToLayer: (feature, latlng) => {
          let icon;
          if (feature.properties.type === 'healthcare') {
            icon = L.divIcon({
              html: '<i class="fas fa-hospital" style="color: red; font-size: 24px;"></i>',
              iconSize: [32, 32]
            });
          }
          return L.marker(latlng, { icon });
        },
        onEachFeature: (f, l) => {
          l.bindPopup(`<b>${f.properties.name}</b><br>Type: ${f.properties.type}`);
        }
      }).addTo(map);

      layers.poi = poiLayer;
      console.log('Couche POI ajoutée');
    }
  }, 1000);
}

// ============================================================================
// 4. PERSONNALISER LES ICÔNES DE GEOLOCALISATION
// ============================================================================

// Modifier dans js/geolocation.js, fonction createLocationIcon()
function createCustomLocationIcon() {
  const svgIcon = L.divIcon({
    html: `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <!-- Cercle extérieur animé -->
        <circle cx="20" cy="20" r="16" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.3"/>
        
        <!-- Cercle principal -->
        <circle cx="20" cy="20" r="12" fill="white" stroke="#1e293b" stroke-width="2"/>
        
        <!-- Cœur intérieur (marqueur actif) -->
        <circle cx="20" cy="20" r="6" fill="#1e293b"/>
        
        <!-- Point central -->
        <circle cx="20" cy="20" r="3" fill="white"/>
        
        <!-- Direction (pointeur vers le haut) -->
        <path d="M20 8 L22 15 L18 15 Z" fill="#1e293b"/>
      </svg>
    `,
    iconSize: [40, 40],
    className: 'custom-location-icon'
  });
  return svgIcon;
}

// ============================================================================
// 5. AJOUTER DES ÉVÉNEMENTS PERSONNALISÉS
// ============================================================================

// Dans js/config.advanced.js, personnaliser les callbacks:
EVENTS_CONFIG.geolocation.onLocationChange = (location) => {
  console.log('Nouvelle position:', location);
  
  // Exemple: Envoyer au serveur
  /*
  fetch('/api/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(location)
  });
  */
  
  // Exemple: Vérifier une zone
  const inZone = isInRestrictedZone(location.latitude, location.longitude);
  if (inZone) {
    PWA_MODULE.showNotification('Attention', 'Vous êtes dans une zone limitée');
  }
};

// ============================================================================
// 6. IMPLÉMENTER UN SYSTÈME DE GÉOFENCING
// ============================================================================

class GeofenceManager {
  constructor(map) {
    this.map = map;
    this.zones = [];
    this.activeZone = null;
  }

  addZone(name, lat, lon, radius, options = {}) {
    const zone = {
      name,
      lat,
      lon,
      radius,
      circle: L.circle([lat, lon], {
        radius: radius,
        color: options.color || '#ff0000',
        fillOpacity: 0.2,
        dashArray: '5, 5'
      }).addTo(this.map),
      onEnter: options.onEnter || (() => {}),
      onExit: options.onExit || (() => {})
    };

    zone.circle.bindPopup(`<b>${name}</b><br>Rayon: ${radius}m`);
    this.zones.push(zone);
  }

  startMonitoring() {
    setInterval(() => {
      const location = GEOLOCATION_MODULE.getCurrentLocation();
      if (!location) return;

      this.zones.forEach(zone => {
        const distance = GEOLOCATION_MODULE.calculateDistance(
          location.latitude, location.longitude,
          zone.lat, zone.lon
        ) * 1000; // en mètres

        const isInZone = distance <= zone.radius;

        if (isInZone && !zone.isActive) {
          zone.isActive = true;
          zone.onEnter();
          console.log(`Entrée dans la zone: ${zone.name}`);
        } else if (!isInZone && zone.isActive) {
          zone.isActive = false;
          zone.onExit();
          console.log(`Sortie de la zone: ${zone.name}`);
        }
      });
    }, 5000);
  }
}

// Utilisation:
/*
const geofence = new GeofenceManager(map);

geofence.addZone('Siège social', 14.6928, -14.6495, 500, {
  color: '#00ff00',
  onEnter: () => {
    PWA_MODULE.showNotification('Bienvenue', 'Vous êtes au siège social');
  },
  onExit: () => {
    PWA_MODULE.showNotification('Au revoir', 'Vous avez quitté le siège social');
  }
});

geofence.startMonitoring();
*/

// ============================================================================
// 7. CRÉER UN RAPPORT DE TRAJET
// ============================================================================

class TripReport {
  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.startLocation = null;
    this.endLocation = null;
  }

  start() {
    this.startTime = new Date();
    this.startLocation = GEOLOCATION_MODULE.getCurrentLocation();
  }

  end() {
    this.endTime = new Date();
    this.endLocation = GEOLOCATION_MODULE.getCurrentLocation();
  }

  generateReport() {
    const duration = (this.endTime - this.startTime) / 1000 / 60; // minutes
    const distance = GEOLOCATION_MODULE.getTotalDistance();
    const history = GEOLOCATION_MODULE.getLocationHistory();

    return {
      startTime: this.startTime,
      endTime: this.endTime,
      duration: `${Math.floor(duration)} minutes`,
      distance: `${distance.toFixed(2)} km`,
      avgSpeed: `${(distance * 60 / duration).toFixed(1)} km/h`,
      points: history.length,
      startLocation: this.startLocation,
      endLocation: this.endLocation
    };
  }

  exportAsHTML() {
    const report = this.generateReport();
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport de Trajet</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            td { border: 1px solid #ddd; padding: 8px; }
            th { background: #1e293b; color: white; }
          </style>
        </head>
        <body>
          <h1>Rapport de Trajet</h1>
          <table>
            <tr><th>Métrique</th><th>Valeur</th></tr>
            <tr><td>Heure de départ</td><td>${report.startTime}</td></tr>
            <tr><td>Heure d'arrivée</td><td>${report.endTime}</td></tr>
            <tr><td>Durée</td><td>${report.duration}</td></tr>
            <tr><td>Distance</td><td>${report.distance}</td></tr>
            <tr><td>Vitesse moyenne</td><td>${report.avgSpeed}</td></tr>
            <tr><td>Nombre de points</td><td>${report.points}</td></tr>
          </table>
        </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-trajet-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
  }
}

// ============================================================================
// 8. INTÉGRER UNE API BACKEND
// ============================================================================

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async submitLocation(location) {
    try {
      const response = await fetch(`${this.baseURL}/api/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur submission:', error);
    }
  }

  async fetchZones() {
    try {
      const response = await fetch(`${this.baseURL}/api/zones`);
      return await response.json();
    } catch (error) {
      console.error('Erreur fetch zones:', error);
      return [];
    }
  }

  async logEvent(event, data) {
    try {
      await fetch(`${this.baseURL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
      });
    } catch (error) {
      console.error('Erreur log event:', error);
    }
  }
}

// ============================================================================
// 9. CRÉER UN INTERFACE DE STATISTIQUES
// ============================================================================

function displayStatistics() {
  const history = GEOLOCATION_MODULE.getLocationHistory();
  const state = GEOLOCATION_MODULE.getState ? GEOLOCATION_MODULE.getState() : {};

  const stats = {
    totalPoints: history.length,
    duration: history.length > 1 ?
      new Date(history[history.length - 1].timestamp) - new Date(history[0].timestamp)
      : 0,
    distance: getTotalDistance(),
    avgAccuracy: history.length > 0 ?
      history.reduce((a, b) => a + b.accuracy, 0) / history.length
      : 0,
    isTracking: state.isTracking || false
  };

  const statsDiv = document.createElement('div');
  statsDiv.innerHTML = `
    <div class="stats-widget" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h4 style="margin-top: 0;">Statistiques du Trajet</h4>
      <table style="width: 100%; font-size: 12px;">
        <tr><td>Points:</td><td><strong>${stats.totalPoints}</strong></td></tr>
        <tr><td>Distance:</td><td><strong>${stats.distance.toFixed(2)} km</strong></td></tr>
        <tr><td>Durée:</td><td><strong>${Math.floor(stats.duration / 60000)} min</strong></td></tr>
        <tr><td>Précision moy:</td><td><strong>${stats.avgAccuracy.toFixed(1)} m</strong></td></tr>
        <tr><td>Suivi:</td><td><strong>${stats.isTracking ? '🟢 Actif' : '🔴 Inactif'}</strong></td></tr>
      </table>
    </div>
  `;

  return statsDiv;
}

// ============================================================================
// 10. EXPORTER EN DIFFÉRENTS FORMATS
// ============================================================================

class DataExporter {
  static exportGeoJSON() {
    const data = GEOLOCATION_MODULE.exportData();
    return {
      type: 'FeatureCollection',
      features: data.history.map((loc, idx) => ({
        type: 'Feature',
        properties: {
          index: idx,
          timestamp: loc.timestamp,
          accuracy: loc.accuracy
        },
        geometry: {
          type: 'Point',
          coordinates: [loc.longitude, loc.latitude]
        }
      }))
    };
  }

  static exportGPX() {
    const history = GEOLOCATION_MODULE.getLocationHistory();
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Trajet SIG Sénégal</name>
    <trkseg>`;

    history.forEach(loc => {
      gpx += `
      <trkpt lat="${loc.latitude}" lon="${loc.longitude}">
        <ele>${loc.altitude || 0}</ele>
        <time>${loc.timestamp}</time>
      </trkpt>`;
    });

    gpx += `
    </trkseg>
  </trk>
</gpx>`;
    return gpx;
  }

  static exportKML() {
    const history = GEOLOCATION_MODULE.getLocationHistory();
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Trajet SIG Sénégal</name>
    <Placemark>
      <name>Trace</name>
      <LineString>
        <coordinates>`;

    history.forEach(loc => {
      kml += `${loc.longitude},${loc.latitude},${loc.altitude || 0} `;
    });

    kml += `
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
    return kml;
  }
}

// ============================================================================
// UTILISATION
// ============================================================================

/*
// Ajouter une couche personnalisée
addCustomLayer();

// Créer et utiliser un rapport
const report = new TripReport();
report.start();
// ... utiliser l'app ...
report.end();
report.exportAsHTML();

// Créer un client API
const api = new APIClient('https://api.exemple.com');
api.submitLocation(GEOLOCATION_MODULE.getCurrentLocation());

// Afficher les statistiques
document.body.appendChild(displayStatistics());

// Exporter en différents formats
const geojson = DataExporter.exportGeoJSON();
const gpx = DataExporter.exportGPX();
const kml = DataExporter.exportKML();
*/

// ============================================================================
// FIN DES EXEMPLES
// ============================================================================
