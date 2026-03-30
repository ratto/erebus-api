/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        moduleResolution: 'bundler',
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        verbatimModuleSyntax: false,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
    }],
  },
  // Allow Jest to transform ESM-only packages in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(inversify|@inversifyjs|drizzle-orm|better-sqlite3)/)',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
  ],
};
