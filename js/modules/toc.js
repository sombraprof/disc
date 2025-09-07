import { lsGet, lsSet } from './storage.js';

export function setTOCOpen(open) {
  const toc = document.getElementById('toc');
  const main = document.getElementById('main-root');
  const fab = document.getElementById('toc-fab');
  if (!toc || !main) return;
  if (open) {
    toc.classList.remove('hidden');
    main.classList.add('toc-open');
    if (fab) fab.setAttribute('aria-expanded', 'true');
  } else {
    toc.classList.add('hidden');
    main.classList.remove('toc-open');
    if (fab) fab.setAttribute('aria-expanded', 'false');
  }
  try { lsSet('tocOpen', String(!!open)); } catch (e) { console.error(e); }
}

export function getTocInitialOpen() {
  try {
    const v = lsGet('tocOpen');
    if (v === null) return false;
    return v === 'true';
  } catch (_) {
    return false;
  }
}

export function setupTOCToggle() {
  const fab = document.getElementById('toc-fab');
  const toc = document.getElementById('toc');
  if (!fab || !toc) return;
  fab.addEventListener('click', () => {
    const isHidden = toc.classList.contains('hidden');
    setTOCOpen(isHidden);
  });
}

export function buildTOC() {
  const conteudo = document.getElementById('conteudo');
  const toc = document.getElementById('toc');
  const fab = document.getElementById('toc-fab');
  if (!conteudo || !toc) return;
  const headings = conteudo.querySelectorAll('h2, h3, h4');
  if (!headings.length) {
    setTOCOpen(false);
    toc.innerHTML = '';
    if (fab) fab.classList.add('hidden');
    return;
  }
  if (fab) fab.classList.remove('hidden');
  setTOCOpen(getTocInitialOpen());
  const items = [];
  let routePrefix = 'home';
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.includes('=')) {
    const [k, v] = hash.split('=');
    if (v) routePrefix = `${k}-${v.replace(/[^a-z0-9_-]/ig, '')}`;
  }
  headings.forEach((h, idx) => {
    if (!h.id) {
      const slug = (h.textContent || `sec-${idx}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      h.id = `${routePrefix}-${slug || `sec-${idx}`}`;
    }
    items.push({ id: h.id, text: h.textContent || h.id, level: h.tagName });
  });
  toc.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div class="toc-title">Nesta página</div>
      <button id="toc-close" class="text-slate-500 hover:text-slate-700" title="Fechar" aria-label="Fechar sumário">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="toc-list"></div>
  `;
  const listEl = toc.querySelector('.toc-list');
  items.forEach((it) => {
    const a = document.createElement('a');
    a.href = `#${it.id}`;
    const label = it.text || '';
    const low = label.toLowerCase();
    let icon = '';
    if (/(plano|ementa)/.test(low)) icon = '🗂️ ';
    else if (/(introduç|introduc)/.test(low)) icon = '📘 ';
    else if (/(teoria|conceitos|fundamentos)/.test(low)) icon = '📚 ';
    else if (/(prátic|pratic|exemplo|exercício|exercicio|atividade)/.test(low)) icon = '🧪 ';
    else if (/ted/.test(low)) icon = '📝 ';
    else if (/(bibliografia|referênc|referenc)/.test(low)) icon = '🔎 ';
    a.innerHTML = `${icon}${label}`;
    a.className = 'block';
    listEl.appendChild(a);
  });
  const closeBtn = document.getElementById('toc-close');
  if (closeBtn) closeBtn.addEventListener('click', () => setTOCOpen(false));
  if (window.__TOC_CLICK_HANDLER) conteudo.removeEventListener('click', window.__TOC_CLICK_HANDLER);
  window.__TOC_CLICK_HANDLER = (e) => {
    const t = e.target;
    if (t && t.tagName === 'A' && t.getAttribute('href') && t.getAttribute('href').startsWith('#')) {
      const id = t.getAttribute('href').slice(1);
      const target = conteudo.querySelector(`#${CSS.escape(id)}`);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
  conteudo.addEventListener('click', window.__TOC_CLICK_HANDLER);
  const tocLinks = Array.from(listEl.querySelectorAll('a'));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id;
      const link = tocLinks.find((l) => l.getAttribute('href') === `#${id}`);
      if (link) {
        if (entry.isIntersecting) link.classList.add('active');
        else link.classList.remove('active');
      }
    });
  }, { root: null, threshold: 0.1 });
  headings.forEach((h) => obs.observe(h));
}

