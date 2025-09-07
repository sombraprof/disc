
function getCourseFromURL() {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('course');
    return courseId;
}

function redirectToHome() {
    if (!window.location.pathname.endsWith('home.html')) {
        window.location.href = '/home.html';
    }
}

const activeCourse = getCourseFromURL();

if (!activeCourse) {
    redirectToHome();
}

export const ACTIVE_DISCIPLINE = activeCourse;
export const CONTENT_BASE_PATH = `content/${ACTIVE_DISCIPLINE}`;

export const AULAS_JSON_PATH = `/${CONTENT_BASE_PATH}/aulas/aulas.json`;
export const LISTAS_JSON_PATH = `/${CONTENT_BASE_PATH}/listas/listas.json`;

export const AULAS_DIR = `/${CONTENT_BASE_PATH}/aulas`;
export const LISTAS_DIR = `/${CONTENT_BASE_PATH}/listas`;

export const AULAS_SCHEMA_PATH = '/schemas/aulas.schema.json';
export const LISTAS_SCHEMA_PATH = '/schemas/listas.schema.json';
