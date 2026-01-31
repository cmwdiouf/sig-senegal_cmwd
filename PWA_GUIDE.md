# SIG Sénégal - Progressive Web App (PWA)

## 📱 Application Mobile Installable

Cette application est maintenant une **Progressive Web App (PWA)** moderne qui peut être installée directement sur votre téléphone (Android et iOS) sans passer par PlayStore ou AppStore.

## 🚀 Fonctionnalités Principales

### 1. **Installation Mobile**
- ✅ Installable sur Android et iOS
- ✅ Accès directe depuis l'écran d'accueil
- ✅ Fonctionne hors ligne grâce au cache intelligent
- ✅ Mises à jour automatiques

### 2. **Géolocalisation GPS**
- 📍 Localisation précise en temps réel
- 🎯 Affichage de la position sur la carte
- 📊 Cercle de précision visuel
- 🗺️ Suivi continu avec trace de déplacement
- 💾 Historique des positions
- 📥 Export des trajets en format GeoJSON
- ⚡ Synchronisation en arrière-plan

### 3. **Fonctionnalités Cartographiques**
- 🗺️ Différentes couches géographiques (Régions, Départements, Routes, Localités)
- 🔍 Recherche rapide par localité ou région
- 🎨 Fonds de carte multiples (OSM, Topographique, Satellite, Dark)
- 📏 Outils de mesure et calcul de surface
- 🏷️ Clusters de marqueurs pour les localités

### 4. **Mode Hors Ligne**
- 📂 Cache intelligent des ressources
- 🔄 Synchronisation automatique quand disponible
- 🔌 Statut en ligne/hors ligne visible

## 📲 Installation

### Sur Android

1. **Via navigateur Chrome/Edge:**
   - Ouvrez l'application dans le navigateur
   - Cliquez sur le menu (⋮) → "Installer l'application"
   - L'app apparaîtra sur l'écran d'accueil

2. **Via écran de bienvenue:**
   - Une bannière d'installation s'affichera au premier accès
   - Cliquez sur "Installer"

### Sur iOS (iPhone/iPad)

1. **Via Safari:**
   - Ouvrez l'app dans Safari
   - Cliquez sur le bouton "Partage" (↗️)
   - Sélectionnez "Sur l'écran d'accueil"
   - Nommez l'app (ex: "SIG Sénégal")
   - Cliquez sur "Ajouter"

2. **Accès à la position GPS:**
   - À la première utilisation, autorisez l'accès à la localisation
   - Settings → Safari → Localisation (si demandé)

## 🎯 Guide d'Utilisation

### Onglet "Position"

#### Localiser ma position
- Cliquez sur le bouton bleu "Localiser ma position"
- Autorisez l'accès à votre GPS si demandé
- Votre position s'affichera sur la carte avec un marqueur
- Les coordonnées précises s'affichent dans le panneau

#### Démarrer le suivi
- Cliquez sur "Démarrer le suivi"
- Votre position sera suivie en temps réel
- Une trace colorée s'affichera sur la carte
- Le suivi continu permet de voir votre déplacement en direct

#### Arrêter le suivi
- Cliquez sur "Arrêter le suivi" pour terminer
- Les données restent en mémoire

#### Copier les coordonnées
- Cliquez sur "Copier" dans le panneau de position
- Les coordonnées sont copiées dans le presse-papiers

#### Exporter la trace
- Cliquez sur "Exporter la trace"
- Un fichier GeoJSON sera téléchargé
- À utiliser dans QGIS ou tout autre outil SIG

#### Effacer l'historique
- Cliquez sur "Effacer l'historique"
- Confirmer pour supprimer la trace enregistrée

### Autres Onglets

#### Accueil
- Tableau de bord avec statistiques
- Nombre de régions, localités, réseau routier

#### Couches
- Activer/désactiver les différentes couches cartographiques
- Changer le fond de carte

#### Analyse
- Mesurer une distance
- Calculer une surface
- Afficher les propriétés des entités cliquées

#### Légende
- Référence des couleurs et symboles utilisés

## ⚙️ Configuration Technique

### Fichiers de Configuration PWA

**manifest.json**
- Métadonnées de l'application
- Icônes d'installation
- Configurations d'affichage

