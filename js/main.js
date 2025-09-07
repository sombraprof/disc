import { CONTENT_BASE_PATH } from './modules/page-config.js';

// Modular: usar implementação de branding em módulo dedicado
import { applyBranding as brandingApply } from './modules/branding.js';

// Quando o DOM estiver pronto, carrega aulas e resolve hash
import { setupTheme as themeSetup } from './modules/theme.js';
import { setupMobileNav as navSetup } from './modules/nav.js';
import { setupControls } from './modules/controls.js';
import { setupTOCToggle } from './modules/toc.js';
import { setupProgressMenu } from './modules/progress.js';
import * as Sidebar from './modules/sidebar.js';
import * as Aulas from './modules/aulas.js';
import * as Listas from './modules/listas.js';
import * as Router from './modules/router.js';

// Função para alternar favoritos (pins)
window.togglePin = function(type, id) {
  const { getPins, setPins } = Sidebar;
  const pins = getPins();
  const key = `${type}:${id}`;
  const index = pins.indexOf(key);

  if (index > -1) {
    // Remove o pin
    pins.splice(index, 1);
  } else {
    // Adiciona o pin
    pins.push(key);
  }

  setPins(pins);

  // Re-renderiza a sidebar para refletir as mudanças
  Sidebar.renderSidebar();
  Sidebar.markActiveRoute();
};

async function initializeApp() {
  // Carrega a configuração da disciplina primeiro
  try {
    const configRes = await fetch(`/${CONTENT_BASE_PATH}/config.json`);
    const disciplineConfig = await configRes.json();

    // Sobrescreve as variáveis globais com a configuração da disciplina
    window.APP_NOME_DISCIPLINA = disciplineConfig.courseName || window.APP_NOME_DISCIPLINA || 'Curso';
    window.APP_SIGLA = disciplineConfig.courseCode || window.APP_SIGLA || 'DISC';
    document.title = disciplineConfig.siteTitle || window.APP_NOME_DISCIPLINA;

    // Sobrescreve informações específicas da universidade/disciplina
    if (disciplineConfig.instituicao) {
      window.APP_INSTITUICAO = disciplineConfig.instituicao;
    }
    if (disciplineConfig.contatoEmail) {
      window.APP_CONTATO_EMAIL = disciplineConfig.contatoEmail;
    }
    if (disciplineConfig.nomeProfessor) {
      window.APP_NOME_PROFESSOR = disciplineConfig.nomeProfessor;
    }
    if (disciplineConfig.semestre) {
      window.APP_SEMESTRE = disciplineConfig.semestre;
    }

    // Define a cor do tema a partir da configuração
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta && disciplineConfig.themeColor) {
      themeMeta.setAttribute('content', disciplineConfig.themeColor);
    }

  } catch (err) {
    console.error(`Falha ao carregar configuração da disciplina de /${CONTENT_BASE_PATH}/config.json`, err);
    // Opcional: mostrar uma mensagem de erro na tela
    const mainContent = document.getElementById('main-content');
    if(mainContent) mainContent.innerHTML = '<div class="p-4 text-red-700 bg-red-100 border border-red-400 rounded">Erro Crítico: Não foi possível carregar a configuração da disciplina.</div>'
    return; // Impede o resto da inicialização
  }

  // Agora que a configuração está carregada, aplica o branding e inicializa o resto
  try { brandingApply(); } catch(e){ console.error(e); }
  // Inicializações resilientes em try/catch para não interromper as demais
  try { themeSetup(); } catch (e) { console.error(e); }
  try { navSetup(); } catch (e) { console.error(e); }
  try { setupControls(); } catch (e) { console.error(e); }
  try { setupTOCToggle(); } catch (e) { console.error(e); }
  try { setupProgressMenu(); } catch (e) { console.error(e); }
  // Outras inicializações que dependem do DOM e da configuração
    try { Sidebar.setupSidebarInteractions(); } catch(e){ console.error(e); }
  try { Aulas.loadAulas(); } catch (e) { console.error(e); }
  try { Listas.loadListas(); } catch (e) { console.error(e); }
  try { Router.initRouter(); } catch (e) { console.error(e); }
}


document.addEventListener("DOMContentLoaded", () => {
  try {
    initializeApp();
  } catch (error) {
    console.error('Erro crítico na inicialização:', error);
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = '<div class="p-4 text-red-700 bg-red-100 border border-red-400 rounded">Erro crítico na inicialização da aplicação. Verifique o console para mais detalhes.</div>';
    }
  }
});