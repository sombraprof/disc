/**
 * Módulo para gerenciar controles de visualização e filtros
 * Responsável por botões de grade/lista, filtros de categoria e estado das listas
 */

import { lsGet, lsSet } from './storage.js';

// Estado atual dos controles
let currentView = 'grid'; // 'grid' ou 'list'
let currentFilter = 'all'; // 'all', 'aulas', 'listas'
let currentListFilter = 'all'; // 'all', 'inprogress', 'completed', 'new'

/**
 * Atualiza as classes dos cards baseado no modo de visualização
 */
function updateCardClasses(view) {
  // Para listas: atualizar cards individuais
  const listasCards = document.querySelectorAll('#listas-container a');
  listasCards.forEach(card => {
    const cardContent = card.querySelector('.card-content');
    const cardIcon = card.querySelector('.card-icon');

    if (view === 'grid') {
      card.classList.remove('list-view');
      card.classList.add('grid-view');
      if (cardIcon) cardIcon.classList.add('grid-icon');
      if (cardContent) cardContent.classList.add('grid-content');
    } else {
      card.classList.remove('grid-view');
      card.classList.add('list-view');
      if (cardIcon) cardIcon.classList.remove('grid-icon');
      if (cardContent) cardContent.classList.remove('grid-content');
    }
  });

  // Para aulas: atualizar containers de unidade
  const unitContainers = document.querySelectorAll('#cards-container .group-grid');
  unitContainers.forEach(container => {
    if (view === 'grid') {
      container.className = 'group-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6';
    } else {
      container.className = 'group-grid flex flex-col space-y-4';
    }
  });
}

/**
 * Função para atualizar a visualização (movida para o nível do módulo)
 */
const updateView = (view) => {
  currentView = view;

  const viewGridBtn = document.getElementById('view-grid');
  const viewListBtn = document.getElementById('view-list');
  const cardsContainer = document.getElementById('cards-container');
  const listasContainer = document.getElementById('listas-container');

  if (!viewGridBtn || !viewListBtn || !cardsContainer || !listasContainer) {
    console.warn('Elementos de controle de visualização não encontrados ao atualizar a view');
    return;
  }

  // Atualizar botões ativos
  viewGridBtn.classList.toggle('active', view === 'grid');
  viewListBtn.classList.toggle('active', view === 'list');

  // Atualizar containers
  if (view === 'grid') {
    // Para listas: aplicar grid no container principal
    listasContainer.className = 'mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    // Para aulas: manter lista no container principal, aplicar grid nos grupos de unidade
    cardsContainer.className = 'mt-4 flex flex-col space-y-6';
  } else {
    // Para ambos: aplicar lista
    cardsContainer.className = 'mt-4 flex flex-col space-y-6';
    listasContainer.className = 'mt-4 flex flex-col space-y-4';
  }

  // Atualizar classes dos cards individuais
  updateCardClasses(view);

  // Salvar preferência
  lsSet('viewPreference', view);
};

/**
 * Inicializa todos os controles de visualização
 */
export function setupControls() {
  setupViewToggles();
  setupFilters();
  setupListFilters();
  setupBackToTop();
  loadSavedPreferences();
}

/**
 * Configura os botões de alternância entre grade e lista
 */
function setupViewToggles() {
  const viewGridBtn = document.getElementById('view-grid');
  const viewListBtn = document.getElementById('view-list');

  if (!viewGridBtn || !viewListBtn) {
    console.warn('Elementos de controle de visualização não encontrados');
    return;
  }

  // Event listeners
  viewGridBtn.addEventListener('click', () => updateView('grid'));
  viewListBtn.addEventListener('click', () => updateView('list'));
}

/**
 * Configura os filtros de categoria (Todos/Aulas/Listas)
 */
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-chip[data-filter]');
  const cardsSection = document.getElementById('home');
  const listasSection = document.getElementById('listas');

  if (!filterButtons.length || !cardsSection || !listasSection) {
    console.warn('Elementos de filtro não encontrados');
    return;
  }

  // Função para aplicar filtro
  const applyFilter = (filter) => {
    currentFilter = filter;

    // Atualizar botões ativos
    filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    // Mostrar/ocultar seções
    switch (filter) {
      case 'all':
        cardsSection.style.display = '';
        listasSection.style.display = '';
        break;
      case 'aulas':
        cardsSection.style.display = '';
        listasSection.style.display = 'none';
        break;
      case 'listas':
        cardsSection.style.display = 'none';
        listasSection.style.display = '';
        break;
    }

    // Salvar preferência
    lsSet('filterPreference', filter);
  };

  // Event listeners
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });
}

