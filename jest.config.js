module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(png|jpg|gif)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/app.js',
  ],
  coverageDirectory: 'coverage',
};
