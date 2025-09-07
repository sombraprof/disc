import { injectManifest } from 'workbox-build';
import path from 'path';

// Gera o service worker final com a lista de arquivos para precache
export async function buildServiceWorker(distDir) {
  const swSrc = path.join(process.cwd(), 'scripts', 'sw-src.js');
  const swDest = path.join(distDir, 'sw.js');

  try {
    await injectManifest({
      swSrc,
      swDest,
      globDirectory: distDir,
      globPatterns: [
        '**/*.{html,js,css,webmanifest}',
        'imagens/**/*.svg',
        'content/**/*.json'
      ],
      // Aumenta o limite do tamanho do arquivo para o precache
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
    });
    console.log(`Service worker gerado em ${swDest}`);
  } catch (error) {
    console.error('Não foi possível gerar o service worker:', error);
    throw error;
  }
}