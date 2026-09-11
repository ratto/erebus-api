import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'tests/**/*.spec.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      // Wiring and data access are excluded from the unit-test coverage budget:
      // LLD §10.4 assigns repositories to the integration suite and treats the
      // composition root and entrypoints as verified by that suite booting.
      // `src/app.ts`, `src/routes/**` and `src/infra/**` are the same category —
      // declarative assembly with no branch of its own.
      exclude: [
        'src/container/**',
        'src/server.ts',
        'src/app.ts',
        'src/routes/**',
        'src/infra/**',
        'src/repositories/**',
        'src/**/interfaces/**',
        'src/models/**',
        'scripts/**',
        'netlify/**',
        '**/*.spec.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        'src/services/**': {
          statements: 95,
          branches: 90,
        },
        'src/controllers/**': {
          statements: 90,
          branches: 85,
        },
      },
    },
  },
});
