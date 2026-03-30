import 'reflect-metadata';
import { describe, it, expect } from '@jest/globals'
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { SkillRepository } from '../../src/repositories/skill.repository.ts';

// Inline schema for in-memory test DB
const skillsTable = sqliteTable('skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  grupo: text('grupo'),
  atributoBase: text('atributo_base'),
  apenasComTreinamento: integer('apenas_com_treinamento', { mode: 'boolean' }).notNull().default(false),
  sinergia: text('sinergia'),
  descricao: text('descricao').notNull(),
});

function buildTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle({ client: sqlite });
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      grupo TEXT,
      atributo_base TEXT,
      apenas_com_treinamento INTEGER NOT NULL DEFAULT 0,
      sinergia TEXT,
      descricao TEXT NOT NULL
    )
  `);
  return { sqlite, db };
}

describe('SkillRepository', () => {
  describe('findAll()', () => {
    it('returns an empty array when there are no skills', async () => {
      const { db } = buildTestDb();
      const repo = new SkillRepository(db);

      const result = await repo.findAll();

      expect(result).toEqual([]);
    });

    it('returns all skills from the database', async () => {
      const { sqlite, db } = buildTestDb();
      sqlite.prepare(
        `INSERT INTO skills (nome, grupo, atributo_base, apenas_com_treinamento, sinergia, descricao)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('Espada', 'Combate', 'DEX', 1, null, 'Uso de espadas');
      sqlite.prepare(
        `INSERT INTO skills (nome, grupo, atributo_base, apenas_com_treinamento, sinergia, descricao)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('Magia', 'Arcano', 'INT', 1, 'Conhecimento Arcano (Arcano)', 'Lançar feitiços');
      sqlite.prepare(
        `INSERT INTO skills (nome, grupo, atributo_base, apenas_com_treinamento, sinergia, descricao)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('Corrida', null, 'AGI', 0, null, 'Correr rapidamente');

      const repo = new SkillRepository(db);
      const result = await repo.findAll();

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        nome: 'Espada',
        grupo: 'Combate',
        atributoBase: 'DEX',
        apenasComTreinamento: true,
        sinergia: null,
        descricao: 'Uso de espadas',
      });
      expect(result[1]).toMatchObject({
        nome: 'Magia',
        grupo: 'Arcano',
        atributoBase: 'INT',
        apenasComTreinamento: true,
        sinergia: 'Conhecimento Arcano (Arcano)',
        descricao: 'Lançar feitiços',
      });
      expect(result[2]).toMatchObject({
        nome: 'Corrida',
        grupo: null,
        atributoBase: 'AGI',
        apenasComTreinamento: false,
        sinergia: null,
        descricao: 'Correr rapidamente',
      });
    });

    it('each skill has the correct shape with all required fields', async () => {
      const { sqlite, db } = buildTestDb();
      sqlite.prepare(
        `INSERT INTO skills (nome, grupo, atributo_base, apenas_com_treinamento, sinergia, descricao)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('Natação', 'Físico', 'CON', 0, null, 'Nadar em águas abertas');

      const repo = new SkillRepository(db);
      const result = await repo.findAll();
      const skill = result[0]!;

      expect(typeof skill.id).toBe('number');
      expect(typeof skill.nome).toBe('string');
      expect(typeof skill.descricao).toBe('string');
      expect(typeof skill.apenasComTreinamento).toBe('boolean');
      expect('grupo' in skill).toBe(true);
      expect('atributoBase' in skill).toBe(true);
      expect('sinergia' in skill).toBe(true);
    });
  });
});
