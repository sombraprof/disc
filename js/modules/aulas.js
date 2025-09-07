import { lsGet, lsSet } from './storage.js';
import * as Sidebar from './sidebar.js';
import * as TOC from './toc.js';
import { markVisited } from './progress.js';
import { CONTENT_BASE_PATH } from './page-config.js';
import { setupCodeCopyButtons } from './ui.js';

export async function loadAulas() {
  try {
    const res = await fetch(`/${CONTENT_BASE_PATH}/aulas/aulas.json`);
    const aulas = await res.json();
    window.__AULAS_META = aulas;

    const cardsContainer = document.getElementById('cards-container');
    if (cardsContainer) {
      cardsContainer.innerHTML = '';
      // Não sobrescrever as classes aplicadas pelo módulo controls
      // cardsContainer.className = 'mt-12 space-y-8';
    }

    const now = new Date();
    const aulasAug = aulas.map(a => {
      const rd = a.releaseDate ? new Date(a.releaseDate + 'T00:00:00') : null;
      const ativo = (typeof a.ativo === 'boolean' ? a.ativo : true) && (!rd || rd <= now);
      return { ...a, __ativoComputed: ativo };
    });
    const groups = {};
    aulasAug.sort((a,b)=> Number(b.__ativoComputed) - Number(a.__ativoComputed)).forEach((aula)=>{
      const unit = aula.unidade || 'Aulas';
      if (!groups[unit]) groups[unit] = [];
      groups[unit].push(aula);
    });
    const orderedUnits = Object.keys(groups).sort((a,b)=> a.localeCompare(b,'pt'));
    orderedUnits.forEach((unit) => {
      const wrap = document.createElement('div');
      wrap.className = 'space-y-3';
      const title = document.createElement('h3');
      title.className = 'group-title';
      title.textContent = unit;
      wrap.appendChild(title);
      const grid = document.createElement('div');
      grid.className = 'group-grid grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6';
      
      const gridFragment = document.createDocumentFragment(); // Create fragment
      groups[unit].forEach((aula) => {
        const id = (aula.arquivo || '').replace(/\.html$/i, '');
        const enabled = !!aula.__ativoComputed;
        const href = enabled ? `#aula=${encodeURIComponent(id)}` : '#';
        const card = document.createElement('a');
        card.href = href;
        card.className = `relative block bg-white p-6 rounded-lg shadow-md transition-all ${enabled ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'opacity-70 cursor-not-allowed pointer-events-none'}`;
        if (!enabled) { card.setAttribute('aria-disabled','true'); }

        const status = enabled ? `<span class="badge badge-available"><i class="fa-solid fa-circle"></i> Disponível</span>`
                               : `<span class="badge badge-soon"><i class="fa-regular fa-clock"></i> Em breve</span>`;

        // Extrair número da aula do título
        const aulaMatch = aula.titulo.match(/Aula (\d+)/i);
        const aulaNumero = aulaMatch ? aulaMatch[1] : '';

        card.innerHTML = `
          <div class="card-icon">
            <i class="fa-solid ${enabled ? 'fa-graduation-cap' : 'fa-clock'}"></i>
          </div>
          <div class="card-content">
            <div class="flex items-start justify-between gap-3">
              <h3 class="card-title font-bold text-xl text-indigo-600">${(aula.titulo||'').split(':')[0]}</h3>
              ${status}
            </div>
            <p class="card-description text-slate-600">${aula.descricao||''}</p>
          </div>`;

        if (Array.isArray(aula.tags) && aula.tags.length) {
          const tags = document.createElement('div');
          tags.className = 'mt-2 flex flex-wrap gap-2';
          aula.tags.forEach(t => { const s=document.createElement('span'); s.className='chip'; s.textContent=`#${t}`; tags.appendChild(s); });
          card.appendChild(tags);
        }
        gridFragment.appendChild(card); // Append to fragment
      });
      grid.appendChild(gridFragment); // Append fragment to grid
      wrap.appendChild(grid); // Append grid to wrap
      if (cardsContainer) cardsContainer.appendChild(wrap);
    });

    try { Sidebar.renderSidebar(); Sidebar.markActiveRoute(); } catch (e) { console.error(e); }
    try { window.buildTagFilters && window.buildTagFilters(); } catch (e) { console.error(e); }
    try { window.rebuildSearchIndex && window.rebuildSearchIndex(); } catch (e) { console.error(e); }
  } catch(err) { console.error('Erro ao carregar aulas.json:', err); }
}

