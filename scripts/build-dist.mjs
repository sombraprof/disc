import fs from 'fs/promises';
import path from 'path';
import { generateSitemap } from './generate-sitemap.mjs';
import { buildServiceWorker } from './build-sw.mjs';
import * as esbuild from 'esbuild';

const SRC_DIR = process.cwd();
const DIST_DIR = path.join(SRC_DIR, 'dist');
const SITE_URL = 'https://sombraprof.github.io'; // Base URL para o sitemap

// Função para gerar o ícone SVG para o card da disciplina
function generateSvgIcon(text, color = '#0f172a') {
  const size = 80;
  const radius = 8;
  const L = text.length > 4 ? 4 : text.length;
  const ratio = L <= 2 ? 0.5 : L === 3 ? 0.45 : 0.4;
  const fs = Math.round(size * ratio);
  const family = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${color}"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" dy=".06em"
            font-family="${family}" font-weight="700" font-size="${fs}" fill="#ffffff">${text}</text>
    </svg>`;
  return svg;
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function createLandingPage(disciplines) {
  const cards = disciplines.map(d => {
    const config = d.config || {};
    const courseName = config.courseName || d.slug;
    const courseCode = config.courseCode || d.slug.substring(0, 4).toUpperCase();
    const themeColor = config.themeColor || '#0f172a';
    const svgIcon = generateSvgIcon(courseCode, themeColor);

    return `
      <a href="./${d.slug}/" class="card">
        <div class="card-icon">
          ${svgIcon}
        </div>
        <div class="card-title">${courseName}</div>
      </a>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seleção de Disciplinas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; margin: 0; background-color: #f0f2f5; padding: 2rem; box-sizing: border-box; }
    .container { width: 100%; max-width: 900px; }
    h1 { color: #1e293b; text-align: center; margin-bottom: 2.5rem; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; }
    .card { display: block; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-decoration: none; color: #334155; transition: transform 0.2s, box-shadow 0.2s; overflow: hidden; text-align: center; }
    .card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
    .card-icon { padding: 1.5rem; }
    .card-title { font-weight: 700; padding: 0 1rem 1.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Minhas Disciplinas</h1>
    <div class="card-grid">
      ${cards}
    </div>
  </div>
</body>
</html>
  `;
  await fs.writeFile(path.join(DIST_DIR, 'index.html'), html);
}

async function build() {
  console.log('Iniciando o processo de build...');

  // 1. Limpa e cria o diretório dist
  console.log('Limpando o diretório dist...');
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(DIST_DIR, { recursive: true });

  // 2. Copia assets compartilhados (exceto JS, que será bundlado)
  console.log('Copiando assets compartilhados...');
  const sharedAssets = ['css', 'imagens', 'politica_uso', 'content', 'manifest.webmanifest'];
  for (const asset of sharedAssets) {
    const srcPath = path.join(SRC_DIR, asset);
    const destPath = path.join(DIST_DIR, asset);
    try {
        const stats = await fs.stat(srcPath);
        if (stats.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    } catch (error) {
        console.warn(`Aviso: Asset "${asset}" não encontrado. Pulando.`);
    }
  }

  // 3. Bundling de JavaScript com esbuild
  console.log('Bundling JavaScript com esbuild...');
  await esbuild.build({
    entryPoints: [path.join(SRC_DIR, 'js', 'main.js'), path.join(SRC_DIR, 'js', 'pwa.js')],
    bundle: true,
    minify: true,
    sourcemap: true,
    outdir: path.join(DIST_DIR, 'js'),
    format: 'esm',
  }).catch(() => process.exit(1));

  // 3. Lê as configurações de todas as disciplinas
  console.log('Lendo configurações das disciplinas...');
  const contentDir = path.join(SRC_DIR, 'content');
  const disciplineDirs = (await fs.readdir(contentDir, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const disciplinesWithConfig = [];
  for (const discipline of disciplineDirs) {
    const configPath = path.join(contentDir, discipline, 'config.json');
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      disciplinesWithConfig.push({ slug: discipline, config: JSON.parse(configContent) });
    } catch (e) {
      console.warn(`Aviso: Não foi possível ler o config.json para "${discipline}". Usando valores padrão.`);
      disciplinesWithConfig.push({ slug: discipline, config: {} });
    }
  }

  // 4. Cria um diretório para cada disciplina com seu próprio index.html
  console.log('Criando diretórios por disciplina...');
  for (const discipline of disciplinesWithConfig) {
    const disciplineDir = path.join(DIST_DIR, discipline.slug);
    await fs.mkdir(disciplineDir, { recursive: true });
    await fs.copyFile(path.join(SRC_DIR, 'index.html'), path.join(disciplineDir, 'index.html'));
    console.log(` - Diretório "${discipline.slug}" criado.`);
  }

  // 5. Cria a página de entrada (landing page) com os cards
  console.log('Criando a página de seleção de disciplinas...');
  await createLandingPage(disciplinesWithConfig);

  // 6. Gera sitemap e service worker
  console.log('Gerando sitemap e service worker...');
  await generateSitemap(DIST_DIR, SITE_URL);
  await buildServiceWorker(DIST_DIR);

  console.log('\nBuild concluído com sucesso!');
  console.log(`Diretório de saída: ${DIST_DIR}`);
}

build().catch(err => {
  console.error('\nOcorreu um erro durante o build:', err);
  process.exit(1);
});
