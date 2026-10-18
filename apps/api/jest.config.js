/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@tavallin/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          paths: {
            '@tavallin/shared': ['../../packages/shared/src/index.ts'],
          },
        },
      },
    ],
  },
  setupFilesAfterEnv: [],
  coverageDirectory: '../coverage',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/index.ts',
    '!**/migrations/**',
    '!**/seeders/**',
  ],
  testTimeout: 30000,
};
