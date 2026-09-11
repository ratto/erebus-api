import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    // `scripts/**` is included so the seed derivation rules — pure functions that
    // decide what reaches the catalogue (ADR-003 §3) — are unit-tested like any
    // mapper. They stay outside the coverage budget below, as LLD §10.4 requires.
    include: ['src/**/*.spec.ts', 'tests/**/*.spec.ts', 'scripts/**/*.spec.ts'],
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
        // Type-only domain files emit no runtime code. `src/models/mappers/**`
        // is deliberately **not** excluded: LLD §10.4 budgets it at 100/100, and
        // US-03 ships the first real mapper.
        'src/models/rows/**',
        'src/models/entities/**',
        'src/models/dtos/**',
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
        'src/models/mappers/**': {
          statements: 100,
          branches: 100,
        },
      },
    },
  },
});
