#!/usr/bin/env node
// Validação manual dos JSONs de aulas e listas conforme convenções do projeto
import { promises as fs } from 'node:fs';
import path from 'node:path';

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function isHttpUrl(u) { return /^https?:\/\/./i.test(u) || /^\/\//.test(u); }

async function fileExists(p) { try { await fs.access(p); return true; } catch { return false; } }

function uniqueBy(arr, getter) {
  const seen = new Map();
  for (const item of arr) {
    const key = getter(item);
    if (seen.has(key)) return { ok: false, dup: key };
    seen.set(key, true);
  }
  return { ok: true };
}

async function validateAulas(disciplinePath, disciplineName) {
  const p = path.join(disciplinePath, 'aulas.json');
  const raw = await fs.readFile(p, 'utf8');
  let data; try { data = JSON.parse(raw); } catch (e) { err(`[${disciplineName}] aulas.json inválido: ${e.message}`); return; }
  if (!Array.isArray(data)) { err(`[${disciplineName}] aulas.json deve ser um array`); return; }

  const ids = [];
  const arquivos = [];
  for (let i = 0; i < data.length; i++) {
    const a = data[i];
    const where = `[${disciplineName}] aulas[${i}]`;
    if (!a || typeof a !== 'object') { err(`${where} deve ser um objeto`); continue; }
    if (!a.id || typeof a.id !== 'string') err(`${where}.id ausente ou inválido`);
    if (!a.titulo || typeof a.titulo !== 'string') err(`${where}.titulo ausente ou inválido`);
    if (!a.descricao || typeof a.descricao !== 'string') err(`${where}.descricao ausente ou inválido`);
    if (!a.arquivo || typeof a.arquivo !== 'string' || !/\.html$/i.test(a.arquivo)) err(`${where}.arquivo deve terminar com .html`);
    if (a.ativo !== undefined && typeof a.ativo !== 'boolean') err(`${where}.ativo deve ser boolean`);
    if (a.styles && !Array.isArray(a.styles)) err(`${where}.styles deve ser array de strings`);
    if (a.scripts && !Array.isArray(a.scripts)) err(`${where}.scripts deve ser array de strings`);
    if (a.tags && !Array.isArray(a.tags)) err(`${where}.tags deve ser array de strings`);

    if (typeof a.id === 'string') ids.push(a.id.toLowerCase());
    if (typeof a.arquivo === 'string') arquivos.push(a.arquivo.toLowerCase());

    // Existência de arquivo
    if (typeof a.arquivo === 'string') {
      const ap = path.join(disciplinePath, 'aulas', a.arquivo);
      const ex = await fileExists(ap);
      if (!ex) err(`${where}.arquivo não encontrado: ${path.relative(process.cwd(), ap)}`);
    }
    // Checar assets locais
    for (const list of ['styles', 'scripts']) {
      const xs = Array.isArray(a[list]) ? a[list] : [];
      for (const href of xs) {
        if (typeof href !== 'string') { err(`${where}.${list} contém item não-string`); continue; }
        if (isHttpUrl(href)) continue;
        const assetPath = path.join(process.cwd(), href.replace(/^\.?\//, ''));
        const ex = await fileExists(assetPath);
        if (!ex) warn(`${where}.${list}: asset não encontrado (link relativo): ${href}`);
      }
    }
  }
  const u1 = uniqueBy(ids, (x) => x);
  if (!u1.ok) err(`[${disciplineName}] IDs de aulas duplicados: ${u1.dup}`);
  const u2 = uniqueBy(arquivos, (x) => x);
  if (!u2.ok) err(`[${disciplineName}] Arquivos de aulas duplicados: ${u2.dup}`);
}

async function validateListas(disciplinePath, disciplineName) {
  const p = path.join(disciplinePath, 'listas.json');
  const raw = await fs.readFile(p, 'utf8');
  let data; try { data = JSON.parse(raw); } catch (e) { err(`[${disciplineName}] listas.json inválido: ${e.message}`); return; }
  if (!Array.isArray(data)) { err(`[${disciplineName}] listas.json deve ser um array`); return; }

  const arquivos = [];
  for (let i = 0; i < data.length; i++) {
    const l = data[i];
    const where = `[${disciplineName}] listas[${i}]`;
    if (!l || typeof l !== 'object') { err(`${where} deve ser um objeto`); continue; }
    if (!l.titulo || typeof l.titulo !== 'string') err(`${where}.titulo ausente ou inválido`);
    if (!l.descricao || typeof l.descricao !== 'string') err(`${where}.descricao ausente ou inválido`);
    if (!l.arquivo || typeof l.arquivo !== 'string' || !/\.json$/i.test(l.arquivo)) err(`${where}.arquivo deve terminar com .json`);
    if (l.mostrar_solucoes !== undefined && typeof l.mostrar_solucoes !== 'boolean') err(`${where}.mostrar_solucoes deve ser boolean`);
    if (typeof l.arquivo === 'string') arquivos.push(l.arquivo.toLowerCase());

    if (typeof l.arquivo === 'string') {
      const lp = path.join(disciplinePath, 'listas', l.arquivo);
      const ex = await fileExists(lp);
      if (!ex) err(`${where}.arquivo não encontrado: ${path.relative(process.cwd(), lp)}`);
      else {
        // Validar estrutura básica do arquivo da lista
        try {
          const lr = JSON.parse(await fs.readFile(lp, 'utf8'));
          if (!lr || typeof lr !== 'object') err(`${l.arquivo}: JSON deve ser objeto`);
          if (!lr.id || typeof lr.id !== 'string') err(`${l.arquivo}: id ausente ou inválido`);
          if (!Array.isArray(lr.questoes)) err(`${l.arquivo}: questoes deve ser array`);
        } catch (e) {
          err(`${l.arquivo}: JSON inválido (${e.message})`);
        }
      }
    }
  }
  const u = uniqueBy(arquivos, (x) => x);
  if (!u.ok) err(`[${disciplineName}] Arquivos de listas duplicados: ${u.dup}`);
}

async function main() {
  const root = process.cwd();
  const contentDir = path.join(root, 'content');
  const disciplines = (await fs.readdir(contentDir, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Validando ${disciplines.length} disciplina(s) encontradas em "content/"...\n`);

  for (const discipline of disciplines) {
    const disciplinePath = path.join(contentDir, discipline);
    
    if (await fileExists(path.join(disciplinePath, 'aulas.json'))) {
      await validateAulas(disciplinePath, discipline);
    } else {
      warn(`[${discipline}] Arquivo aulas.json não encontrado. Pulando validação de aulas.`);
    }

    if (await fileExists(path.join(disciplinePath, 'listas.json'))) {
      await validateListas(disciplinePath, discipline);
    } else {
      warn(`[${discipline}] Arquivo listas.json não encontrado. Pulando validação de listas.`);
    }
  }

  console.log('\n----------------------------------------');
  for (const w of warnings) console.warn('WARN:', w);
  if (errors.length) {
    console.error(`\nEncontrados ${errors.length} erro(s) de validação:\n`);
    for (const e of errors) console.error('  - ', e);
    process.exit(1);
  } else {
    console.log('\nValidação concluída sem erros.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
