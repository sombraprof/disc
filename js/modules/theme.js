export function setupTheme() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const hlLight = document.getElementById('hljs-theme-light');
  const hlDark = document.getElementById('hljs-theme-dark');

  function apply(theme) {
    const dark = theme === 'dark';
    root.classList.toggle('theme-dark', dark);
    if (btn) {
      btn.setAttribute('aria-pressed', String(dark));
      btn.innerHTML = dark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    }
    if (hlLight && hlDark) {
      hlLight.disabled = dark;
      hlDark.disabled = !dark;
    }
    try { localStorage.setItem(`${(window.APP_STORAGE_PREFIX||'app')}:theme`, theme); } catch (e) { console.error(e); }
  }

  // Initial
  let theme = 'light';
  try {
    const saved = localStorage.getItem(`${(window.APP_STORAGE_PREFIX||'app')}:theme`);
    if (saved === 'dark' || saved === 'light') theme = saved;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch (e) { console.error(e); }
  apply(theme);

  if (btn) {
    btn.addEventListener('click', () => {
      theme = (theme === 'dark') ? 'light' : 'dark';
      apply(theme);
      if (window.hljs) { try { window.hljs.highlightAll(); } catch (e) { console.error(e); } }
    });
  }
}

