# 🌍 SIG Sénégal - Progressive Web App Mobile

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg)
![License](https://img.shields.io/badge/license-Free-brightgreen.svg)

## 📱 Application Mobile Installable sans AppStore/PlayStore

Une **Progressive Web App (PWA)** complète pour la cartographie géographique du Sénégal avec géolocalisation GPS en temps réel. Installez directement sur votre téléphone (Android et iOS) sans passer par les app stores!

## ✨ Caractéristiques Principales

### 🎯 Géolocalisation Avancée
- ✅ **Localisation précise** avec GPS
- ✅ **Suivi en temps réel** continu
- ✅ **Trace visible** sur la carte
- ✅ **Historique** des positions (50 max)
- ✅ **Export GeoJSON** pour QGIS
- ✅ **Cercle de confiance** visuel
- ✅ **Calcul distance** automatique

### 📱 Installation Mobile
- ✅ **Android**: Chrome, Edge, Samsung Internet
- ✅ **iOS 13+**: Safari
- ✅ **Écran d'accueil**: Icône personnalisée
- ✅ **Fullscreen**: Sans barres de navigateur
- ✅ **Offline**: Fonctionne hors ligne

### 🗺️ Cartographie Complète
- ✅ **Couches multiples**: Régions, Départements, Routes, Localités
- ✅ **Fonds de carte** variés: OSM, Topographique, Satellite, Dark
- ✅ **Clusters** de marqueurs
- ✅ **Recherche** rapide
- ✅ **Mesure** et calcul de surface

### 🔌 Mode Hors Ligne
- ✅ **Cache intelligent** (50 MB)
- ✅ **Statut en ligne/hors ligne** visible
- ✅ **Synchronisation** automatique
- ✅ **Données persistantes** locales

### 🔄 Mises à Jour
- ✅ **Détection** automatique (toutes les heures)
- ✅ **Notifications** visuelles
- ✅ **Mise à jour transparent** sans recharge

## 🚀 Démarrage Rapide

### Installation sur Windows

```bash
# 1. Double-cliquer sur
install.bat

# 2. Accéder à http://localhost:8000
# (Déjà configuré pour Chrome)
```

### Installation sur Mac/Linux

```bash
# 1. Ouvrir un terminal
# 2. Exécuter
bash install.sh

# 3. Accéder à http://localhost:8000
```

### Installation sur Téléphone

**Android:**
1. Ouvrir dans Chrome
2. Menu (⋮) → "Installer l'application"
3. Confirmer

**iOS:**
1. Ouvrir dans Safari
2. Partager (↗️) → "Sur l'écran d'accueil"
3. Ajouter

## 📂 Structure du Projet

```
sig-senegal_cmwd/
├── 📄 index.html               # App principale (modifiée)
├── 📄 manifest.json            # Métadonnées PWA
├── 📄 sw.js                    # Service Worker
├── 📁 js/
│   ├── geolocation.js          # Module géolocalisation
│   ├── pwa.js                  # Module PWA
│   ├── config.advanced.js      # Configuration
│   ├── API_USAGE.js            # Exemples API
│   └── [autres fichiers]
├── 📁 css/                     # Feuilles de style
├── 📁 data/                    # Données GeoJSON
├── 📁 images/                  # Images
├── 📁 legend/                  # Légende cartographique
├── 📁 markers/                 # Marqueurs personnalisés
├── 📁 webfonts/                # Polices d'écriture
│
├── 📘 PWA_GUIDE.md             # Guide utilisateur (50+ pages)
├── 📘 INSTALLATION_GUIDE.md    # Configuration serveur
├── 📘 SUMMARY.md               # Résumé complet
├── 📘 CHECKLIST.md             # Vérification pré-prod
├── 📘 README.md                # Ce fichier
├── 📄 EXAMPLES.js              # 10 exemples de code
├── 🔧 install.sh               # Script installation Linux/Mac
└── 🔧 install.bat              # Script installation Windows
```

## 🎓 Documentation

### Pour les Utilisateurs
- **[PWA_GUIDE.md](PWA_GUIDE.md)** - Guide complet d'utilisation
  - Installation sur Android/iOS
  - Utilisation de la géolocalisation
  - Export des données
  - FAQ et dépannage

### Pour les Administrateurs
- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Configuration serveur
  - Installation Apache/Nginx
  - Configuration HTTPS
  - Optimisation des performances
  - Sécurité

### Pour les Développeurs
- **[EXAMPLES.js](EXAMPLES.js)** - 10 exemples complets
  - Géolocalisation avancée
  - Géofencing
  - Rapports de trajets
  - Export multiformats
  
- **[js/API_USAGE.js](js/API_USAGE.js)** - Référence API
  - Tous les modules disponibles
  - Méthodes et propriétés
  - Cas d'usage pratiques

- **[js/config.advanced.js](js/config.advanced.js)** - Configuration
  - Tous les paramètres
  - Comportements personnalisés

### Listes de Contrôle
- **[CHECKLIST.md](CHECKLIST.md)** - Vérification avant déploiement

## 💻 Technologies Utilisées

### Frontend
- **Leaflet.js** - Cartographie web
- **Bootstrap 5** - Interface utilisateur
- **Font Awesome** - Icônes
- **OpenStreetMap** - Données cartographiques

### PWA & Mobile
- **Service Workers** - Cache et mode offline
- **Web App Manifest** - Installation mobile
- **Geolocation API** - GPS
- **Notifications API** - Alertes utilisateur

### Backend (Optionnel)
- **Any Server**: Apache, Nginx, Node.js, Django, etc.
- **HTTPS Only**: Obligatoire pour les PWA

## ⚙️ Configuration Minimale

### Serveur Web
- ✅ HTTPS activé (obligatoire)
- ✅ Support des fichiers statiques
- ✅ Headers CORS configurés

### Navigateur Utilisateur
- ✅ Chrome 45+ ou Firefox 44+ ou Safari 11.3+
- ✅ Connection Internet (première visite)
- ✅ Permission GPS (pour géolocalisation)

### Smartphone
- ✅ Android 5+ ou iOS 13+
- ✅ GPS actif (recommandé)
- ✅ Batterie suffisante pour suivi

## 🔐 Sécurité

✅ **HTTPS Obligatoire**
- Certificate SSL/TLS gratuit via Let's Encrypt
- Redirection automatique HTTP → HTTPS

✅ **Données Locales**
- Géolocalisation : stockée localement uniquement
- Pas de transmission automatique au serveur
- Utilisateur contrôle ses données

✅ **Service Worker Sécurisé**
- Cache validation
- Pas de stockage sensible
- Contrôle des permissions explicite

## 📊 Performance

| Métrique | Valeur |
|----------|--------|
| Temps de démarrage | < 2 sec |
| Taille du cache | 50 MB |
| Historique géoloc | 50 positions |
| Réactivité GPS | 5-30 sec |
| Support offline | ✅ Complet |

## 🌐 Compatibilité

### Navigateurs
- ✅ Chrome 45+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 11.3+
- ✅ Samsung Internet

### Systèmes d'exploitation
- ✅ Android 5+
- ✅ iOS 13+
- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Linux

## 🚀 Étapes de Déploiement

### 1. Préparation
```bash
# Vérifier HTTPS
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

### 2. Copier les fichiers
```bash
# Copier sur le serveur
scp -r sig-senegal_cmwd/* user@server:/var/www/html/
```

### 3. Configurer le serveur
```bash
# Apache
sudo a2enmod rewrite headers
sudo systemctl reload apache2

# Nginx
sudo nginx -s reload
```

### 4. Tester
```
https://votre-domaine.com/
DevTools (F12) → Application → Manifest
```

## 🐛 Dépannage

### "La localisation ne fonctionne pas"
- ✅ Vérifier permission GPS
- ✅ Activer GPS sur téléphone
- ✅ Être en extérieur
- ✅ Attendre 10-30 secondes

### "L'app n'apparaît pas à l'installation"
- ✅ Rechargez la page
- ✅ Vérifier HTTPS
- ✅ Vérifier manifest.json
- ✅ Vider le cache

### "Service Worker ne s'enregistre pas"
- ✅ HTTPS obligatoire
- ✅ manifest.json accessible
- ✅ DevTools → Application → Clear site data
- ✅ Recharger

## 📞 Support

### Documentation
- 📘 Voir les fichiers .md dans le projet
- 📘 Consulter js/API_USAGE.js pour exemples

### Débogage
- 🔧 F12 → Console (messages d'erreur)
- 🔧 F12 → Application → Service Workers
- 🔧 F12 → Application → Cache Storage

## 🎯 Prochaines Étapes

### À court terme
1. ✅ Déployer sur serveur HTTPS
2. ✅ Tester sur Android/iOS réels
3. ✅ Lire les guides d'utilisation
4. ✅ Installer sur l'écran d'accueil

### À long terme
1. 🔮 Intégrer une API backend
2. 🔮 Ajouter plus de couches de données
3. 🔮 Implémenter des alertes
4. 🔮 Créer des rapports personnalisés
5. 🔮 Partager les trajets

## 📄 Licence

Cette application est libre d'utilisation et de modification.

## 👨‍💻 Auteur

Créée pour : **SIG Sénégal - Expert Vision Pro**  
Version : **1.0.0**  
Date : **Janvier 2026**

## 🙏 Remerciements

- Leaflet.js pour la cartographie
- OpenStreetMap pour les données
- Bootstrap pour l'UI
- La communauté PWA

---

**✨ Transformez votre application web en une véritable application mobile!**

Prêt à commencer? Consultez [PWA_GUIDE.md](PWA_GUIDE.md) pour le guide complet!

