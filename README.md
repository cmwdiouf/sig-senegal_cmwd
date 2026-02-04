# 🗺️ SIG Sénégal - Progressive Web App

**Application WEB/SIG de diffusion d'informations géospatiales**  
📱 **https://cmwdiouf.github.io/sig-senegal_cmwd/**

---

## ⚡ DÉMARRAGE RAPIDE (15 minutes)

### Étape 1: Copier le code dans `index.html`

#### Dans le `<head>` (après `<link rel="manifest">`)

```html
<!-- PWA Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="SIG Sénégal">
<meta name="theme-color" content="#1e293b">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">

<!-- CSS Mobile Responsive -->
<link rel="stylesheet" href="./css/mobile-responsive.css">

<!-- Désactiver le zoom pinch -->
<style>
  body, html { touch-action: manipulation; }
  input, button, select { touch-action: manipulation; }
</style>
```

#### Avant `</body>` (fin du fichier)

```html
<!-- Scripts PWA -->
<script src="./js/pwa-advanced.js" defer></script>
<script src="./VALIDATE.js" defer></script>

<!-- Géolocalisation -->
<script defer>
document.addEventListener('DOMContentLoaded', function() {
  console.log('[INIT] PWA démarrée');

  // Géolocalisation
  const locBtn = document.getElementById('btn-locate-once');
  if (locBtn) {
    locBtn.addEventListener('click', async () => {
      try {
        locBtn.disabled = true;
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 30000
          });
        });

        const { latitude, longitude } = position.coords;
        
        // Afficher sur carte
        if (window.SIG_MAP) {
          window.SIG_MAP.setView([latitude, longitude], 15);
        }

        // Afficher coordonnées
        document.getElementById('loc-latitude').textContent = latitude.toFixed(6);
        document.getElementById('loc-longitude').textContent = longitude.toFixed(6);
        document.getElementById('location-info').style.display = 'block';

        PWA_ADVANCED.showNotification('✓ Position obtenue', 
          `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

      } catch (err) {
        PWA_ADVANCED.showNotification('❌ Erreur', 
          'Impossible d\'accéder à la position');
      } finally {
        locBtn.disabled = false;
      }
    });
  }

  // Orientation
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (window.SIG_MAP) window.SIG_MAP.invalidateSize();
    }, 100);
  });
});
</script>
```

### Étape 2: Vérifier les éléments HTML

Assurez-vous que ces IDs existent dans `index.html`:

```html
<!-- Dans votre section géolocalisation -->
<button id="btn-locate-once">Localiser</button>
<div id="location-info" style="display: none;">
  <span id="loc-latitude">--</span>
  <span id="loc-longitude">--</span>
</div>
```

### Étape 3: Tester en local

Appuyez sur **F12** et collez:
```javascript
PWA_ADVANCED.getStatus()
// Doit afficher: { installed, online, swActive, ... }
```

### Étape 4: Déployer sur GitHub

```bash
git add -A
git commit -m "feat: PWA complète avec géolocalisation et offline"
git push origin main
```

Attendez 1-2 minutes, puis testez:
```
https://cmwdiouf.github.io/sig-senegal_cmwd/
```

---

## 📦 Ce qui a été créé

### Code source

| Fichier | Lignes | Description |
|---------|--------|-------------|
| **sw-v2.js** | 270+ | Service Worker avec cache intelligent |
| **js/pwa-advanced.js** | 450+ | Module PWA (installation, notifications, sync) |
| **css/mobile-responsive.css** | 800+ | CSS responsive mobile-first |
| **manifest.json** | ✅ | Mis à jour pour GitHub Pages |

### Dossiers existants
- `css/` - Feuilles de style
- `js/` - Scripts (Leaflet, géolocalisation, etc.)
- `data/` - Données GeoJSON
- `images/` - Images et icônes
- `webfonts/` - Polices
- `legend/` - Légende

---

## ✨ Fonctionnalités PWA

### 📱 Installation
- Bannière automatique "Installer SIG Sénégal"
- Installation sur écran d'accueil
- Mode standalone (pas d'adresse bar)

### 🗺️ Géolocalisation GPS
- Localisation haute précision
- Suivi en temps réel
- Affichage automatique sur carte

### 🏴 Mode Offline
- Tuiles cartographiques en cache
- Ressources statiques
- Fonctionne 100% hors ligne

### 🔔 Notifications
- Installation confirmée
- Mise à jour disponible
- Notifications personnalisées

### 📱 Responsive
- Mobile-first
- Tous les écrans
- Safe areas (notch)

---

## 🧪 Tests

### Test 1: Service Worker
```javascript
navigator.serviceWorker.getRegistrations().then(console.log)
```

### Test 2: Géolocalisation
1. Cliquez sur "Localiser ma position"
2. Autorisez le GPS
3. Position affichée ✓

### Test 3: Offline
1. F12 > Network > "Offline"
2. Rafraîchissez la page
3. Fonctionne ✓

### Test 4: Installation
- **Android Chrome**: Menu > "Installer l'application"
- **iOS Safari**: Partager > "Ajouter à l'écran d'accueil"

---

## 🔧 Commandes utiles (F12 Console)

```javascript
// Notification
PWA_ADVANCED.showNotification('Titre', 'Message')

