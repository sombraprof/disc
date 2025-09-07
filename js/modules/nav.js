export function setupMobileNav() {
  const btn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const links = document.getElementById('sidebar-links');
  const mainRoot = document.getElementById('main-root');
  let lastFocused = null;

  if (!btn || !sidebar || !overlay) return;

  function openSidebar() {
    lastFocused = document.activeElement;
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    if (mainRoot) mainRoot.setAttribute('aria-hidden', 'true');
    const focusable = sidebar.querySelector('a, button, input, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }
  function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    if (mainRoot) mainRoot.removeAttribute('aria-hidden');
    if (lastFocused && typeof lastFocused.focus === 'function') { try { lastFocused.focus(); } catch (e) { console.error(e); } }
  }
  btn.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    if (!isOpen) return;
    if (e.key === 'Tab') {
      const focusables = Array.from(sidebar.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])')).filter(el=>!el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length-1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  if (links) {
    links.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.tagName === 'A') closeSidebar();
    });
  }
}

