import { lsGet, lsSet } from './storage.js';
import { showToast } from './ui.js';

export function getVisitedSet(type) {
  try {
    const raw = lsGet(`visited:${type}`);
    const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch(_) { return new Set(); }
}

export function markVisited(type, id) {
  try {
    const raw = lsGet(`visited:${type}`);
    const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    if (!arr.includes(id)) {
      arr.push(id);
      lsSet(`visited:${type}`, JSON.stringify(arr));
    }
  } catch (e) { console.error(e); }
}

export function getListaSolvedSet(id) {
  try {
    const raw = lsGet(`visited:lista:${id}:solved`);
    const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch(_) { return new Set(); }
}

export function setListaSolvedSet(id, set) {
  try { lsSet(`visited:lista:${id}:solved`, JSON.stringify(Array.from(set))); } catch (e) { console.error(e); }
}

export function updateListCardProgress(listId) {
  try {
    const card = document.querySelector(`#listas-container a[data-list-id="${CSS.escape(listId)}"]`);
    const totals = window.__LISTAS_TOTALS || {};
    const total = totals[listId] || 0;
    const solved = getListaSolvedSet(listId).size;
    const pct = total ? Math.round((solved / total) * 100) : 0;
    if (card) {
      const textEl = card.querySelector('[data-progress="text"]');
      const barEl = card.querySelector('[data-progress="bar"]');
      const doneBadge = card.querySelector('[data-badge="done"]');
      if (textEl) textEl.textContent = `Progresso: ${solved}/${total}`;
      if (barEl) {
        const cls = `w-pct-${Math.min(100, Math.max(0, Math.round(pct/10)*10))}`;
        barEl.className = `h-full bg-indigo-500 ${cls}`;
      }
      if (doneBadge) doneBadge.classList.toggle('hidden', !(total && solved===total));
    }
  } catch (e) { console.error(e); }
}

/**
 * Configura o menu de progresso
 */
export function setupProgressMenu() {
  const progressBtn = document.getElementById('progress-menu-btn');
  const progressMenu = document.getElementById('progress-menu');
  const exportBtn = document.getElementById('export-progress');
  const importBtn = document.getElementById('import-progress');
  const resetBtn = document.getElementById('reset-progress');
  const importFile = document.getElementById('import-file');

  if (!progressBtn || !progressMenu) {
    console.warn('Elementos do menu de progresso não encontrados');
    return;
  }

  // Toggle menu
  progressBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = progressBtn.getAttribute('aria-expanded') === 'true';
    progressBtn.setAttribute('aria-expanded', !isExpanded);
    progressMenu.classList.toggle('hidden');
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (!progressBtn.contains(e.target) && !progressMenu.contains(e.target)) {
      progressBtn.setAttribute('aria-expanded', 'false');
      progressMenu.classList.add('hidden');
    }
  });

  // Exportar progresso
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      try {
        const progressData = exportProgress();
        const blob = new Blob([JSON.stringify(progressData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progresso-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Progresso exportado com sucesso!');
        progressMenu.classList.add('hidden');
      } catch (error) {
        console.error('Erro ao exportar progresso:', error);
        showToast('Erro ao exportar progresso');
      }
    });
  }

  // Importar progresso
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      importFile?.click();
    });
  }

  if (importFile) {
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const progressData = JSON.parse(event.target.result);
            importProgress(progressData);
            showToast('Progresso importado com sucesso!');
            progressMenu.classList.add('hidden');
            // Recarregar a página para atualizar a interface
            setTimeout(() => window.location.reload(), 1000);
          } catch (error) {
            console.error('Erro ao importar progresso:', error);
            showToast('Erro ao importar progresso. Verifique o arquivo.');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // Limpar progresso
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja limpar todo o progresso? Esta ação não pode ser desfeita.')) {
        try {
          resetProgress();
          showToast('Progresso limpo com sucesso!');
          progressMenu.classList.add('hidden');
          // Recarregar a página para atualizar a interface
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          console.error('Erro ao limpar progresso:', error);
          showToast('Erro ao limpar progresso');
        }
      }
    });
  }
}

/**
 * Exporta todos os dados de progresso
 */
function exportProgress() {
  const progressData = {};

  // Iterar sobre todas as chaves do localStorage que começam com 'visited:'
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('visited:')) {
      try {
        progressData[key] = localStorage.getItem(key);
      } catch (error) {
        console.warn(`Erro ao exportar chave ${key}:`, error);
      }
    }
  }

  return progressData;
}

/**
 * Importa dados de progresso
 */
function importProgress(progressData) {
  try {
    // Limpar dados existentes primeiro
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('visited:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Importar novos dados
    Object.entries(progressData).forEach(([key, value]) => {
      if (key.startsWith('visited:')) {
        localStorage.setItem(key, value);
      }
    });
  } catch (error) {
    console.error('Erro ao importar progresso:', error);
    throw error;
  }
}

/**
 * Limpa todo o progresso
 */
function resetProgress() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('visited:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Erro ao limpar progresso:', error);
    throw error;
  }
}
