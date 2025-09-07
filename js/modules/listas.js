import { lsGet, lsSet } from './storage.js';
import * as Sidebar from './sidebar.js';
import { getListaSolvedSet, setListaSolvedSet, updateListCardProgress, markVisited } from './progress.js';
import { CONTENT_BASE_PATH } from './page-config.js';

export async function loadListas() {
  try {
    const res = await fetch(`/${CONTENT_BASE_PATH}/listas/listas.json`);
    const listas = await res.json();
    window.__LISTAS_META = listas;
    if (!window.__LISTAS_TOTALS) window.__LISTAS_TOTALS = {};
    const container = document.getElementById('listas-container');
    const listasOrdenadas = [...listas].sort((a,b)=> (a.titulo||'').localeCompare(b.titulo||'', 'pt'));
    for (const lista of listasOrdenadas) {
      const id = (lista.arquivo || '').replace(/\.json$/i, '');
      const href = `#lista=${encodeURIComponent(id)}`;
      let totalQuestoes = 0;
      try {         const det = await fetch(`/${CONTENT_BASE_PATH}/listas/${lista.arquivo}`).then(r=>r.json()); totalQuestoes = Array.isArray(det.questoes) ? det.questoes.length : 0; } catch(_) {}
      window.__LISTAS_TOTALS[id] = totalQuestoes;
      const solved = getListaSolvedSet(id).size;
      const pct = totalQuestoes ? Math.round((solved/totalQuestoes)*100) : 0;
      if (container) {
        const card = document.createElement('a');
        card.href = href; card.dataset.listId = id;
        card.className = 'relative block bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer';
        const isDone = totalQuestoes > 0 && solved === totalQuestoes;
        const newBadge = lista.nova ? '<span class="badge badge-new" data-badge="new"><i class="fa-solid fa-star"></i> Nova</span>' : '';

        card.innerHTML = `
          <div class=\"card-icon\">
            <i class=\"fa-solid fa-list\"></i>
          </div>
          <div class=\"card-content\">
            <div class=\"flex items-start justify-between gap-3\">
              <h3 class=\"card-title font-bold text-xl text-indigo-600 mb-2\">${lista.titulo}</h3>
              <div class=\"flex items-center gap-2\">
                <span class=\"badge badge-available\"><i class=\"fa-solid fa-list\"></i> Exercícios</span>
                <span class=\"badge badge-done\" data-badge=\"done\" style=\"display:${isDone ? 'inline-flex' : 'none'}\"><i class=\"fa-solid fa-check\"></i> Concluída</span>
                ${newBadge}
              </div>
            </div>
            <p class=\"card-description text-slate-600 mb-3\">${lista.descricao}</p>
            <div class=\"text-xs text-slate-500 mb-1\" data-progress=\"text\">Progresso: ${solved}/${totalQuestoes}</div>
            <div class=\"w-full h-2 rounded bg-slate-200 overflow-hidden\"><div data-progress=\"bar\" class=\"h-full bg-indigo-500 w-pct-${Math.min(100, Math.max(0, Math.round(pct/10)*10))}"></div></div>
          </div>
        `;
        if (Array.isArray(lista.tags) && lista.tags.length) {
          const tags = document.createElement('div'); tags.className = 'mt-2 flex flex-wrap gap-2';
          lista.tags.forEach(t=>{ const s=document.createElement('span'); s.className='chip'; s.textContent=`#${t}`; tags.appendChild(s); });
          card.appendChild(tags);
        }
        card.dataset.state = isDone ? 'completed' : 'inprogress';
        container.appendChild(card);
      }
    }
    try { Sidebar.renderSidebar(); Sidebar.markActiveRoute(); } catch (e) { console.error(e); }
    try { window.buildTagFilters && window.buildTagFilters(); } catch (e) { console.error(e); }
    try { window.rebuildSearchIndex && window.rebuildSearchIndex(); } catch (e) { console.error(e); }
  } catch(err) { console.error('Erro ao carregar listas:', err); }
}

