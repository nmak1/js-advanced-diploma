module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-plusplus': 'off',
    'no-console': 'off',
    'no-alert': 'off',
    'import/extensions': 'off',
    'no-param-reassign': 'off',
  },
};