**sw.js** (Service Worker)
- Cache intelligent avec stratégies multiples
- Synchronisation en arrière-plan
- Notifications push

### Modules JavaScript

**js/geolocation.js**
- Module complet de géolocalisation
- Gestion du suivi en temps réel
- Export de données
- Gestion des permissions

**js/pwa.js**
- Module de gestion PWA
- Enregistrement du Service Worker
- Notifications de mise à jour
- Gestion du cache

**js/labels.js** et autres
- Ressources cartographiques existantes

## 🔐 Autorisations Requises

### Android
- **Localisation**: Pour le GPS et le suivi
- **Stockage**: Pour le cache hors ligne (automatique)

### iOS
- **Localisation**: Pour le GPS et le suivi
- **Notifications**: Pour les alertes (optionnel)

## 🌐 Connectivité

### En ligne
- Les mises à jour de cache se font automatiquement
- Les données en cache sont utilisées en priorité pour plus de rapidité

### Hors ligne
- L'app fonctionne complètement hors ligne
- Les données en cache sont utilisées
- La géolocalisation fonctionne toujours
- Les modifications sont synchronisées au retour en ligne

## 🔄 Mises à Jour

L'application vérifie automatiquement les mises à jour:
- Toutes les heures dans l'app
- À chaque visite du navigateur

Une notification s'affichera si une mise à jour est disponible.

## 🐛 Dépannage

### "La localisation ne fonctionne pas"
- ✅ Vérifiez que vous avez autorisé l'accès GPS
- ✅ Activez le GPS sur votre téléphone
- ✅ Assurez-vous que vous êtes en extérieur (meilleur signal)
- ✅ Attendez 10-30 secondes pour la première localisation

### "L'app n'apparaît pas à l'installation"
- ✅ Rechargez la page
- ✅ Utilisez le navigateur recommandé (Chrome, Edge, Safari)
- ✅ Vérifiez que manifest.json est accessible

### "Le suivi s'arrête"
- ✅ Vérifiez votre batterie (mode économie?)
- ✅ Assurez-vous que l'app n'a pas été fermée
- ✅ Revérifiez les permissions de localisation

### "Le cache n'est pas à jour"
- ✅ Videz le cache depuis les paramètres
- ✅ Forcer actualisation: Ctrl+Maj+R (Windows) ou Cmd+Shift+R (Mac)

## 📊 Spécifications Techniques

### Navigateurs Supportés
- ✅ Chrome 45+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 11.3+ (iOS 13+)
- ✅ Samsung Internet

### Taille de l'App
- ~15 MB (après installation)
- ~50 MB (avec cache complet)

### Performance
- Temps de démarrage: < 2 secondes
- Réactivité GPS: 5-30 secondes (selon conditions)
- Taille du cache de géolocalisation: Jusqu'à 50 positions

## 🔗 Ressources Externes

- Leaflet.js: Bibliothèque cartographique
- Bootstrap 5: Framework UI
- Font Awesome: Icônes
- OpenStreetMap: Données de base

## 📝 Notes

### Confidentialité
- Les données de géolocalisation restent **locales** sur votre appareil
- Aucune transmission de position au serveur sans votre consentement
- Le cache peut être vidé à tout moment

### Batterie
- Le suivi GPS consomme l'énergie
- Désactivez le suivi quand il n'est pas nécessaire
- Le mode économie d'énergie affecte la précision GPS

### Précision
- Précision typique: 5-15 mètres
- Meilleure en extérieur
- Affectée par: bâtiments, tunnels, mauvais météo

## 👨‍💻 Développement

### Modification de la configuration

Editez les fichiers:
- `manifest.json` - Métadonnées
- `js/geolocation.js` - Options de géolocalisation (lignes 17-27)
- `js/pwa.js` - Comportement PWA

### Test en développement

```bash
# Servir localement
python -m http.server 8000

# Acceder à
http://localhost:8000
```

## 📧 Support

Pour toute question ou problème, consultez:
1. Les logs du navigateur (F12 → Console)
2. Les logs du Service Worker (Chrome DevTools → Application → Service Workers)
3. Le fichier cache (Chrome DevTools → Application → Cache Storage)

---

**Version**: 1.0.0  
**Dernière mise à jour**: Janvier 2026  
**License**: Libre d'utilisation
