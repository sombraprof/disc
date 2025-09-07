Contribuindo
============

Ambiente
- Node LTS (18/20) e Python 3.
- `npm ci && npm run build` para gerar o CSS/JS.

Desenvolvimento local
- Linux/macOS: `./linux_start_server_open_browser.sh`
- Windows (PowerShell): `./windows_start_server_open_browser.ps1`

Padrões de dados
- `aulas/aulas.json` e `listas/listas.json` devem passar em `node scripts/validate-data.mjs`.
- Use `releaseDate` (YYYY-MM-DD) para controlar liberação automática e `tags` para filtros.

Qualidade
- Links: `node scripts/check-links.mjs`.
- A11y/Perf: ver relatórios do CI (pa11y/Lighthouse).

PRs
- Preencha o template, inclua screenshots quando relevante.

