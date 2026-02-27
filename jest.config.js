export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' },
  moduleNameMapper: { '\\.(css|svg)$': '<rootDir>/tests/__mocks__/fileMock.js' }
}
