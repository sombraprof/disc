import { lsGet, lsSet } from './storage.js';
import { getVisitedSet, getListaSolvedSet } from './progress.js';

export function getPins() {
  try {
    const raw = lsGet('pins');
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch(_) { return []; }
}
export function setPins(pins) {
  try { lsSet('pins', JSON.stringify(pins)); } catch (e) { console.error(e); }
}

// getVisitedSet/getListaSolvedSet são importados de progress.js

function getCollapse(section) {
  try { return lsGet(`collapse:${section}`) === 'true'; } catch(_) { return false; }
}
function setCollapse(section, collapsed) {
  try { lsSet(`collapse:${section}`, String(!!collapsed)); } catch (e) { console.error(e); }
}

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar-links');
  if (!sidebar) return;
  const aulas = Array.isArray(window.__AULAS_META) ? window.__AULAS_META : [];
  const listas = Array.isArray(window.__LISTAS_META) ? window.__LISTAS_META : [];
  const pins = getPins();
  const visitedAulas = getVisitedSet('aula');
  const visitedListas = getVisitedSet('lista');

  function romanValueFromUnit(name) {
    if (!name) return Infinity;
    const m = String(name).toLowerCase().match(/unidade\s+([ivx]+)/);
    if (!m) return Infinity;
    const map = { i:1, v:5, x:10 };
    const s = m[1];
    let val = 0, prev = 0;
    for (let i=s.length-1;i>=0;i--) {
      const c = s[i];
      const v = map[c]||0;
      if (v<prev) val -= v; else { val += v; prev = v; }
    }
    return val || Infinity;
  }

  function renderSection(title, sectionKey, items) {
    const collapsed = getCollapse(sectionKey);
    const count = items.length;
    const chevron = `<i class="chev fa-solid fa-chevron-${collapsed ? 'right' : 'down'} mr-2"></i>`;
    const icon = sectionKey==='favs' ? '<i class="fa-solid fa-star mr-2 text-yellow-400"></i>' : (sectionKey.startsWith('aulas-')? '<i class="fa-solid fa-graduation-cap mr-2"></i>' : '<i class="fa-solid fa-list-check mr-2"></i>');
    let html = '';
    html += `<li data-section="${sectionKey}">`;
    html += `<button type="button" class="section-toggle w-full flex items-center justify-between px-2 py-1 bg-slate-700/60 hover:bg-slate-700 rounded text-left" data-section="${sectionKey}" data-tooltip="${title}">
      <span class="inline-flex items-center">${chevron}${icon}<span class="label font-bold text-sm">${title}</span></span>
      <span class="text-xs text-slate-300">${count}</span>
    </button>`;
    html += `<ul data-section-list="${sectionKey}" class="mt-2 space-y-2 collapsible ${collapsed ? '' : 'is-open'}">`;
    items.forEach((it) => { html += it; });
    html += `</ul>`;
    html += `</li>`;
    return html;
  }

  function isPinned(type, id) {
    const pins = getPins();
    return pins.includes(`${type}:${id}`);
  }
  function itemRow(type, id, text, enabled=true) {
    const href = type === 'aula' ? `#aula=${encodeURIComponent(id)}` : `#lista=${encodeURIComponent(id)}`;
    const pin = isPinned(type, id);
    const star = pin ? '<i class="fa-solid fa-star text-yellow-400"></i>' : '<i class="fa-regular fa-star"></i>';
    const disabledCls = enabled ? '' : 'nav-link-disabled';
    const icon = type==='aula' ? '<i class="fa-solid fa-book-open"></i>' : '<i class="fa-solid fa-list"></i>';
    const isVisited = type==='aula' ? visitedAulas.has(id) : false;
    const visitedCls = isVisited ? ' visited' : '';
    const titleAttr = text.replace(/"/g,'&quot;');
    let progressHtml = '';
    if (type==='lista') {
      const totals = window.__LISTAS_TOTALS || {};
      const total = totals[id] || 0;
      const solved = getListaSolvedSet(id).size;
      progressHtml = `<span class=\"sidebar-progress\">${solved}/${total}</span>`;
    }
    const totals2 = window.__LISTAS_TOTALS || {};
    const total2 = totals2[id] || 0;
    const solved2 = getListaSolvedSet(id).size;
    const completedCls = (type==='lista' && total2>0 && solved2===total2) ? ' completed' : '';
    const linkAttrs = enabled ? '' : 'aria-disabled="true" tabindex="-1"';
    const linkCls = enabled ? 'hover:text-indigo-400' : `${disabledCls} pointer-events-none`;
    const pinBtn = enabled ? `<button type=\"button\" class=\"pin-btn text-slate-300 hover:text-yellow-400\" data-tooltip=\"Favoritar\" data-pin=\"${type}\" data-id=\"${id}\" aria-label=\"Favoritar\">${star}</button>` : `<button type=\"button\" class=\"pin-btn text-slate-300\" aria-disabled=\"true\" tabindex=\"-1\">${star}</button>`;
    return `<li data-item data-type="${type}" data-id="${id}" class="flex items-center justify-between${visitedCls}${completedCls}">
      <a href="${enabled ? href : '#'}" ${linkAttrs} data-tooltip="${titleAttr}" class="block font-bold ${linkCls} transition-colors flex-1 pr-2"><span class="icon mr-2">${icon}</span><span class="label">${text}</span></a>
      ${progressHtml}
      ${pinBtn}
    </li>`;
  }

  const aulaGroupsMap = {};
  aulas.forEach((a) => {
    const id = (a.arquivo||'').replace(/\.html$/i,'');
    const label = a.titulo || id;
    const unit = (a.unidade || 'Aulas');
    if (!aulaGroupsMap[unit]) aulaGroupsMap[unit] = [];
    // usa flag ativo como fallback; a lista lateral não precisa diferenciar releaseDate
    aulaGroupsMap[unit].push(itemRow('aula', id, label, !!a.ativo));
  });
  const listaItems = listas.map((l) => itemRow('lista', (l.arquivo||'').replace(/\.json$/i,''), l.titulo, true));

  const favItems = [];
  pins.forEach((key) => {
    const [type,id] = key.split(':');
    if (type==='aula') {
      const a = aulas.find((aa)=> (aa.arquivo||'').replace(/\.html$/i,'')===id);
      if (a) favItems.push(itemRow('aula', id, a.titulo, !!a.ativo));
    } else if (type==='lista') {
      const l = listas.find((ll)=> (ll.arquivo||'').replace(/\.json$/i,'')===id);
      if (l) favItems.push(itemRow('lista', id, l.titulo, true));
    }
  });

  let html = '';
  if (favItems.length) html += renderSection('Favoritos', 'favs', favItems);
  const units = Object.keys(aulaGroupsMap).sort((a,b)=>{
    const av = romanValueFromUnit(a), bv = romanValueFromUnit(b);
    if (av!==bv) return av-bv; return a.localeCompare(b,'pt');
  });
  units.forEach((u)=> { html += renderSection(u, `aulas-${u}`, aulaGroupsMap[u]); });
  html += renderSection('Exercícios', 'listas', listaItems);

  sidebar.innerHTML = html;
}

export function setupSidebarInteractions() {
  const sidebar = document.getElementById('sidebar-links');
  if (!sidebar) return;
  sidebar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.classList.contains('section-toggle')) {
      const section = btn.getAttribute('data-section');
      const list = sidebar.querySelector(`ul[data-section-list="${section}"]`);
      if (list) {
        const isOpen = list.classList.contains('is-open');
        list.classList.toggle('is-open', !isOpen);
        setCollapse(section, !isOpen);
        const chev = btn.querySelector('i.chev');
        if (chev) {
          chev.classList.toggle('fa-chevron-right', !isOpen);
          chev.classList.toggle('fa-chevron-down', isOpen);
        }
      }
      e.preventDefault();
      e.stopPropagation();
    }
    if (btn.classList.contains('pin-btn')) {
      const type = btn.getAttribute('data-pin');
      const id = btn.getAttribute('data-id');
      if (typeof window.togglePin === 'function') window.togglePin(type, id);
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

export function markActiveRoute() {
  const sidebar = document.getElementById('sidebar-links');
  if (!sidebar) return;
  const links = sidebar.querySelectorAll('a[href^="#aula="], a[href^="#lista="]');
  links.forEach((a) => { a.classList.remove('link-active'); a.removeAttribute('aria-current'); });
  const hash = window.location.hash;
  const active = sidebar.querySelector(`a[href="${CSS.escape(hash)}"]`);
  if (active) {
    active.classList.add('link-active');
    active.setAttribute('aria-current','page');
    scrollActiveLinkIntoView(active);

    // Expand section if it's collapsed (for both aulas and listas)
    const sectionItem = active.closest('li[data-section]');
    if (sectionItem) {
      const sectionKey = sectionItem.getAttribute('data-section');
      const list = sidebar.querySelector(`ul[data-section-list="${sectionKey}"]`);
      if (list && !list.classList.contains('is-open')) {
        // Trigger click on section toggle to expand it
        const toggleBtn = sectionItem.querySelector('.section-toggle');
        if (toggleBtn) {
          toggleBtn.click();
        }
      }
    }
  }
}

function scrollActiveLinkIntoView(link) {
  try {
    const aside = document.getElementById('sidebar');
    if (!aside || !link) return;
    const linkRect = link.getBoundingClientRect();
    const asideRect = aside.getBoundingClientRect();
    if (linkRect.top < asideRect.top || linkRect.bottom > asideRect.bottom) {
      link.scrollIntoView({ block: 'nearest' });
    }
  } catch (e) { console.error(e); }
}