export function clearAulaStyles() {
  document.querySelectorAll('style[data-aula-style="true"]').forEach(el => el.remove());
}
export function clearAulaAssets() {
  document.querySelectorAll('[data-aula-asset="true"]').forEach((el) => el.remove());
}
export function getAulaMetaByFile(file) {
  const base = (file.split('/').pop() || file).toLowerCase();
  const aulas = Array.isArray(window.__AULAS_META) ? window.__AULAS_META : [];
  return aulas.find(a => (a.arquivo||'').toLowerCase() === base);
}
export function injectAulaAssets(meta) {
  if (!meta) return Promise.resolve();
  const promises = [];
  const styles = Array.isArray(meta.styles) ? meta.styles : [];
  const scripts = Array.isArray(meta.scripts) ? meta.scripts : [];
  styles.forEach((href)=>{
    const link = document.createElement('link');
    link.rel='stylesheet'; link.href=href; link.setAttribute('data-aula-asset','true'); document.head.appendChild(link);
  });
  scripts.forEach((src)=>{
    promises.push(new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src=src; s.defer=true; s.setAttribute('data-aula-asset','true'); s.onload=()=>resolve(); s.onerror=(e)=>reject(e); document.body.appendChild(s); }));
  });
  return Promise.all(promises).then(()=>{ if (meta.init && typeof window[meta.init]==='function') { try { window[meta.init](); } catch(e){ console.warn('Erro ao executar init da aula:', e); } } });
}

function sanitizeHtml(htmlContent) {
  try {
    return String(htmlContent)
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
      .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
      .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '');
  } catch (e) {
    console.error('Erro ao sanitizar HTML:', e);
    return htmlContent; // Return original content on error
  }
}

function renderAulaContent(doc, conteudo) {
  if (!conteudo) return;
  conteudo.innerHTML = '';
  const frag = document.createDocumentFragment();
  const header = doc.querySelector('body > header, main > header');
  const main = doc.querySelector('main');
  if (header) frag.appendChild(header.cloneNode(true));
  if (main) frag.appendChild(main.cloneNode(true));
  else if (doc.body) { const bodyClone=doc.body.cloneNode(true); bodyClone.querySelectorAll('nav').forEach(n=>n.remove()); frag.appendChild(bodyClone); }
  else { const wrapper=document.createElement('div'); wrapper.innerHTML=doc.body.innerHTML; frag.appendChild(wrapper); } // Use doc.body.innerHTML here
  conteudo.appendChild(frag);
}

function setupAulaInteractions(file, doc, conteudo) {
  try { const firstHeading = conteudo.querySelector('h1, h2, h3'); if (firstHeading) { if (!firstHeading.hasAttribute('tabindex')) firstHeading.setAttribute('tabindex','-1'); firstHeading.focus(); } } catch (e) { console.error(e); }
  try { window.initAccordions && window.initAccordions(); } catch (e) { console.error(e); }
  try { window.initAdvancedCopyButtons && window.initAdvancedCopyButtons(); } catch (e) { console.error(e); }
  try { window.initLaboratorioGeneros && window.initLaboratorioGeneros(); } catch (e) { console.error(e); }
  try { TOC.buildTOC(); } catch (e) { console.error(e); }
  buildAulaPrevNext(file);
  Sidebar.markActiveRoute();
  updateDocumentTitleFromAula(doc);
  try { if (window.hljs) window.hljs.highlightAll(); } catch (e) { console.error(e); }
  try {
    const base = file.split('/').pop() || file; const id = base.replace(/\.html$/i,'');
    history.replaceState(null, '', `#aula=${encodeURIComponent(id)}`);
    lsSet('lastRoute', `aula=${id}`);
    markVisited('aula', id);
    Sidebar.renderSidebar();
  } catch (e) { console.error(e); }
  try { window.scrollTo({ top: conteudo.offsetTop - 20, behavior: 'smooth' }); } catch (e) { console.error(e); }
  try { setupCodeCopyButtons(); } catch (e) { console.error(e); }
  prefetchNextPrev(file);
}