/**
 * Configura os filtros específicos das listas
 */
function setupListFilters() {
  const listFilterButtons = document.querySelectorAll('.filter-chip[data-list-filter]');
  const listasContainer = document.getElementById('listas-container');

  if (!listFilterButtons.length || !listasContainer) {
    console.warn('Elementos de filtro de listas não encontrados');
    return;
  }

  // Função para aplicar filtro de listas
  const applyListFilter = (filter) => {
    currentListFilter = filter;

    // Atualizar botões ativos
    listFilterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.listFilter === filter);
    });

    // Filtrar cards de listas
    const cards = listasContainer.querySelectorAll('a');
    cards.forEach(card => {
      const badge = card.querySelector('.badge');
      if (!badge) return;

      let shouldShow = false;
      switch (filter) {
        case 'all':
          shouldShow = true;
          break;
        case 'inprogress':
          shouldShow = badge.classList.contains('badge-available');
          break;
        case 'completed':
          shouldShow = badge.classList.contains('badge-done');
          break;
        case 'new':
          shouldShow = badge.classList.contains('badge-new');
          break;
      }

      card.style.display = shouldShow ? '' : 'none';
    });

    // Salvar preferência
    lsSet('listFilterPreference', filter);
  };

  // Event listeners
  listFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => applyListFilter(btn.dataset.listFilter));
  });
}

/**
 * Configura o botão "Voltar ao Topo"
 */
function setupBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');

  if (!backToTopBtn) {
    console.warn('Botão "Voltar ao Topo" não encontrado');
    return;
  }

  // Mostrar/ocultar botão baseado no scroll
  const toggleBackToTop = () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.remove('hidden');
    } else {
      backToTopBtn.classList.add('hidden');
    }
  };

  // Event listener para scroll
  window.addEventListener('scroll', toggleBackToTop);

  // Event listener para clique
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Verificar estado inicial
  toggleBackToTop();
}

/**
 * Carrega as preferências salvas do usuário
 */
function loadSavedPreferences() {
  // Carregar preferência de visualização
  const savedView = lsGet('viewPreference');
  if (savedView && (savedView === 'grid' || savedView === 'list')) {
    currentView = savedView;
    // Aplicar visualização salva diretamente
    updateView(savedView);
  } else {
    // Aplicar visualização padrão (grid)
    updateView('grid');
  }

  // Carregar preferência de filtro
  const savedFilter = lsGet('filterPreference');
  if (savedFilter && ['all', 'aulas', 'listas'].includes(savedFilter)) {
    currentFilter = savedFilter;
    const filterBtn = document.querySelector(`.filter-chip[data-filter="${savedFilter}"]`);
    if (filterBtn) filterBtn.click();
  }

  // Carregar preferência de filtro de listas
  const savedListFilter = lsGet('listFilterPreference');
  if (savedListFilter && ['all', 'inprogress', 'completed', 'new'].includes(savedListFilter)) {
    currentListFilter = savedListFilter;
    const listFilterBtn = document.querySelector(`.filter-chip[data-list-filter="${savedListFilter}"]`);
    if (listFilterBtn) listFilterBtn.click();
  }
}

/**
 * Retorna o estado atual dos controles
 */
export function getCurrentControlsState() {
  return {
    view: currentView,
    filter: currentFilter,
    listFilter: currentListFilter
  };
}

/**
 * Define o estado dos controles programaticamente
 */
export function setControlsState(state) {
  if (state.view && state.view !== currentView) {
    const viewBtn = document.getElementById(`view-${state.view}`);
    if (viewBtn) viewBtn.click();
  }

  if (state.filter && state.filter !== currentFilter) {
    const filterBtn = document.querySelector(`.filter-chip[data-filter="${state.filter}"]`);
    if (filterBtn) filterBtn.click();
  }

  if (state.listFilter && state.listFilter !== currentListFilter) {
    const listFilterBtn = document.querySelector(`.filter-chip[data-list-filter="${state.listFilter}"]`);
    if (listFilterBtn) listFilterBtn.click();
  }
}

