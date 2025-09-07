import { lsGet, lsSet } from './storage.js';
import * as Sidebar from './sidebar.js';
import { setTOCOpen } from './toc.js';

export function showToast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  el.classList.add('show');
  setTimeout(()=> { el.classList.add('hidden'); el.classList.remove('show'); }, 2500);
}

export function showHomeSkeleton() {
  const cards = document.getElementById('cards-container');
  const listas = document.getElementById('listas-container');
  if (cards) {
    cards.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'space-y-3';
    const title = document.createElement('div');
    title.className = 'h-6 w-40 skeleton rounded';
    wrap.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6';
    for (let i=0;i<2;i++) {
      const card = document.createElement('div');
      card.className = 'p-6 bg-white rounded-lg shadow skeleton h-24';
      grid.appendChild(card);
    }
    wrap.appendChild(grid);
    cards.appendChild(wrap);
  }
  if (listas) {
    listas.innerHTML='';
  }
}

export function showHomeAnchor(anchorId) {
  const conteudo = document.getElementById('conteudo');
  if (conteudo) conteudo.innerHTML = '';
  const nav = document.getElementById('aula-nav');
  if (nav) nav.classList.add('hidden');
  document.title = (window.APP_NOME_DISCIPLINA || 'Curso');
}

export function notFound(message) {
  const conteudo = document.getElementById('conteudo');
  if (!conteudo) return;
  conteudo.innerHTML = `<div class="p-6 bg-red-50 border border-red-200 text-red-700 rounded">${message || 'Conteúdo não encontrado.'}</div>`;
  const toc = document.getElementById('toc');
  if (toc) { try { setTOCOpen(false); } catch (e) { console.error(e); } toc.innerHTML = ''; }
  const nav = document.getElementById('aula-nav');
  if (nav) nav.classList.add('hidden');
  document.title = (window.APP_NOME_DISCIPLINA || 'Curso');
}


export function setupCodeCopyButtons() {
  // Encontra todos os blocos de código
  const codeBlocks = document.querySelectorAll('.code-block pre code, pre code');

  codeBlocks.forEach((codeBlock) => {
    // Verifica se já tem botão de cópia
    if (codeBlock.parentElement.querySelector('.copy-btn')) return;

    // Cria o botão de cópia
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
    copyBtn.title = 'Copiar código';
    copyBtn.setAttribute('aria-label', 'Copiar código');

    // Adiciona funcionalidade de cópia
    copyBtn.addEventListener('click', async () => {
      try {
        const text = codeBlock.textContent || codeBlock.innerText;
        await navigator.clipboard.writeText(text);

        // Feedback visual
        const originalIcon = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        copyBtn.classList.add('copied');

        // Mostra toast de sucesso
        showToast('Código copiado para a área de transferência!');

        // Restaura ícone após 2 segundos
        setTimeout(() => {
          copyBtn.innerHTML = originalIcon;
          copyBtn.classList.remove('copied');
        }, 2000);

      } catch (err) {
        console.error('Erro ao copiar código:', err);
        showToast('Erro ao copiar código. Tente novamente.');
      }
    });

    // Adiciona o botão ao bloco de código
    const codeBlockContainer = codeBlock.closest('.code-block') || codeBlock.parentElement;
    if (codeBlockContainer) {
      codeBlockContainer.style.position = 'relative';
      codeBlockContainer.appendChild(copyBtn);
    }
  });
}
