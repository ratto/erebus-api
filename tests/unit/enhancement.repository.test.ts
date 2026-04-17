import 'reflect-metadata';
import { describe, it, expect } from '@jest/globals';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { EnhancementRepository } from '../../src/repositories/enhancement.repository.ts';

function buildTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle({ client: sqlite });
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS enhancements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      tipo TEXT NOT NULL,
      custo INTEGER NOT NULL
    )
  `);
  return { sqlite, db };
}

function seedEnhancements(sqlite: Database.Database) {
  const stmt = sqlite.prepare(
    `INSERT INTO enhancements (nome, descricao, tipo, custo) VALUES (?, ?, ?, ?)`
  );
  stmt.run('Ambidestria', 'Usa ambas as mãos.', 'positivo', 5);
  stmt.run('Coragem', 'Resistência ao medo.', 'positivo', 2);
  stmt.run('Reflexos Rápidos', 'Reflexos excepcionais.', 'positivo', 3);
  stmt.run('Aleijado', 'Deficiência física.', 'negativo', -3);
  stmt.run('Cegueira', 'Não enxerga.', 'negativo', -6);
}

describe('EnhancementRepository', () => {
  describe('findAll()', () => {
    it('returns empty data when there are no enhancements', async () => {
      const { db } = buildTestDb();
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns all enhancements without filters', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ page: 1, limit: 20 });

      expect(result.total).toBe(5);
      expect(result.data).toHaveLength(5);
    });

    it('filters by tipo=positivo', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ tipo: 'positivo', page: 1, limit: 20 });

      expect(result.total).toBe(3);
      expect(result.data.every((e) => e.tipo === 'positivo')).toBe(true);
    });

    it('filters by tipo=negativo', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ tipo: 'negativo', page: 1, limit: 20 });

      expect(result.total).toBe(2);
      expect(result.data.every((e) => e.tipo === 'negativo')).toBe(true);
      expect(result.data.every((e) => e.custo < 0)).toBe(true);
    });

    it('searches by nome (case-insensitive, partial)', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ search: 'ambi', page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.nome).toBe('Ambidestria');
    });

    it('searches case-insensitively', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ search: 'CORAGEM', page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.nome).toBe('Coragem');
    });

    it('returns empty data when search matches nothing', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ search: 'zzznomatch', page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('applies pagination correctly', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const page1 = await repo.findAll({ page: 1, limit: 2 });
      const page2 = await repo.findAll({ page: 2, limit: 2 });
      const page3 = await repo.findAll({ page: 3, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page2.data).toHaveLength(2);
      expect(page3.data).toHaveLength(1);
    });

    it('returns correct page and limit in response', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ page: 2, limit: 3 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(3);
    });

    it('each enhancement has the correct shape', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ page: 1, limit: 20 });
      const enhancement = result.data[0]!;

      expect(typeof enhancement.id).toBe('number');
      expect(typeof enhancement.nome).toBe('string');
      expect(typeof enhancement.descricao).toBe('string');
      expect(['positivo', 'negativo']).toContain(enhancement.tipo);
      expect(typeof enhancement.custo).toBe('number');
    });

    it('combines tipo and search filters', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll({ tipo: 'positivo', search: 'reflex', page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.nome).toBe('Reflexos Rápidos');
      expect(result.data[0]?.tipo).toBe('positivo');
    });
  });
});
