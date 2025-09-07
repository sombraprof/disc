import { promises as fs } from 'node:fs';
import path from 'node:path';

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

async function fileExists(p) {
  try {
    const stat = await fs.stat(p);
    return true;
  } catch {
    // Se o arquivo não existe, tente ver se é um diretório com um index.html
    try {
      const stat = await fs.stat(path.join(p, 'index.html'));
      return true;
    } catch {
      return false;
    }
  }
}

async function checkLinksInFile(filePath, rootDir) {
  const html = await fs.readFile(filePath, 'utf-8');
  const links = html.match(/(?:href|src)="([^"#?]+)/g) || [];

  for (const link of links) {
    const url = link.replace(/(?:href|src)=\"/, '');
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
      continue;
    }

    // Resolve o caminho absoluto do link
    let absolutePath;
    if (url.startsWith('/')) {
      absolutePath = path.join(rootDir, url);
    } else {
      absolutePath = path.join(path.dirname(filePath), url);
    }

    if (!(await fileExists(absolutePath))) {
      err(`Link quebrado em ${path.relative(rootDir, filePath)} -> aponta para ${url}`);
    }
  }
}

async function main() {
  const distDir = path.join(process.cwd(), 'dist');
  if (!(await fileExists(distDir))) {
    warn('Diretório dist/ não encontrado. Pulando a verificação de links.');
    return;
  }

  console.log('Verificando links nos arquivos HTML em dist/...');

  async function findHtmlFiles(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await findHtmlFiles(fullPath);
      } else if (entry.name.endsWith('.html')) {
        await checkLinksInFile(fullPath, distDir);
      }
    }
  }

  await findHtmlFiles(distDir);

  console.log('\n----------------------------------------');
  for (const w of warnings) console.warn('WARN:', w);
  if (errors.length) {
    console.error(`\nEncontrados ${errors.length} link(s) quebrado(s):\n`);
    for (const e of errors) console.error('  - ', e);
    process.exit(1);
  } else {
    console.log('\nVerificação de links concluída sem erros.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });