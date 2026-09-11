// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

/**
 * Layer-boundary zones (LLD §4.1). Dependencies point inward and downward only.
 * A violation of any zone below fails `npm run lint`.
 */
const layerZones = [
  // Domain knows nothing about the rest of the application.
  {
    target: './src/models',
    from: [
      './src/controllers',
      './src/services',
      './src/repositories',
      './src/routes',
      './src/middlewares',
      './src/validation',
      './src/infra',
      './src/container',
      './src/config',
      './src/errors',
    ],
    message: 'Domain (src/models) must not import from any other layer (LLD §4.1).',
  },
  // Application must not know the Presentation layer.
  {
    target: './src/services',
    from: ['./src/controllers', './src/routes', './src/middlewares', './src/validation'],
    message: 'Services must not import from the Presentation layer (LLD §4.1).',
  },
  // Infrastructure must not know Application or Presentation.
  {
    target: './src/repositories',
    from: [
      './src/controllers',
      './src/routes',
      './src/middlewares',
      './src/validation',
      './src/services',
    ],
    message: 'Repositories must not import from the Service or Presentation layers (LLD §4.1).',
  },
  // Presentation must not reach past the Service interface into data access.
  {
    target: './src/controllers',
    from: ['./src/repositories', './src/infra/database'],
    message: 'Controllers must not import repositories or the database layer (LLD §4.1).',
  },
];

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'data/**', 'docs/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      'import/no-restricted-paths': ['error', { zones: layerZones }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
        },
      ],
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSNonNullExpression',
          message: 'Non-null assertions are forbidden (LLD §11.2). Handle null explicitly.',
        },
      ],
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: false, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  {
    // `knex` may only be imported by the data-access layer (LLD §4.1).
    files: ['src/**/*.ts'],
    ignores: ['src/repositories/**', 'src/infra/database/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'knex',
              message:
                'Knex may only be imported by src/repositories/** and src/infra/database/** (LLD §4.1).',
            },
          ],
        },
      ],
    },
  },
  {
    // Express types must never leak into Application or Infrastructure (LLD §4.1, §8.2).
    files: ['src/services/**/*.ts', 'src/repositories/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'express',
              message: 'Express must not be imported by services or repositories (LLD §4.1).',
            },
          ],
        },
      ],
    },
  },
  {
    // `process.env` is read in exactly one module (LLD §12.2).
    files: ['src/**/*.ts', 'scripts/**/*.ts', 'netlify/**/*.ts'],
    ignores: ['src/config/env.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read configuration through src/config/env.ts only (LLD §12.2).',
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.spec.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    files: ['*.config.ts', 'eslint.config.js', 'knexfile.ts'],
    rules: {
      'no-restricted-exports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
