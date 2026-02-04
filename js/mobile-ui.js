/**
 * Module UI Mobile Avancé pour SIG Sénégal
 * Gère les interactions mobiles optimisées
 */

const MOBILE_UI = (() => {
  const config = {
    minSwipeDistance: 50,
    doubleTapDelay: 300,
    hapticFeedback: true,
    orientationLock: false
  };

  let state = {
    lastTapTime: 0,
    lastX: 0,
    lastY: 0,
    touchInProgress: false
  };

  /**
   * Initialisation du module UI mobile
   */
  function init() {
    console.log('[MOBILE_UI] Initialisation...');
    
    setupOrientationHandling();
    setupFullscreenSupport();
    setupTouchOptimizations();
    setupStatusBar();
    setupBottomSheetBehavior();
    
    console.log('[MOBILE_UI] Prêt');
  }

  /**
   * Gestion de l'orientation écran
   */
  function setupOrientationHandling() {
    window.addEventListener('orientationchange', () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      document.documentElement.setAttribute('data-orientation', orientation);
      
      setTimeout(() => {
        if (window.SIG_MAP) {
          window.SIG_MAP.invalidateSize();
        }
      }, 100);
    });

    // Détection initiale
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    document.documentElement.setAttribute('data-orientation', orientation);
  }

  /**
   * Support Fullscreen API
   */
  function setupFullscreenSupport() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'tool-btn';
    fullscreenBtn.title = 'Plein écran';
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    const toolsContainer = document.querySelector('.map-tools');
    if (toolsContainer) {
      toolsContainer.appendChild(fullscreenBtn);
    }
  }

  /**
   * Toggle fullscreen
   */
  function toggleFullscreen() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    if (!document.fullscreenElement) {
      mapElement.requestFullscreen().catch(err => {
        console.warn('[MOBILE_UI] Fullscreen échoué:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * Optimisations tactiles
   */
  function setupTouchOptimizations() {
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('touchend', handleTouchEnd, false);
  }

  function handleTouchStart(e) {
    state.touchInProgress = true;
    state.lastX = e.touches[0].clientX;
    state.lastY = e.touches[0].clientY;
    state.lastTapTime = Date.now();
  }

  function handleTouchMove(e) {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const deltaX = Math.abs(currentX - state.lastX);
    const deltaY = Math.abs(currentY - state.lastY);

    // Désactiver le double-tap-to-zoom si mouvement
    if (deltaX > 10 || deltaY > 10) {
      state.touchInProgress = false;
    }
  }

  function handleTouchEnd(e) {
    if (!state.touchInProgress) return;

    const currentTime = Date.now();
    const timeDiff = currentTime - state.lastTapTime;

    // Double-tap pour zoomer
    if (timeDiff < config.doubleTapDelay) {
      const mapElement = document.getElementById('map');
      if (mapElement && mapElement.contains(e.target)) {
        const zoomLevel = window.SIG_MAP?.getZoom() || 7;
        window.SIG_MAP?.setZoom(zoomLevel + 1);
        haptic('medium');
      }
    }

    state.touchInProgress = false;
  }

  /**
   * Gestion de la barre de statut (iOS)
   */
  function setupStatusBar() {
    // Ajouter du padding pour les safe areas
    if (window.navigator.standalone) {
      const sidebar = document.querySelector('.sidebar');
      const navbar = document.getElementById('top-navbar');
      
      if (sidebar) {
        sidebar.style.paddingTop = 'max(10px, env(safe-area-inset-top))';
      }
      if (navbar) {
        navbar.style.paddingTop = 'max(10px, env(safe-area-inset-top))';
      }
    }
  }

  /**
   * Gestion bottom sheet (mobile)
   */
  function setupBottomSheetBehavior() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Sur mobile, afficher le sidebar comme bottom sheet
    if (window.innerWidth < 768) {
      sidebar.style.position = 'fixed';
      sidebar.style.bottom = '0';
      sidebar.style.height = '70vh';
      sidebar.style.width = '100%';
      sidebar.style.borderRight = 'none';
      sidebar.style.borderTop = '1px solid #e2e8f0';
    }
  }

  /**
   * Feedback haptique
   */
  function haptic(type = 'light') {
    if (!config.hapticFeedback) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
      success: [10, 30, 10]
    };

    if (navigator.vibrate) {
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }

  /**
   * Afficher notification bottom
   */
  function showBottomNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'bottom-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: white;
      padding: 12px 20px;
      border-radius: 24px;
      z-index: 2000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideUp 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideDown 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  /**
   * API publique
   */
  return {
    init,
    toggleFullscreen,
    haptic,
    showBottomNotification,
    getOrientation: () => document.documentElement.getAttribute('data-orientation')
  };
})();

// Auto-init au chargement DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', MOBILE_UI.init);
} else {
  MOBILE_UI.init();
}