export async function loadListaDetalhe(file) {
  try {
    window.showLoader && window.showLoader();
    const metaRes = await fetch(`/${CONTENT_BASE_PATH}/listas/listas.json`);
    const listas = await metaRes.json();
    const meta = listas.find((l)=> l.arquivo === file) || {};
    const res = await fetch(`/${CONTENT_BASE_PATH}/listas/${file}`);
    const markdownContent = await res.text();

    // Parse Markdown content
    const lines = markdownContent.split('\n');
    let titulo = 'Lista de Exercícios';
    let descricao = '';
    const questoes = [];
    let currentQuestion = null;
    let parsingSolution = false;

    for (const line of lines) {
      if (line.startsWith('# Lista de Exercícios')) {
        titulo = line.replace('# ', '').trim();
      } else if (line.startsWith('## Exercício')) {
        if (currentQuestion) {
          questoes.push(currentQuestion);
        }
        currentQuestion = {
          id: questoes.length + 1,
          enunciado: line.replace('## Exercício', '').trim(),
          dica: '',
          solucao: '',
        };
        parsingSolution = false; // Reset solution parsing flag
      } else if (currentQuestion) {
        if (line.startsWith('**Dica:**')) {
          currentQuestion.dica = line.replace('**Dica:**', '').trim();
          parsingSolution = false;
        } else if (line.startsWith('**Solução:**')) {
          currentQuestion.solucao = line.replace('**Solução:**', '').trim();
          parsingSolution = true;
        } else if (parsingSolution) {
          currentQuestion.solucao += line + '\n'; // Accumulate solution lines
        } else if (line.trim() !== '') {
          // Accumulate description if not an exercise or hint/solution
          if (currentQuestion.enunciado === line.trim()) {
            // Skip if it's just a repeat of the exercise title
          } else if (currentQuestion.dica === '' && currentQuestion.solucao === '') {
            // If no hint/solution yet, it might be part of the description
            descricao += line.trim() + ' ';
          }
        }
      }
    }
    if (currentQuestion) {
      questoes.push(currentQuestion);
    }

    const data = {
      titulo: titulo,
      descricao: descricao.trim(),
      questoes: questoes,
    };
    const conteudo = document.getElementById('conteudo');
    if (!conteudo) return;
    conteudo.innerHTML = '';
    const section = document.createElement('section');
    section.className = 'mb-16 pt-16';
    const listId = (file.split('/').pop()||file).replace(/\.md$/i,''); // Changed .json to .md
    const totalQuestoes = data.questoes.length; // Use parsed questions length
    const solvedSetHeader = getListaSolvedSet(listId);
    section.innerHTML = `
      <header class="mb-6">
        <h2 class="text-4xl font-bold text-slate-900">${data.titulo}</h2>
        <p class="text-lg text-slate-600 mt-2 mb-4">${data.descricao}</p>
        <div class="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded p-3">
          <div class="text-sm text-slate-600">Progresso: <strong id="lista-progress">${solvedSetHeader.size}/${totalQuestoes}</strong></div>
          <div class="flex items-center gap-2">
            <button id="lista-expand" data-tooltip="Expandir todas as soluções" class="px-3 py-1 rounded border border-slate-300 text-sm">Expandir tudo</button>
            <button id="lista-collapse" data-tooltip="Recolher todas as soluções" class="px-3 py-1 rounded border border-slate-300 text-sm">Recolher tudo</button>
            <button id="lista-reset" data-tooltip="Limpar marcações desta lista" class="px-3 py-1 rounded border border-red-300 text-sm text-red-700">Limpar progresso</button>
          </div>
        </div>
      </header>
      <div id="questoes" class="grid md:grid-cols-1 gap-6"></div>
    `;
    conteudo.appendChild(section);
    const questoesContainer = section.querySelector('#questoes');
    data.questoes.forEach((q)=>{
      const div = document.createElement('div'); div.className = 'bg-white border border-slate-200 rounded-lg';
      const solvedSet = getListaSolvedSet(listId);
      const solvedNow = solvedSet.has(String(q.id));
      const unlocked = meta.mostrar_solucoes || solvedNow || (solvedSet.size === totalQuestoes);
      const chkId = `chk-${listId}-${q.id}`;
      div.innerHTML = `
        <div class=\"p-5 flex items-start justify-between gap-3\">
          <div>
            <p class=\"font-semibold\">${q.id}. ${q.enunciado}</p>
            <div class=\"mt-2 text-sm text-slate-600\"><p><strong>Dica:</strong> ${q.dica}</p></div>
          </div>
          <label for=\"$\"${chkId}\" class=\"solve-toggle inline-flex items-center gap-2 text-xs px-2 py-1 rounded border ${solvedNow?'border-green-400 text-green-700':'border-slate-300 text-slate-600'}">
            <input type=\"checkbox\" id=\"$\"${chkId}\" class=\"solve-checkbox sr-only\" data-qid=\"${q.id}\" ${solvedNow?'checked':''} />
            <span class=\"cbx\" aria-hidden=\"true\"></span>
            <span class=\"solve-text\">${solvedNow? 'Resolvido' : 'Marcar resolvido'}</span>
          </label>
        </div>
        <div class=\"border-t border-slate-200\">
          <button class=\"accordion-toggle w-full flex justify-between items-center p-3 font-semibold text-left text-sm ${unlocked ? 'text-indigo-700' : 'text-gray-400 cursor-not-allowed'}" aria-expanded=\"false\" ${unlocked ? '' : 'disabled'}>
            <span>${unlocked ? 'Mostrar Solução' : 'Solução bloqueada'}</span>
            <span class=\"transform transition-transform duration-300 rotate-180\">▼</span>
          </button>
          <div class=\"accordion-content overflow-hidden transition-all duration-500 ease-in-out\" style=\"max-height: 0px\">
            <div class=\"p-4 bg-slate-800 text-white mono text-sm\">
              <pre><code>${q.solucao}</code></pre>
            </div>
          </div>
        </div>
      `;
      questoesContainer.appendChild(div);
    });
    try { window.initAccordions && window.initAccordions(); } catch (e) { console.error(e); }
    try { TOC && TOC.buildTOC && TOC.buildTOC(); } catch (e) { console.error(e); }
    Sidebar.markActiveRoute();
    document.title = `${(window.APP_NOME_DISCIPLINA||'Curso')} - Lista - ${data.titulo || 'Lista'}`;
    try {
      const listId2 = (file.split('/').pop()||file).replace(/\.json$/i,'');
      markVisited('lista', listId2);
      lsSet('lastRoute', `lista=${listId2}`);
      Sidebar.renderSidebar();

      // Scroll to top of content when loading a list (similar to aulas)
      const conteudo = document.getElementById('conteudo');
      if (conteudo) {
        conteudo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) { console.error(e); }
    function updateHeaderProgress(){ const set=getListaSolvedSet(listId); const total=section.querySelectorAll('.solve-toggle').length; const el=document.getElementById('lista-progress'); if (el) el.textContent = `${set.size}/${total}`; }
    function updateLocks(){ const set=getListaSolvedSet(listId); const allDone = set.size === section.querySelectorAll('.solve-toggle').length; section.querySelectorAll('.accordion-toggle').forEach((button)=>{
      const container = button.closest('.bg-white');
      const btnSolve = container ? container.querySelector('.solve-toggle') : null;
      const qid = btnSolve ? btnSolve.getAttribute('data-qid') : null;
      const solved = qid ? set.has(String(qid)) : false;
      const unlocked = meta.mostrar_solucoes || solved || allDone;
      button.disabled = !unlocked;
      const label = button.querySelector('span:first-child'); if (label) label.textContent = unlocked ? 'Mostrar Solução' : 'Solução bloqueada';
      button.classList.toggle('text-indigo-700', unlocked);
      button.classList.toggle('text-gray-400', !unlocked);
      button.classList.toggle('cursor-not-allowed', !unlocked);
    }); }
    section.querySelectorAll('.solve-checkbox').forEach((chk)=>{
      chk.addEventListener('change', ()=>{
        const qid = chk.getAttribute('data-qid'); const set=getListaSolvedSet(listId);
        if (chk.checked) set.add(String(qid)); else set.delete(String(qid));
        setListaSolvedSet(listId, set);
        updateHeaderProgress(); updateLocks(); updateListCardProgress(listId);
        const label = chk.closest('.solve-toggle')?.querySelector('.solve-text'); if (label) label.textContent = chk.checked ? 'Resolvido' : 'Marcar resolvido';
      });
    });
    const btnExpand = section.querySelector('#lista-expand'); const btnCollapse = section.querySelector('#lista-collapse'); const btnReset = section.querySelector('#lista-reset');
    if (btnExpand) btnExpand.addEventListener('click', ()=>{ section.querySelectorAll('.accordion-content').forEach((c)=>{ c.classList.add('is-open'); }); });
    if (btnCollapse) btnCollapse.addEventListener('click', ()=>{ section.querySelectorAll('.accordion-content').forEach((c)=>{ c.classList.remove('is-open'); }); });
    if (btnReset) btnReset.addEventListener('click', ()=>{ setListaSolvedSet(listId, new Set()); updateHeaderProgress(); updateLocks(); updateListCardProgress(listId); });
  } catch(err) { console.error('Erro ao carregar lista:', err); }
}