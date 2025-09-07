module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    worker: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Adicione regras personalizadas aqui, se necessário
  },
};
