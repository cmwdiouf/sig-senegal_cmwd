# Installation et Configuration - SIG Sénégal PWA

## 🔧 Installation

### Prérequis
- Serveur web (Apache, Nginx, Node.js, etc.)
- HTTPS activé (obligatoire pour les PWA)
- Navigateur moderne (Chrome 45+, Firefox 44+, Safari 11.3+)

### Étapes d'installation

#### 1. Copier les fichiers
```bash
# Copier tous les fichiers du répertoire sig-senegal_cmwd sur le serveur
# Les fichiers doivent être accessibles via HTTPS
```

#### 2. Configurer le serveur HTTPS
```bash
# Apache (.htaccess)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

#### 3. Configuration MIME types
```bash
# Assurez-vous que les types MIME sont correctement configurés:
- .js → application/javascript
- .json → application/json
- .geojson → application/geo+json
- .woff2 → font/woff2
```

#### 4. Permissions CORS (si ressources externes)
```bash
# Apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, OPTIONS"

# Nginx
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
```

### Vérification de l'installation

1. **Ouvrir DevTools (F12)**
2. **Onglet "Application"**
3. Vérifier:
   - ✅ Manifest.json chargé
   - ✅ Service Worker enregistré
   - ✅ Cache Storage visible

## 🎨 Personnalisation

### Modifier les couleurs

#### Dans `index.html` (ligne ~20)
```css
:root {
    --primary: #1e293b;        /* Couleur principale */
    --secondary: #334155;      /* Couleur secondaire */
    --accent: #10b981;         /* Couleur accentuation */
    --bg-canvas: #f1f5f9;      /* Fond */
}
```

### Modifier les icônes

Les icônes SVG sont intégrées dans `manifest.json`. Pour personnaliser:

1. Modifier les SVG inline dans le fichier
2. Ou générer des icônes (utiliser un service en ligne)

### Modifier le nom de l'app

#### Dans `manifest.json`
```json
{
  "name": "SIG Sénégal - Expert Vision Pro",
  "short_name": "SIG Sénégal",
  "description": "Description personnalisée"
}
```

### Modifier les fonds de carte

#### Dans le code JavaScript (rechercher mapConfig.basemaps)
```javascript
basemaps: {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },
    // Ajouter d'autres fonds...
}
```

### Ajouter des couches de données

#### Créer un fichier GeoJSON ou TopoJSON

```bash
# Placer dans ./data/
# Par exemple: data/myLayer_6.js
```

#### Ajouter au code JavaScript

```javascript
// Dans la fonction init() du module SIG_SENEGAL
const myLayer = L.geoJSON(json_myLayer_6, {
    style: { color: '#ff0000', weight: 2 },
    onEachFeature: (f, l) => l.bindPopup(f.properties.name)
});

layers.myLayer = myLayer;
```

## 🔒 Sécurité

### Recommandations

1. **HTTPS obligatoire**
   - Les PWA nécessitent HTTPS
   - Utiliser Let's Encrypt pour les certificats gratuits

2. **Headers de sécurité**
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN";
   add_header X-Content-Type-Options "nosniff";
   add_header X-XSS-Protection "1; mode=block";
   add_header Referrer-Policy "no-referrer-when-downgrade";
   ```

3. **Content Security Policy (CSP)**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;">
   ```

4. **Protection des données**
   - Les données de géolocalisation restent locales
   - Pas de transmission automatique au serveur
   - Utiliser HTTPS pour toute communication

## 📊 Monitoring et Analytics

### Logs du Service Worker
```javascript
// Dans la console du navigateur
// Application → Service Workers → voir les logs
```

### Statistiques d'utilisation (facultatif)
```javascript
// Ajouter du code pour tracer les événements:
if (navigator.serviceWorker) {
    navigator.serviceWorker.controller.postMessage({
        type: 'LOG_EVENT',
        event: 'app_open',
        timestamp: new Date().toISOString()
    });
}
```

### Santé du cache
```javascript
// Vérifier la taille du cache
caches.keys().then(names => {
    names.forEach(name => {
        caches.open(name).then(cache => {
            cache.keys().then(requests => {
                console.log(`${name}: ${requests.length} items`);
            });
        });
    });
});
```

## 🚀 Optimisation des performances

### 1. Réduire la taille des assets

```bash
# Minifier CSS
npx csso style.css -o style.min.css

# Minifier JS
npx terser script.js -o script.min.js

# Optimiser les images
npx imagemin img.png --out-dir=dist
```

### 2. Compression

```nginx
# Nginx: activer gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;
```

### 3. Cache-Control headers

```nginx
# Assets statiques
location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff2|woff)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# HTML
location ~ \.html$ {
    expires 1h;
    add_header Cache-Control "public";
}
```

### 4. Lazy loading

Ajouter aux images:
```html
<img src="..." loading="lazy" decoding="async">
```

## 📱 Tests sur appareil réel

### Android
```bash
# 1. Brancher l'appareil USB
# 2. Activer le débogage USB
# 3. Chrome: chrome://inspect
# 4. Sélectionner l'appareil
```

### iOS
```bash
# 1. Brancher l'iPhone
# 2. Safari sur Mac: Develop → Sélectionner l'appareil
# 3. Tester via Safari
```

## 🐛 Dépannage

### Service Worker ne s'enregistre pas
```bash
# Vérifier:
1. HTTPS activé
2. manifest.json accessible
3. sw.js accessible
4. Pas de CSP bloquant
```

### Cache ne fonctionne pas
```bash
# Solution:
chrome://inspect → Application → Clear site data
# Ou dans l'app: PWA_MODULE.clearCache()
```

### Géolocalisation ne marche pas
```bash
# Vérifier:
1. Permissions du navigateur
2. Navigateur moderne
3. HTTPS activé
4. Position GPS active
```

## 📝 Mise à jour de l'application

### Déployer une nouvelle version

1. **Mettre à jour les fichiers**
```bash
cp -r sig-senegal_cmwd/* /var/www/html/sig-senegal/
```

2. **Incrémenter la version du Service Worker**
```javascript
// Dans sw.js, ligne 3
const CACHE_NAME = 'sig-senegal-v2'; // v2 au lieu de v1
```

3. **Les utilisateurs verront une notification de mise à jour**
   - Cliquer sur "Mettre à jour"
   - La page se recharge avec la nouvelle version

### Versioning

```bash
# Système de versioning
v1.0.0 - Release initiale
v1.1.0 - Nouvelles fonctionnalités
v1.0.1 - Corrections de bugs
```

## 📦 Distribution

### Pour Android

Les utilisateurs peuvent installer via:
1. Navigateur Chrome: Menu → "Installer l'application"
2. WebAPK (installer natif) - Google Play Store

### Pour iOS

Les utilisateurs peuvent installer via:
1. Safari: Partager → Sur l'écran d'accueil
2. App Clips (iOS 14+)

## 🔗 Ressources utiles

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/docs/Web/API/Service_Worker_API)
- [Geolocation API](https://developer.mozilla.org/docs/Web/API/Geolocation_API)
- [Leaflet.js Docs](https://leafletjs.com/)

## 📞 Support Technique

Pour les problèmes:
1. Vérifier les logs (F12 → Console)
2. Vérifier le Network tab
3. Vérifier le Service Worker (Application tab)
4. Vider le cache et recharger

---

**Version**: 1.0.0  
**Date**: Janvier 2026
