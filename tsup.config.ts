import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/app.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  external: ['better-sqlite3'],
});
