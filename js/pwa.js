/**
 * Module PWA pour SIG Sénégal
 * Gère l'enregistrement du service worker et les fonctionnalités PWA
 */

const PWA_MODULE = (() => {
  let swRegistration = null;
  let updateAvailable = false;

  /**
   * Initialise les fonctionnalités PWA
   */
  async function init() {
    console.log('[PWA] Initialisation...');

    // Enregistrer le service worker (sw-v2 avec meilleure gestion du cache)
    if ('serviceWorker' in navigator) {
      try {
        // Déterminer le chemin correct pour GitHub Pages ou localhost
        const swPath = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? './sw-v2.js' 
          : '/sig-senegal_cmwd/sw-v2.js';
        
        const scope = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? './'
          : '/sig-senegal_cmwd/';

        swRegistration = await navigator.serviceWorker.register(swPath, {
          scope: scope,
          updateViaCache: 'none'
        });

        console.log('[PWA] Service Worker enregistré:', swRegistration);

        // Vérifier les mises à jour
        swRegistration.addEventListener('updatefound', handleUpdateFound);

        // Écouter les messages du service worker
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

        // Afficher une notification si une mise à jour est disponible
        if (swRegistration.waiting) {
          updateAvailable = true;
          showUpdatePrompt();
        }

      } catch (error) {
        console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
      }
    }

    // Écouter les changements de connectivité
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Configurer les événements d'installation
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Vérifier les mises à jour du Service Worker toutes les heures
    setInterval(() => {
      if (swRegistration) {
        swRegistration.update();
      }
    }, 60 * 60 * 1000);

    return {
      isInstallable: () => !!deferredPrompt,
      install: installApp,
      uninstall: uninstallApp,
      getStatus: getStatus,
      updateApp: updateApp,
      clearCache: clearCache
    };
  }

  let deferredPrompt = null;

  /**
   * Gère l'événement beforeinstallprompt
   */
  function handleBeforeInstallPrompt(e) {
    console.log('[PWA] App prête à être installée');
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  }

  /**
   * Gère l'événement appinstalled
   */
  function handleAppInstalled() {
    console.log('[PWA] App installée avec succès');
    deferredPrompt = null;
    showNotification('Application installée', 'SIG Sénégal est maintenant installée sur votre appareil!');
  }

  /**
   * Affiche l'invite d'installation
   */
  function showInstallPrompt() {
    const banner = document.getElementById('install-banner');
    if (!banner) {
      createInstallBanner();
    }

    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', installApp);
    }
  }

  /**
   * Crée la bannière d'installation si elle n'existe pas
   */
  function createInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 9999;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    banner.innerHTML = `
      <div style="flex-grow: 1;">
        <strong>Installer SIG Sénégal</strong>
        <p style="margin: 5px 0 0 0; font-size: 0.9em; opacity: 0.9;">
          Accédez à votre application directement depuis l'écran d'accueil
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="install-app-btn" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s;
        ">Installer</button>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.2s;
        ">Fermer</button>
      </div>
    `;

    document.body.appendChild(banner);
  }

  /**
   * Installe l'application
   */
  async function installApp() {
    if (!deferredPrompt) {
      console.warn('[PWA] Installation non disponible');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Installation utilisateur: ${outcome}`);

    if (outcome === 'accepted') {
      deferredPrompt = null;
    }
  }

  /**
   * Désinstalle l'application
   */
  function uninstallApp() {
    if (swRegistration) {
      swRegistration.unregister()
        .then(() => {
          console.log('[PWA] Service Worker désenregistré');
          clearCache();
        })
        .catch((error) => {
          console.error('[PWA] Erreur lors de la désinscription:', error);
        });
    }
  }

  /**
   * Gère la détection d'une mise à jour disponible
   */
  function handleUpdateFound() {
    const newWorker = swRegistration.installing;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Nouvelle version disponible
        updateAvailable = true;
        showUpdatePrompt();
        console.log('[PWA] Mise à jour disponible');
      }
    });
  }

  /**
   * Affiche la notification de mise à jour
   */
  function showUpdatePrompt() {
    const updateBanner = document.getElementById('update-banner');
    if (updateBanner) {
      updateBanner.style.display = 'block';
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
      position: fixed;
      top: 65px;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 9998;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    banner.innerHTML = `
      <span><strong>🔄 Mise à jour disponible</strong> - Nouvel contenu à télécharger</span>
      <div style="display: flex; gap: 10px;">
        <button onclick="PWA_MODULE.updateApp()" style="
          background: white;
          color: #d97706;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s;
        ">Mettre à jour</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.5);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: 0.2s;
        ">Plus tard</button>
      </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
  }

  /**
   * Met à jour l'application
   */
  function updateApp() {
    if (swRegistration && swRegistration.waiting) {
      // Signaler au service worker d'actualiser
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Actualiser la page une fois que le nouveau SW est activé
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] Actualisation de la page...');
          window.location.reload();
        }
      });
    }
  }

  /**
   * Gère les messages du service worker
   */
  function handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    console.log('[PWA] Message du SW:', type, data);

    switch (type) {
      case 'UPDATE_AVAILABLE':
        updateAvailable = true;
        showUpdatePrompt();
        break;
      case 'CACHE_CLEARED':
        console.log('[PWA] Cache nettoyé');
        break;
    }
  }

  /**
   * Gère la reconnexion en ligne
   */
  function handleOnline() {
    console.log('[PWA] Application en ligne');
    showNotification('Connecté', 'Vous êtes maintenant en ligne');

    // Mettre à jour le statut visuel
    updateOnlineStatus(true);

    // Déclencher une synchronisation si disponible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SYNC_DATA' });
    }
  }

  /**
   * Gère la déconnexion hors ligne
   */
  function handleOffline() {
    console.log('[PWA] Application hors ligne');
    showNotification('Hors ligne', 'Vous êtes maintenant hors ligne. Les données en cache seront utilisées.', 5000);

    // Mettre à jour le statut visuel
    updateOnlineStatus(false);
  }

  /**
   * Met à jour le statut en ligne visuel
   */
  function updateOnlineStatus(isOnline) {
    const indicator = document.getElementById('online-indicator');
    if (!indicator) {
      const div = document.createElement('div');
      div.id = 'online-indicator';
      div.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        z-index: 1040;
        transition: all 0.3s;
      `;
      document.body.appendChild(div);
    }

    const indicator2 = document.getElementById('online-indicator');
    if (isOnline) {
      indicator2.textContent = '🟢 En ligne';
      indicator2.style.background = '#10b981';
      indicator2.style.color = 'white';
    } else {
      indicator2.textContent = '🔴 Hors ligne';
      indicator2.style.background = '#ef4444';
      indicator2.style.color = 'white';
    }
  }

  /**
   * Affiche une notification
   */
  function showNotification(title, message, duration = 3000) {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: white;
      border-left: 4px solid #10b981;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;

    notif.innerHTML = `
      <strong style="display: block; margin-bottom: 4px;">${title}</strong>
      <small style="color: #666;">${message}</small>
    `;

    document.body.appendChild(notif);

    // Ajouter l'animation CSS
    if (!document.querySelector('style[data-notif-animation]')) {
      const style = document.createElement('style');
      style.setAttribute('data-notif-animation', '');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notif.remove(), 300);
    }, duration);
  }

  /**
   * Récupère le statut de l'application
   */
  function getStatus() {
    return {
      isInstalled: !!deferredPrompt === false, // Si deferredPrompt est null, c'est qu'elle est installée
      updateAvailable,
      isOnline: navigator.onLine,
      hasServiceWorker: !!swRegistration,
      serviceWorkerState: swRegistration?.active?.state || 'none'
    };
  }

  /**
   * Vide le cache
   */
  async function clearCache() {
    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map((cacheName) => caches.delete(cacheName));
      await Promise.all(deletePromises);
      console.log('[PWA] Tous les caches ont été supprimés');
      showNotification('Cache vidé', 'Tous les fichiers en cache ont été supprimés');
    } catch (error) {
      console.error('[PWA] Erreur lors de la suppression du cache:', error);
    }
  }

  /**
   * Demande les permissions
   */
  async function requestPermissions() {
    const permissions = {
      geolocation: false,
      notification: false
    };

    // Géolocalisation
    try {
      await GEOLOCATION_MODULE.requestLocationPermission();
      permissions.geolocation = true;
    } catch (error) {
      console.warn('[PWA] Géolocalisation refusée:', error);
    }

    // Notifications
    try {
      const result = await Notification.requestPermission();
      permissions.notification = result === 'granted';
    } catch (error) {
      console.warn('[PWA] Notifications refusées:', error);
    }

    return permissions;
  }

  return {
    init,
    updateApp,
    installApp,
    uninstallApp,
    clearCache,
    getStatus,
    requestPermissions,
    showNotification
  };
})();

// Initialiser PWA au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PWA_MODULE.init();
  });
} else {
  PWA_MODULE.init();
}
