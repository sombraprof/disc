export function lsGet(suffix) {
  try { return localStorage.getItem(`${(window.APP_STORAGE_PREFIX || 'app')}:${suffix}`); } catch(_) { return null; }
}

export function lsSet(suffix, value) {
  try { localStorage.setItem(`${(window.APP_STORAGE_PREFIX || 'app')}:${suffix}`, value); } catch (e) { console.error(e); }
}

