export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' },
  moduleNameMapper: { '\\.(css|svg)$': '<rootDir>/tests/__mocks__/fileMock.js' },
  // Claude Code worktrees under .claude/ are stale copies of the repo.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/']
}