// Statut
PWA_ADVANCED.getStatus()

// Vider cache
PWA_ADVANCED.clearCache()

// Taille cache
PWA_ADVANCED.getCacheSize().then(s => console.log((s/1024/1024).toFixed(2) + ' MB'))
```

---

## 📊 Structure du projet

```
sig-senegal_cmwd/
├── index.html              ← App principale (MODIFIER CECI)
├── manifest.json           ← PWA metadata
├── sw-v2.js                ← Service Worker
├── README.md               ← Ce fichier
├── css/
│   ├── mobile-responsive.css  ← PWA CSS
│   └── ... (Leaflet, etc.)
├── js/
│   ├── pwa-advanced.js        ← PWA module
│   ├── geolocation.js         ← Géolocalisation
│   └── ... (Leaflet, etc.)
├── data/                   ← GeoJSON
├── images/
├── webfonts/
└── legend/
```

---

## 📋 Checklist d'intégration

- [ ] Copier meta tags dans `<head>`
- [ ] Copier scripts avant `</body>`
- [ ] Vérifier IDs HTML (btn-locate-once, location-info, etc.)
- [ ] F12 Console: `PWA_ADVANCED.getStatus()` ✓
- [ ] Commit & push
- [ ] Attendre 1-2 min (GitHub Pages rebuild)
- [ ] Tester sur `https://cmwdiouf.github.io/sig-senegal_cmwd/`
- [ ] Installer l'app sur mobile
- [ ] Tester géolocalisation
- [ ] Tester offline (F12 Network > Offline)

---

## 🆘 Problèmes courants

| Problème | Cause | Solution |
|----------|-------|----------|
| Géolocalisation ne marche pas | Pas HTTPS | Testez sur GitHub Pages (https://...) |
| Service Worker ne s'enregistre pas | Chemin incorrect | Vérifiez les chemins: `/sig-senegal_cmwd/sw-v2.js` |
| App ne s'installe pas | Manifest invalide | Validez sur https://www.pwabuilder.com/ |
| Offline ne marche pas | Pas de cache | Naviguez d'abord en ligne |
| IDs HTML manquants | HTML incomplet | Ajoutez les éléments avec les bons IDs |

---

## 🎓 Ressources

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://www.w3.org/TR/appmanifest/)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [GitHub Pages](https://docs.github.com/en/pages)
- [Leaflet.js](https://leafletjs.com/)

---

## ✅ Résumé

**Fichiers essentiels créés:**
1. ✅ `sw-v2.js` - Service Worker v2
2. ✅ `js/pwa-advanced.js` - Module PWA
3. ✅ `css/mobile-responsive.css` - CSS responsive
4. ✅ `manifest.json` - Configuration PWA

**À faire:**
1. Copier le code ci-dessus dans `index.html`
2. Vérifier les IDs HTML
3. Tester avec F12 Console
4. Commit & push sur GitHub

**Temps total:** 15 minutes ⏱️

---

**Date:** 4 février 2026  
**Application:** SIG Sénégal - Expert Vision Pro  
**Plateforme:** GitHub Pages (HTTPS)  
**Framework:** Leaflet.js + PWA
