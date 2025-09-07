import { promises as fs } from 'node:fs';
import path from 'node:path';

// Gera o sitemap.xml com base no conteúdo do diretório dist
export async function generateSitemap(distDir, siteUrl) {
  const pages = [];

  async function findHtmlFiles(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await findHtmlFiles(fullPath);
      } else if (entry.name === 'index.html') {
        const relativePath = path.relative(distDir, fullPath);
        const urlPath = relativePath.replace(/\\/g, '/').replace(/index\.html$/, '');
        pages.push(urlPath);
      }
    }
  }

  await findHtmlFiles(distDir);

  const urls = pages.map(page => {
    const fullUrl = new URL(page, siteUrl).href;
    return `  <url><loc>${fullUrl}</loc></url>`;
  }).join('\n');

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemapContent);
  console.log('sitemap.xml gerado com sucesso.');
}