export function loadAula(file) {
  fetch(file).then(r=>r.text()).then(async (html)=>{
    try { window.showLoader ? window.showLoader() : null; } catch (e) { console.error(e); }
    const sanitizedHtml = sanitizeHtml(html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedHtml, 'text/html');
    clearAulaStyles();
    clearAulaAssets();
    const meta = getAulaMetaByFile(file);
    await injectAulaAssets(meta);
    const conteudo = document.getElementById('conteudo');
    renderAulaContent(doc, conteudo);
    setupAulaInteractions(file, doc, conteudo);
  }).catch(err => console.error('Erro ao carregar aula:', err));
}

export function buildAulaPrevNext(file) {
  const nav = document.getElementById('aula-nav');
  const prev = document.getElementById('aula-prev');
  const next = document.getElementById('aula-next');
  const meta = Array.isArray(window.__AULAS_META) ? window.__AULAS_META : [];
  const id = (file.split('/').pop() || file).replace(/\.html$/i, '');
  const idx = meta.findIndex((a) => (a.arquivo || '').replace(/\.html$/i, '') === id);
  if (!nav || !prev || !next) return;
  if (idx === -1) { nav.classList.add('hidden'); return; }
  const prevMeta = meta[idx - 1];
  const nextMeta = meta[idx + 1];
  nav.classList.remove('hidden');
  if (prevMeta) { const prevId=(prevMeta.arquivo||'').replace(/\.html$/i,''); prev.href = `#aula=${encodeURIComponent(prevId)}`; prev.classList.remove('opacity-50','pointer-events-none'); prev.removeAttribute('aria-disabled'); }
  else { prev.href='#'; prev.classList.add('opacity-50','pointer-events-none'); prev.setAttribute('aria-disabled','true'); }
  if (nextMeta) { const nextId=(nextMeta.arquivo||'').replace(/\.html$/i,''); next.href = `#aula=${encodeURIComponent(nextId)}`; next.classList.remove('opacity-50','pointer-events-none'); next.removeAttribute('aria-disabled'); }
  else { next.href='#'; next.classList.add('opacity-50','pointer-events-none'); next.setAttribute('aria-disabled','true'); }
}

export function prefetchNextPrev(currentFile) {
  const meta = Array.isArray(window.__AULAS_META) ? window.__AULAS_META : [];
  const id = (currentFile.split('/').pop() || currentFile).replace(/\.html$/i, '');
  const idx = meta.findIndex((a) => (a.arquivo || '').replace(/\.html$/i, '') === id);
  if (idx === -1) return;
  const urls = [];
  if (meta[idx + 1]) urls.push(`/${CONTENT_BASE_PATH}/aulas/${meta[idx + 1].arquivo}`);
  if (meta[idx - 1]) urls.push(`/${CONTENT_BASE_PATH}/aulas/${meta[idx - 1].arquivo}`);
  urls.forEach((u) => fetch(u).catch(() => {}));
}

export function updateDocumentTitleFromAula(doc) {
  const h1 = doc.querySelector('h1');
  const t = h1 ? h1.textContent.trim() : null;
  document.title = t ? `${(window.APP_NOME_DISCIPLINA||'Curso')} - ${t}` : (window.APP_NOME_DISCIPLINA||'Curso');
}