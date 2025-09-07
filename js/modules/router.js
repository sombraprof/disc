import * as Aulas from './aulas.js';
import * as Listas from './listas.js';
import { showHomeAnchor, notFound } from './ui.js';
import { CONTENT_BASE_PATH } from './page-config.js';

export function initRouter() {
  // Delegate navigation on anchor clicks to ensure hash routing triggers correctly
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest('a[href^="#aula="] , a[href^="#lista="]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    if (window.location.hash === href) {
      // Force handle if same hash
      routeByHashInternal();
    } else {
      window.location.hash = href;
    }
  });

  function routeByHashInternal() {
    const raw = window.location.hash;
    const hash = raw.replace(/^#/, "");
    if (hash.includes("=")) {
      const [key, value] = hash.split("=");
      const id = decodeURIComponent(value || "");
      if (key === "aula" && id) {
        const file = `/${CONTENT_BASE_PATH}/aulas/${id}.html`;
        fetch(file, { method: "HEAD" })
          .then((res) => (res.ok ? Aulas.loadAula(file) : notFound('Aula não encontrada.')))
          .catch(() => notFound('Aula não encontrada.'));
      } else if (key === "lista" && id) {
        const file = `${id}.json`;
        fetch(`/${CONTENT_BASE_PATH}/listas/${file}`, { method: "HEAD" })
          .then((res) => (res.ok ? Listas.loadListaDetalhe(file) : notFound('Lista não encontrada.')))
          .catch(() => notFound('Lista não encontrada.'));
      }
    } else {
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          showHomeAnchor(hash);
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      try {
        const last = localStorage.getItem(`${(window.APP_STORAGE_PREFIX||'app')}:lastRoute`);
        if (last) {
          const [k, v] = last.split("=");
          const newHash = `#${k}=${encodeURIComponent(v)}`;
          if (newHash !== window.location.hash) {
            window.location.hash = newHash;
          }
        }
      } catch (e) { console.error(e); }
    }
  }

  routeByHashInternal();
  window.addEventListener('hashchange', routeByHashInternal);
}