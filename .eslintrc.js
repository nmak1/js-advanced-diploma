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
    'max-classes-per-file': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-syntax': 'off', // Отключаем правило для итераторов
    'max-len': ['error', { code: 120 }], // Увеличиваем максимальную длину строки
    'no-shadow': ['error', { allow: ['themes'] }], // Разрешаем переопределение 'themes'
    'class-methods-use-this': 'off', // Отключаем правило для статических методов
  },
  ignorePatterns: ['dist/', 'node_modules/'], // Игнорируем эти папки
};
