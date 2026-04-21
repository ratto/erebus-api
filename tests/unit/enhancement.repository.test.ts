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
    it('returns empty array when there are no enhancements', async () => {
      const { db } = buildTestDb();
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll();

      expect(result).toEqual([]);
    });

    it('returns all enhancements', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll();

      expect(result).toHaveLength(5);
    });

    it('each enhancement has the correct shape', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll();
      const enhancement = result[0]!;

      expect(typeof enhancement.id).toBe('number');
      expect(typeof enhancement.nome).toBe('string');
      expect(typeof enhancement.descricao).toBe('string');
      expect(['positivo', 'negativo']).toContain(enhancement.tipo);
      expect(typeof enhancement.custo).toBe('number');
    });

    it('returns enhancements with positivo tipo', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll();
      const positivos = result.filter((e) => e.tipo === 'positivo');

      expect(positivos).toHaveLength(3);
      expect(positivos.every((e) => e.tipo === 'positivo')).toBe(true);
    });

    it('returns enhancements with negativo tipo', async () => {
      const { sqlite, db } = buildTestDb();
      seedEnhancements(sqlite);
      const repo = new EnhancementRepository(db);

      const result = await repo.findAll();
      const negativos = result.filter((e) => e.tipo === 'negativo');

      expect(negativos).toHaveLength(2);
      expect(negativos.every((e) => e.custo < 0)).toBe(true);
    });
  });
});
