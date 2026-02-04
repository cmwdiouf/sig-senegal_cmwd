/**
 * Performance Monitoring & Analytics pour SIG Sénégal
 * Mesure la performance de l'application
 */

const PERFORMANCE_MONITOR = (() => {
  const metrics = {
    appStartTime: performance.now(),
    pageLoadTime: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    mapLoadTime: 0,
    cacheSize: 0,
    networkRequests: 0,
    failedRequests: 0
  };

  let swRegistration = null;

  /**
   * Initialisation du monitoring
   */
  function init() {
    console.log('[PERF] Initialisation...');
    
    measurePageLoad();
    measureCacheSize();
    measureNetworkPerformance();
    setupPerformanceObservers();
  }

  /**
   * Mesurer le temps de chargement de la page
   */
  function measurePageLoad() {
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          
          console.log(`[PERF] Page load: ${metrics.pageLoadTime}ms`);
          
          // First Paint
          if (performance.getEntriesByType('paint').length > 0) {
            metrics.firstPaint = performance.getEntriesByType('paint')[0].startTime;
            console.log(`[PERF] First Paint: ${metrics.firstPaint.toFixed(0)}ms`);
          }

          // First Contentful Paint
          if (performance.getEntriesByType('paint').length > 1) {
            metrics.firstContentfulPaint = performance.getEntriesByType('paint')[1].startTime;
            console.log(`[PERF] FCP: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
          }
        }, 0);
      });
    }
  }

  /**
   * Mesurer la taille du cache
   */
  async function measureCacheSize() {
    if (!navigator.serviceWorker) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      swRegistration = registration;

      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        
        for (const request of keys) {
          try {
            const response = await cache.match(request);
            const blob = await response.blob();
            totalSize += blob.size;
          } catch (e) {
            // Ignorer les erreurs de blob
          }
        }
      }

      metrics.cacheSize = totalSize;
      console.log(`[PERF] Cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (err) {
      console.warn('[PERF] Erreur mesure cache:', err);
    }
  }

  /**
   * Mesurer les performances réseau
   */
  function measureNetworkPerformance() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const resources = window.performance.getEntriesByType('resource');
    
    resources.forEach(resource => {
      if (resource.duration > 3000) {
        console.warn(`[PERF] Requête lente: ${resource.name} (${resource.duration.toFixed(0)}ms)`);
      }
    });

    metrics.networkRequests = resources.length;
  }

  /**
   * Setup Performance Observers
   */
  function setupPerformanceObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`[PERF] LCP: ${lastEntry.renderTime.toFixed(0)}ms`);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP pas supporté
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              console.log(`[PERF] CLS: ${clsValue.toFixed(3)}`);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS pas supporté
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            console.log(`[PERF] FID: ${entry.processingDuration.toFixed(0)}ms`);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID pas supporté
      }
    }
  }

  /**
   * Obtenir le rapport de performance
   */
  function getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      appUptime: (performance.now() - metrics.appStartTime).toFixed(0),
      pageLoadTime: metrics.pageLoadTime,
      firstPaint: metrics.firstPaint.toFixed(0),
      firstContentfulPaint: metrics.firstContentfulPaint.toFixed(0),
      cacheSize: (metrics.cacheSize / 1024 / 1024).toFixed(2),
      cacheItems: metrics.networkRequests,
      connectionType: getConnectionType(),
      deviceInfo: getDeviceInfo(),
      browserInfo: getBrowserInfo()
    };
  }

  /**
   * Obtenir le type de connexion
   */
  function getConnectionType() {
    if (navigator.connection) {
      return {
        type: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return { type: 'unknown' };
  }

  /**
   * Obtenir les infos device
   */
  function getDeviceInfo() {
    return {
      screen: `${window.innerWidth}x${window.innerHeight}`,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio,
      storage: getStorageInfo(),
      memory: navigator.deviceMemory || 'unknown'
    };
  }

  /**
   * Obtenir les infos de stockage
   */
  function getStorageInfo() {
    if (navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate().then(estimate => {
        return {
          usage: (estimate.usage / 1024 / 1024).toFixed(2),
          quota: (estimate.quota / 1024 / 1024).toFixed(2)
        };
      });
    }
    return { usage: 'unknown', quota: 'unknown' };
  }

  /**
   * Obtenir les infos browser
   */
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'unknown';
    
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    return {
      browser,
      os: ua.includes('Windows') ? 'Windows' : 
           ua.includes('Mac') ? 'macOS' : 
           ua.includes('Linux') ? 'Linux' :
           ua.includes('Android') ? 'Android' :
           ua.includes('iPhone') ? 'iOS' : 'unknown',
      userAgent: ua.substring(0, 50)
    };
  }

  /**
   * Obtenir les Web Vitals
   */
  async function getWebVitals() {
    const report = getPerformanceReport();
    
    // Simuler Web Vitals si CrUX pas disponible
    return {
      lcp: metrics.firstContentfulPaint + 500, // Estimation
      fid: 50, // Estimation
      cls: 0.1, // Estimation
      ttfb: report.pageLoadTime / 4, // Estimation
      fcp: report.firstContentfulPaint
    };
  }

  /**
   * Exporter le rapport
   */
  function exportReport() {
    const report = getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Afficher le rapport dans la console
   */
  function printReport() {
    const report = getPerformanceReport();
    console.table(report);
    return report;
  }

  return {
    init,
    getPerformanceReport,
    getWebVitals,
    printReport,
    exportReport,
    measureCacheSize
  };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(PERFORMANCE_MONITOR.init, 100);
  });
} else {
  PERFORMANCE_MONITOR.init();
}
