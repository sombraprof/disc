import { lsGet, lsSet } from './storage.js';

/**
 * Módulo para gerenciar funcionalidades de busca e atalhos
 */

let searchIndex = [];
let currentSearchResults = [];
let currentQuery = '';

/**
 * Inicializa o sistema de busca
 */
export function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const tagFilters = document.getElementById('tag-filters');

  if (!searchInput) {
    console.warn('Campo de busca não encontrado');
    return;
  }

  // Event listeners para busca
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('keydown', handleSearchKeydown);

  // Focar na busca com atalho
  document.addEventListener('keydown', handleGlobalKeydown);

  // Construir índice de busca inicial
  buildSearchIndex();

  // Limpar filtros de tag ao clicar fora
  document.addEventListener('click', (e) => {
    if (!tagFilters?.contains(e.target) && !searchInput.contains(e.target)) {
      clearTagFilters();
    }
  });
}

/**
 * Trata entrada no campo de busca
 */
function handleSearchInput(e) {
  const query = e.target.value.trim();
  currentQuery = query;

  if (query.length === 0) {
    clearSearchResults();
    return;
  }

  if (query.length < 2) return; // Mínimo 2 caracteres

  performSearch(query);
}

/**
 * Trata teclas especiais na busca
 */
function handleSearchKeydown(e) {
  if (e.key === 'Escape') {
    clearSearchResults();
    e.target.value = '';
    e.target.blur();
  } else if (e.key === 'Enter') {
    // Focar no primeiro resultado
    const firstResult = document.querySelector('.search-result');
    if (firstResult) {
      firstResult.focus();
    }
  }
}

/**
 * Trata atalhos globais do teclado
 */
function handleGlobalKeydown(e) {
  // Atalho para focar na busca: Ctrl+K ou /
  if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
    e.preventDefault();
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  // Atalho para alternar tema: T
  if (e.key === 't' && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.click();
  }

  // Atalho para mostrar sumário: S
  if (e.key === 's' && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    const tocBtn = document.getElementById('toc-fab');
    if (tocBtn) tocBtn.click();
  }

  // Atalho para mostrar ajuda: ?
  if (e.key === '?' && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    showKeyboardShortcuts();
  }
}

/**
 * Constrói o índice de busca
 */
function buildSearchIndex() {
  searchIndex = [];

  // Indexar aulas
  const aulaCards = document.querySelectorAll('#cards-container a');
  aulaCards.forEach(card => {
    const title = card.querySelector('h3')?.textContent || '';
    const description = card.querySelector('p')?.textContent || '';
    const tags = Array.from(card.querySelectorAll('.chip')).map(chip => chip.textContent.replace('#', ''));

    searchIndex.push({
      type: 'aula',
      title,
      description,
      tags,
      element: card,
      href: card.href,
      searchableText: `${title} ${description} ${tags.join(' ')}`.toLowerCase()
    });
  });

  // Indexar listas
  const listaCards = document.querySelectorAll('#listas-container a');
  listaCards.forEach(card => {
    const title = card.querySelector('h3')?.textContent || '';
    const description = card.querySelector('p')?.textContent || '';
    const tags = Array.from(card.querySelectorAll('.chip')).map(chip => chip.textContent.replace('#', ''));

    searchIndex.push({
      type: 'lista',
      title,
      description,
      tags,
      element: card,
      href: card.href,
      searchableText: `${title} ${description} ${tags.join(' ')}`.toLowerCase()
    });
  });
}

/**
 * Executa a busca
 */
function performSearch(query) {
  const results = searchIndex.filter(item =>
    item.searchableText.includes(query.toLowerCase())
  );

  currentSearchResults = results;
  displaySearchResults(results, query);
}

/**
 * Exibe os resultados da busca
 */
function displaySearchResults(results, query) {
  clearSearchResults();

  if (results.length === 0) {
    showNoResults();
    return;
  }

  // Ocultar todos os cards
  hideAllCards();

  // Mostrar apenas os resultados
  results.forEach(result => {
    result.element.style.display = '';
    result.element.classList.add('search-result');
    highlightSearchTerms(result.element, query);
  });

  // Mostrar contagem de resultados
  showResultCount(results.length, query);
}

/**
 * Oculta todos os cards
 */
function hideAllCards() {
  const allCards = document.querySelectorAll('#cards-container a, #listas-container a');
  allCards.forEach(card => {
    card.style.display = 'none';
    card.classList.remove('search-result');
    removeHighlights(card);
  });
}

/**
 * Destaca os termos da busca
 */
function highlightSearchTerms(element, query) {
  const textElements = element.querySelectorAll('h3, p');
  textElements.forEach(el => {
    const text = el.textContent;
    const highlighted = text.replace(
      new RegExp(`(${query})`, 'gi'),
      '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
    );
    el.innerHTML = highlighted;
  });
}

/**
 * Remove destaques
 */
function removeHighlights(element) {
  const marks = element.querySelectorAll('mark');
  marks.forEach(mark => {
    mark.outerHTML = mark.innerHTML;
  });
}

/**
 * Mostra contagem de resultados
 */
function showResultCount(count, query) {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.setAttribute('aria-label', `Buscar aulas e listas - ${count} resultado(s) para "${query}"`);
  }
}

/**
 * Mostra mensagem de nenhum resultado
 */
function showNoResults() {
  hideAllCards();

  const container = document.getElementById('cards-container');
  if (container) {
    const noResults = document.createElement('div');
    noResults.className = 'col-span-full text-center py-8';
    noResults.innerHTML = `
      <div class="text-slate-500">
        <i class="fa-solid fa-search text-4xl mb-4"></i>
        <p class="text-lg">Nenhum resultado encontrado</p>
        <p class="text-sm">Tente usar termos diferentes</p>
      </div>
    `;
    container.appendChild(noResults);
  }
}

/**
 * Limpa os resultados da busca
 */
function clearSearchResults() {
  // Mostrar todos os cards novamente
  const allCards = document.querySelectorAll('#cards-container a, #listas-container a');
  allCards.forEach(card => {
    card.style.display = '';
    card.classList.remove('search-result');
    removeHighlights(card);
  });

  // Remover mensagens de "nenhum resultado"
  const noResults = document.querySelector('.col-span-full');
  if (noResults) noResults.remove();

  // Resetar aria-label
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.setAttribute('aria-label', 'Buscar aulas e listas');
  }

  currentSearchResults = [];
  currentQuery = '';
}

/**
 * Limpa filtros de tag
 */
function clearTagFilters() {
  const tagFilters = document.getElementById('tag-filters');
  if (tagFilters) {
    tagFilters.innerHTML = '';
  }
}

/**
 * Mostra modal de atalhos do teclado
 */
function showKeyboardShortcuts() {
  const modal = document.getElementById('shortcut-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    // Focar no botão de fechar
    const closeBtn = modal.querySelector('#shortcut-close');
    if (closeBtn) closeBtn.focus();

    // Event listener para fechar
    const closeHandler = (e) => {
      if (e.key === 'Escape' || e.target === modal || e.target === closeBtn) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.removeEventListener('keydown', closeHandler);
        document.removeEventListener('click', closeHandler);
      }
    };

    document.addEventListener('keydown', closeHandler);
    modal.addEventListener('click', closeHandler);
  }
}

/**
 * Reconstrói o índice de busca (chamar após mudanças no DOM)
 */
export function rebuildSearchIndex() {
  buildSearchIndex();
}

/**
 * Retorna estatísticas da busca atual
 */
export function getSearchStats() {
  return {
    totalItems: searchIndex.length,
    currentResults: currentSearchResults.length,
    currentQuery
  };
}