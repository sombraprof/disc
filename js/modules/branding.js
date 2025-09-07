// Aplica branding, meta e favicons dinâmicos com base nas variáveis globais (js/config.js)
export function applyBranding() {
  const APP_NOME_DISCIPLINA = window.APP_NOME_DISCIPLINA || 'Curso';
  const APP_SIGLA = window.APP_SIGLA || 'DISC';
  const APP_NOME_PROFESSOR = window.APP_NOME_PROFESSOR || '';
  const APP_INSTITUICAO   = window.APP_INSTITUICAO || '';
  try {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', `${APP_NOME_DISCIPLINA} – Materiais, aulas e listas${APP_INSTITUICAO ? ` (${APP_INSTITUICAO})` : ''}.`);
  } catch (e) { console.error(e); }
  try {
    const sidebarTitle = document.querySelector('#sidebar-header h2 .label');
    if (sidebarTitle) sidebarTitle.textContent = APP_NOME_DISCIPLINA;
  } catch (e) { console.error(e); }
  try {
    const sidebarSub = document.querySelector('#sidebar-header p .label');
    if (sidebarSub) sidebarSub.textContent = APP_INSTITUICAO || sidebarSub.textContent || '';
  } catch (e) { console.error(e); }
  try {
    const headerBrand = document.getElementById('brand-header');
    if (headerBrand) headerBrand.textContent = `${APP_NOME_DISCIPLINA}${APP_NOME_PROFESSOR ? ' · ' + APP_NOME_PROFESSOR : ''}`;
  } catch (e) { console.error(e); }
  try {
    if (!document.title || /Curso\s*-\s*Materiais/i.test(document.title)) {
      document.title = APP_INSTITUICAO ? `${APP_NOME_DISCIPLINA} - ${APP_INSTITUICAO}` : APP_NOME_DISCIPLINA;
    }
  } catch (e) { console.error(e); }
  try { document.querySelectorAll('.brand-ph').forEach(el => el.classList.remove('brand-ph')); } catch (e) { console.error(e); }

  try {
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const bg = themeMeta ? themeMeta.getAttribute('content') : '#0f172a';
    const fg = '#ffffff';
    function makeSvg(text, size, radius) {
      const L = text.length;
      let ratio = L <= 2 ? 0.58 : L === 3 ? 0.52 : L === 4 ? 0.44 : 0.38;
      if (size <= 48) ratio *= 0.85;
      const fs = Math.round(size * ratio);
      const family = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
      const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">\n  <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${bg}"/>\n  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" dy=".06em"\n        font-family="${family}" font-weight="700" font-size="${fs}" fill="${fg}">${text}</text>\n</svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }
    function svgToPng(svgUrl, size) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, size, size);
            resolve(canvas.toDataURL('image/png'));
          } catch { resolve(''); }
        };
        img.onerror = () => resolve('');
        img.src = svgUrl;
      });
    }
    const fav = document.getElementById('favicon');
    const fav16 = document.getElementById('favicon-16');
    const fav32 = document.getElementById('favicon-32');
    const fav48 = document.getElementById('favicon-48');
    const favPng = document.getElementById('favicon-png');
    const a120 = document.getElementById('apple-icon-120');
    const a152 = document.getElementById('apple-icon-152');
    const a167 = document.getElementById('apple-icon-167');
    const a180 = document.getElementById('apple-icon-180');
    const APP_SIGLA = window.APP_SIGLA || 'DISC';
    const svg16  = makeSvg(APP_SIGLA, 16,  Math.round(16*0.18));
    const svg32  = makeSvg(APP_SIGLA, 32,  Math.round(32*0.18));
    const svg48  = makeSvg(APP_SIGLA, 48,  Math.round(48*0.18));
    const svg96  = makeSvg(APP_SIGLA, 96,  Math.round(96*0.18));
    const svg120 = makeSvg(APP_SIGLA, 120, Math.round(120*0.18));
    const svg152 = makeSvg(APP_SIGLA, 152, Math.round(152*0.18));
    const svg167 = makeSvg(APP_SIGLA, 167, Math.round(167*0.18));
    const svg180 = makeSvg(APP_SIGLA, 180, Math.round(180*0.18));
    const svg192 = makeSvg(APP_SIGLA, 192, Math.round(192*0.18));
    if (fav)  fav.setAttribute('href', svg192);
    if (fav16) { svgToPng(svg16, 16).then((png)=>{ if (png) fav16.setAttribute('href', png); }); }
    if (fav32) { svgToPng(svg32, 32).then((png)=>{ if (png) fav32.setAttribute('href', png); }); }
    if (fav48) { svgToPng(svg48, 48).then((png)=>{ if (png) fav48.setAttribute('href', png); }); }
    if (favPng) { svgToPng(svg192, 192).then((png)=>{ if (png) favPng.setAttribute('href', png); }); }
    if (a120) { svgToPng(svg120, 120).then((png)=>{ if (png) a120.setAttribute('href', png); }); }
    if (a152) { svgToPng(svg152, 152).then((png)=>{ if (png) a152.setAttribute('href', png); }); }
    if (a167) { svgToPng(svg167, 167).then((png)=>{ if (png) a167.setAttribute('href', png); }); }
    if (a180) { svgToPng(svg180, 180).then((png)=>{ if (png) a180.setAttribute('href', png); }); }
  } catch (e) { console.error(e); }
}

