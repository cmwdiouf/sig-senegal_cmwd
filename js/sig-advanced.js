/**
 * Module SIG Avancé pour SIG Sénégal
 * Recherche, filtres, statistiques spatiales
 */

const SIG_ADVANCED = (() => {
  let state = {
    features: {},
    searchIndex: [],
    filters: {
      regions: null,
      departements: null,
      routes: null,
      localites: null
    }
  };

  let map = null;
  let layers = {};

  /**
   * Initialisation
   */
  function init(mapInstance, layersReference) {
    map = mapInstance;
    layers = layersReference;

    console.log('[SIG_ADVANCED] Initialisation...');
    
    buildSearchIndex();
    setupAdvancedSearch();
    setupRealTimeFilter();
    setupSpatialStats();
    setupDataExport();

    console.log('[SIG_ADVANCED] Prêt');
  }

  /**
   * Construire un index de recherche
   */
  function buildSearchIndex() {
    const index = [];

    // Index des régions
    if (window.json_Region_1) {
      window.json_Region_1.features.forEach(feature => {
        index.push({
          type: 'région',
          name: feature.properties.Région,
          feature: feature,
          layer: 'regions'
        });
      });
    }

    // Index des localités
    if (window.json_localites_5) {
      window.json_localites_5.features.forEach(feature => {
        index.push({
          type: 'localité',
          name: feature.properties.NOM || 'Inconnue',
          feature: feature,
          layer: 'localites'
        });
      });
    }

    // Index des départements
    if (window.json_Departement_2) {
      window.json_Departement_2.features.forEach(feature => {
        index.push({
          type: 'département',
          name: feature.properties.Département || 'Inconnue',
          feature: feature,
          layer: 'departements'
        });
      });
    }

    state.searchIndex = index;
    console.log(`[SIG_ADVANCED] Index construit: ${index.length} features`);
  }

  /**
   * Recherche avancée
   */
  function setupAdvancedSearch() {
    const searchInput = document.getElementById('map-search');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(e.target.value);
      }, 300);
    });

    // Autocomplete
    searchInput.addEventListener('focus', () => {
      showSearchSuggestions();
    });
  }

  /**
   * Effectuer une recherche
   */
  function performSearch(query) {
    if (!query || query.length < 2) {
      hideSearchResults();
      return;
    }

    const results = state.searchIndex.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    displaySearchResults(results, query);
  }

  /**
   * Afficher les résultats de recherche
   */
  function displaySearchResults(results, query) {
    const container = document.createElement('div');
    container.className = 'search-results-dropdown';
    container.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-height: 300px;
      overflow-y: auto;
      z-index: 999;
      margin-top: 4px;
    `;

    if (results.length === 0) {
      container.innerHTML = `
        <div style="padding:12px; text-align:center; color:#94a3b8;">
          <i class="fas fa-search me-2"></i>
          Aucun résultat pour "${query}"
        </div>
      `;
    } else {
      results.slice(0, 8).forEach(result => {
        const item = document.createElement('div');
        item.style.cssText = `
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.2s;
        `;
        item.textContent = `${result.name} (${result.type})`;
        item.onmouseover = () => item.style.background = '#f8fafc';
        item.onmouseout = () => item.style.background = 'white';
        item.onclick = () => selectSearchResult(result);
        container.appendChild(item);
      });
    }

    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
      const existing = searchContainer.querySelector('.search-results-dropdown');
      if (existing) existing.remove();
      searchContainer.appendChild(container);
    }
  }

  /**
   * Sélectionner un résultat de recherche
   */
  function selectSearchResult(result) {
    if (!map) return;

    const feature = result.feature;
    const geometry = feature.geometry;

    if (geometry.type === 'Point') {
      const coords = geometry.coordinates;
      map.setView([coords[1], coords[0]], 14);
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      // Calculer les limites
      const coordinates = geometry.type === 'Polygon' 
        ? geometry.coordinates[0] 
        : geometry.coordinates[0][0];
      
      const lats = coordinates.map(c => c[1]);
      const lons = coordinates.map(c => c[0]);
      const bounds = [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];
      
      map.fitBounds(bounds);
    }

    hideSearchResults();
    MOBILE_UI.showBottomNotification(`Affichage: ${result.name}`);
  }

  function hideSearchResults() {
    const dropdown = document.querySelector('.search-results-dropdown');
    if (dropdown) dropdown.remove();
  }

  function showSearchSuggestions() {
    const suggestions = state.searchIndex.slice(0, 5);
    const container = document.createElement('div');
    container.innerHTML = suggestions.map(s => 
      `<div style="padding:8px 12px; color:#94a3b8; font-size:0.9rem;">
        <i class="fas fa-${s.type === 'région' ? 'map' : s.type === 'localité' ? 'circle' : 'road'} me-2"></i>
        ${s.name}
      </div>`
    ).join('');
    
    // Display logic similar to displaySearchResults
  }

  /**
   * Filtres en temps réel
   */
  function setupRealTimeFilter() {
    const filterContainer = document.getElementById('layers-control-list');
    if (!filterContainer) return;

    // Les checkboxes existent déjà, ajouter des listeners
    const checkboxes = filterContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });
  }

  function applyFilters() {
    console.log('[SIG_ADVANCED] Filtres appliqués');
    // Les filtres sont déjà gérés par le code existant
  }

  /**
   * Statistiques spatiales
   */
  function setupSpatialStats() {
    updateStats();
  }

  function updateStats() {
    if (!map) return;

    const bounds = map.getBounds();
    let regionCount = 0;
    let localityCount = 0;

    // Compter les régions visibles
    if (window.json_Region_1) {
      regionCount = window.json_Region_1.features.filter(f => {
        const coords = getFeatureCenter(f);
        return coords && bounds.contains(L.latLng(coords[1], coords[0]));
      }).length;
    }

    // Compter les localités visibles
    if (window.json_localites_5) {
      localityCount = window.json_localites_5.features.filter(f => {
        const coords = f.geometry.coordinates;
        return bounds.contains(L.latLng(coords[1], coords[0]));
      }).length;
    }

    const statsElement = document.getElementById('visible-features');
    if (statsElement) {
      statsElement.innerHTML = `
        <small class="text-muted">
          <strong>${regionCount}</strong> région(s) · 
          <strong>${localityCount}</strong> localité(s) visibles
        </small>
      `;
    }
  }

  function getFeatureCenter(feature) {
    const geometry = feature.geometry;
    if (geometry.type === 'Point') {
      return geometry.coordinates;
    } else if (geometry.type === 'Polygon') {
      // Centroïde simplifié
      const coords = geometry.coordinates[0];
      const sumLat = coords.reduce((sum, c) => sum + c[1], 0);
      const sumLon = coords.reduce((sum, c) => sum + c[0], 0);
      return [sumLon / coords.length, sumLat / coords.length];
    }
    return null;
  }

  /**
   * Export de données
   */
  function setupDataExport() {
    const exportBtn = document.getElementById('export-data');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
      const data = {
        timestamp: new Date().toISOString(),
        regions: window.json_Region_1?.features.length || 0,
        departements: window.json_Departement_2?.features.length || 0,
        routes: window.json_Routes_4?.features.length || 0,
        localites: window.json_localites_5?.features.length || 0,
        mapBounds: map ? map.getBounds() : null
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sig-senegal-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      MOBILE_UI.showBottomNotification('✓ Données exportées');
    });
  }

  /**
   * API publique
   */
  return {
    init,
    performSearch,
    selectSearchResult,
    updateStats
  };
})();
