# SPA Starter – Template de Disciplina/Curso

Este repositório é um projeto base (template) para hospedar materiais de aulas e listas de exercícios de disciplinas/treinamentos. Sua nova estrutura foi pensada para facilitar a criação de múltiplos materiais a partir de uma única base de código.

## Como Usar Este Template

A lógica principal é: **o código é separado do conteúdo**. Todo o conteúdo de uma disciplina fica isolado em seu próprio diretório dentro da pasta `content/`.

### 1. Crie o Diretório da Sua Disciplina

1.  Dentro da pasta `content/`, crie um novo diretório. O nome do diretório será o identificador da sua disciplina (ex: `calculo-1`, `algoritmos`, `direito-civil`).
2.  Copie a estrutura da pasta `content/disciplina-exemplo/` para o seu novo diretório.

### 2. Configure a Sua Disciplina

Abra o arquivo `config.json` dentro da pasta da sua disciplina (ex: `content/calculo-1/config.json`) e edite os campos:

-   `siteTitle`: O título que aparecerá na aba do navegador.
-   `courseName`: O nome completo da disciplina (ex: "Cálculo I").
-   `courseCode`: A sigla da disciplina (ex: "CALC1"), usada para gerar os ícones.
-   `themeColor`: A cor principal do tema para a interface e ícones.

### 3. Ative a Sua Disciplina

Abra o arquivo `js/modules/page-config.js` e altere a constante `ACTIVE_DISCIPLINE` para o nome da pasta que você criou no passo 1.

```javascript
// js/modules/page-config.js
export const ACTIVE_DISCIPLINE = 'calculo-1'; // <-- Mude aqui
export const CONTENT_BASE_PATH = `content/${ACTIVE_DISCIPLINE}`;
```

**Pronto!** Ao iniciar o projeto, ele carregará automaticamente todo o conteúdo e configuração da sua disciplina.

## Como Adicionar e Modificar Conteúdo

Todo o conteúdo fica no diretório da sua disciplina (ex: `content/calculo-1/`).

-   **Para Adicionar Aulas:**
    1.  Adicione uma nova entrada no arquivo `aulas.json`.
    2.  Crie o arquivo `.html` correspondente dentro da pasta `aulas/`.
-   **Para Adicionar Listas de Exercícios:**
    1.  Adicione uma nova entrada no arquivo `listas.json`.
    2.  Crie o arquivo `.json` da lista dentro da pasta `listas/`.

O sistema de validação de dados (`scripts/validate-data.mjs`) garantirá que você não esqueceu nenhum campo obrigatório.

## Estrutura de Arquivos

```
/
├── content/
│   ├── disciplina-exemplo/     # Um exemplo de como estruturar o conteúdo
│   │   ├── aulas/              # Arquivos HTML de cada aula
│   │   ├── listas/             # Arquivos JSON de cada lista
│   │   ├── aulas.json          # Manifesto com metadados de todas as aulas
│   │   ├── listas.json         # Manifesto com metadados de todas as listas
│   │   └── config.json         # Configurações específicas da disciplina
│   └── ... (outras disciplinas)
├── js/
│   ├── modules/
│   │   ├── page-config.js    # Arquivo para ativar a disciplina desejada
│   │   └── ... (módulos da aplicação)
│   └── main.js               # Ponto de entrada da aplicação
├── css/
├── politica_uso/
└── ... (outros arquivos do projeto)
```

## Desenvolvimento Local

Qualquer servidor HTTP estático funciona. Opções:

-   **Linux/macOS (script incluso):**
    -   `./linux_start_server_open_browser.sh`

-   **Windows (PowerShell):**
    -   `./windows_start_server_open_browser.ps1`

-   **Manual (qualquer SO):**
    1.  `npm ci && npm run build` (para gerar o CSS do Tailwind)
    2.  `python3 -m http.server 8080`
    3.  Acesse: `http://localhost:8080`

## Deploy no GitHub Pages

Um workflow (`.github/workflows/deploy.yml`) publica o conteúdo do repositório no GitHub Pages sempre que há um push na branch `main`.

## CI (Validações Automáticas)

O projeto inclui um workflow de Integração Contínua que valida os arquivos de dados (`aulas.json`, `listas.json`), verifica links quebrados e roda uma análise de performance com o Lighthouse a cada Pull Request.