/**
 * Module PWA avancé pour SIG Sénégal
 * Gère l'installation, les notifications, le cache et la synchronisation
 */

const PWA_ADVANCED = (() => {
  let swRegistration = null;
  let deferredPrompt = null;
  let updateAvailable = false;

  const config = {
    swPath: '/sig-senegal_cmwd/sw-v2.js',
    swScope: '/sig-senegal_cmwd/',
    maxCacheSize: 100 * 1024 * 1024, // 100MB
  };

  /**
   * Initialise le module PWA
   */
  async function init() {
    console.log('[PWA] Initialisation avancée...');

    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register(config.swPath, {
          scope: config.swScope,
          updateViaCache: 'none'
        });
        console.log('[PWA] Service Worker enregistré:', swRegistration);
        
        // Écouteur pour les mises à jour
        swRegistration.addEventListener('updatefound', handleUpdateFound);
        
        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
          if (swRegistration) {
            swRegistration.update();
          }
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error('[PWA] Erreur enregistrement SW:', error);
      }
    }

    // Événements de connexion
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Événement d'installation
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Messages du SW
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Créer la bannière d'installation
    createInstallBanner();

    // Initialiser les permissions
    requestPermissions();

    return {
      install: installApp,
      isInstallable: () => !!deferredPrompt,
      updateApp,
      clearCache,
      getCacheSize,
      getStatus,
      requestPermissions,
      showNotification,
      syncData
    };
  }

  /**
   * Avant l'invite d'installation
   */
  function handleBeforeInstallPrompt(e) {
    console.log('[PWA] App prête à être installée');
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  }

  /**
   * Application installée
   */
  function handleAppInstalled() {
    console.log('[PWA] App installée');
    deferredPrompt = null;
    hideInstallBanner();
    showNotification('Application installée', 
      'SIG Sénégal est maintenant accessible depuis votre écran d\'accueil!', 
      { icon: '✓', tag: 'install', duration: 5000 });
  }

  /**
   * Mise à jour trouvée
   */
  function handleUpdateFound() {
    const newWorker = swRegistration.installing;
    console.log('[PWA] Nouvelle version SW détectée');

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        updateAvailable = true;
        showUpdateBanner();
      }
    });
  }

  /**
   * En ligne
   */
  function handleOnline() {
    console.log('[PWA] En ligne');
    updateOnlineStatus(true);
    showNotification('Connecté', 'Vous êtes maintenant en ligne', { duration: 2000 });
    
    // Synchroniser les données
    if ('sync' in swRegistration) {
      swRegistration.sync.register('sync-locations');
    }
  }

  /**
   * Hors ligne
   */
  function handleOffline() {
    console.log('[PWA] Hors ligne');
    updateOnlineStatus(false);
    showNotification('Hors ligne', 'Vous êtes hors ligne. Les données en cache seront utilisées.', 
      { icon: '📡', duration: 3000 });
  }

  /**
   * Messages du Service Worker
   */
  function handleServiceWorkerMessage(event) {
    const { type, data } = event.data || {};
    console.log('[PWA] Message SW:', type, data);

    switch (type) {
      case 'UPDATE_AVAILABLE':
        showUpdateBanner();
        break;
      case 'CACHE_UPDATED':
        console.log('[PWA] Cache mis à jour');
        break;
      case 'OFFLINE_READY':
        showNotification('Application prête', 'Vous pouvez utiliser l\'app hors ligne');
        break;
    }
  }

  /**
   * Bannière d'installation
   */
  function createInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = `
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 16px;
      padding-bottom: max(16px, env(safe-area-inset-bottom));
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div style="flex: 1;">
          <strong style="display: block; margin-bottom: 4px;">📱 Installer SIG Sénégal</strong>
          <small style="opacity: 0.9; display: block;">Accédez à votre application directement depuis l'écran d'accueil</small>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="pwa-install-btn" style="
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            white-space: nowrap;
          ">Installer</button>
          <button id="pwa-dismiss-btn" style="
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            white-space: nowrap;
          ">Fermer</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', installApp);
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      banner.style.display = 'none';
      localStorage.setItem('pwa-install-dismissed', Date.now());
    });
  }

  /**
   * Afficher la bannière d'installation
   */
  function showInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner && !localStorage.getItem('pwa-install-dismissed')) {
      banner.style.display = 'block';
    }
  }

  /**
   * Cacher la bannière d'installation
   */
  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  }

  /**
   * Bannière de mise à jour
   */
  function showUpdateBanner() {
    if (document.getElementById('pwa-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.style.cssText = `
      position: fixed;
      top: 65px;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 12px 16px;
      padding-top: max(12px, env(safe-area-inset-top));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 9998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    `;

    banner.innerHTML = `
      <span><strong>🔄 Mise à jour disponible</strong> - Nouvel contenu prêt à télécharger</span>
      <div style="display: flex; gap: 8px;">
        <button onclick="PWA_ADVANCED.updateApp()" style="
          background: white;
          color: #d97706;
          border: none;
          padding: 6px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        ">Mettre à jour</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 6px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        ">Plus tard</button>
      </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
  }

  /**
   * Installer l'application
   */
  async function installApp() {
    if (!deferredPrompt) {
      showNotification('Non disponible', 'Installation non disponible sur cet appareil', 
        { icon: 'ⓘ' });
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Résultat installation:', outcome);
      
      if (outcome === 'accepted') {
        deferredPrompt = null;
      }
    } catch (err) {
      console.error('[PWA] Erreur installation:', err);
    }
  }

  /**
   * Mettre à jour l'application
   */
  function updateApp() {
    if (!swRegistration || !swRegistration.waiting) {
      return;
    }

    // Signaler au SW
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Recharger quand le nouveau SW prend le contrôle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[PWA] Rechargement...');
        window.location.reload();
      }
    });
  }

  /**
   * Mettre à jour l'indicateur de statut en ligne
   */
  function updateOnlineStatus(isOnline) {
    let indicator = document.getElementById('online-status-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'online-status-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 1040;
        transition: all 0.3s;
      `;
      document.body.appendChild(indicator);
    }

    if (isOnline) {
      indicator.textContent = '🟢 En ligne';
      indicator.style.background = '#10b981';
      indicator.style.color = 'white';
    } else {
      indicator.textContent = '🔴 Hors ligne';
      indicator.style.background = '#ef4444';
      indicator.style.color = 'white';
    }
  }

  /**
   * Afficher une notification
   */
  function showNotification(title, message, options = {}) {
    const {
      icon = 'ℹ️',
      tag = 'default',
      duration = 3000,
      type = 'info'
    } = options;

    const notif = document.createElement('div');
    notif.className = `pwa-notification pwa-notification-${type}`;
    notif.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: white;
      border-left: 4px solid #10b981;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 320px;
      animation: slideInRight 0.3s ease-out;
    `;

    if (type === 'error') {
      notif.style.borderLeftColor = '#ef4444';
    } else if (type === 'warning') {
      notif.style.borderLeftColor = '#f59e0b';
    } else if (type === 'success') {
      notif.style.borderLeftColor = '#10b981';
    }

    notif.innerHTML = `
      <strong style="display: block; margin-bottom: 4px;">${icon} ${title}</strong>
      <small style="color: #666; display: block;">${message}</small>
    `;

    document.body.appendChild(notif);

    // Animation CSS
    if (!document.querySelector('style[data-pwa-animations]')) {
      const style = document.createElement('style');
      style.setAttribute('data-pwa-animations', '');
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Auto-suppression
    if (duration > 0) {
      setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
      }, duration);
    }
  }

  /**
   * Vider le cache
   */
  async function clearCache() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] Cache vidé');
      showNotification('Cache vidé', 'Tous les fichiers en cache ont été supprimés', 
        { type: 'success', icon: '✓' });
      return true;
    } catch (err) {
      console.error('[PWA] Erreur vidage cache:', err);
      return false;
    }
  }

  /**
   * Obtenir la taille du cache
   */
  async function getCacheSize() {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return totalSize;
    } catch (err) {
      console.error('[PWA] Erreur calcul cache:', err);
      return 0;
    }
  }

  /**
   * Demander les permissions
   */
  async function requestPermissions() {
    // Notification
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('[PWA] Permission notifications:', permission);
      } catch (err) {
        console.warn('[PWA] Notifications non disponibles:', err);
      }
    }

    // Géolocalisation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => console.log('[PWA] Accès géolocalisation autorisé'),
        (err) => console.warn('[PWA] Accès géolocalisation refusé:', err),
        { timeout: 5000 }
      );
    }
  }

  /**
   * Obtenir le statut
   */
  function getStatus() {
    return {
      installed: !deferredPrompt,
      updateAvailable,
      online: navigator.onLine,
      hasServiceWorker: !!swRegistration,
      swActive: swRegistration?.active?.state === 'activated'
    };
  }

  /**
   * Synchroniser les données (BackgroundSync)
   */
  async function syncData() {
    if (!swRegistration || !('sync' in swRegistration)) {
      console.warn('[PWA] BackgroundSync non supporté');
      return;
    }

    try {
      await swRegistration.sync.register('sync-data');
      console.log('[PWA] Sync enregistré');
      showNotification('Synchronisation', 'Vos données seront synchronisées');
    } catch (err) {
      console.error('[PWA] Erreur sync:', err);
    }
  }

  // Initialiser au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API publique
  return {
    init,
    install: installApp,
    update: updateApp,
    clearCache,
    getCacheSize,
    getStatus,
    showNotification,
    requestPermissions,
    syncData,
    isInstallable: () => !!deferredPrompt
  };
})();

// Exposer globalement
window.PWA_ADVANCED = PWA_ADVANCED;
console.log('[PWA] Module avancé chargé');
