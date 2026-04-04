import 'reflect-metadata';
import { describe, it, expect } from '@jest/globals';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { WeaponRepository } from '../../src/repositories/weapon.repository.ts';

function buildTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle({ client: sqlite });
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS weapons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      dano TEXT NOT NULL,
      iniciativa TEXT NOT NULL,
      fonte TEXT NOT NULL,
      tipo TEXT NOT NULL,
      tipo_dano TEXT,
      ocultabilidade TEXT,
      alcance_medio TEXT,
      alcance_max TEXT,
      calibre TEXT,
      alcance_efetivo TEXT,
      rof TEXT,
      pente TEXT
    )
  `);
  return { sqlite, db };
}

describe('WeaponRepository', () => {
  describe('findAll()', () => {
    it('returns an empty array when there are no weapons', async () => {
      const { db } = buildTestDb();
      const repo = new WeaponRepository(db);

      const result = await repo.findAll();

      expect(result).toEqual([]);
    });

    it('returns all weapons when no tipo filter is provided', async () => {
      const { sqlite, db } = buildTestDb();
      sqlite.prepare(
        `INSERT INTO weapons (nome, categoria, dano, iniciativa, fonte, tipo, tipo_dano, ocultabilidade)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('Faca', 'Adaga', '1d3', '-3', 'Módulo Básico v1.01', 'branca', 'Corte/Perfuração', 'Bolso');
      sqlite.prepare(
        `INSERT INTO weapons (nome, categoria, dano, iniciativa, fonte, tipo, calibre, alcance_efetivo, rof, pente, ocultabilidade)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('Pistola 9mm', 'Pistola', '1d6+2', '-2', 'Guia de Armas de Fogo', 'fogo', '9mm', '25m', '1', '15', 'Casaco');

      const repo = new WeaponRepository(db);
      const result = await repo.findAll();

      expect(result).toHaveLength(2);
    });

    it('filters weapons by tipo', async () => {
      const { sqlite, db } = buildTestDb();
      sqlite.prepare(
        `INSERT INTO weapons (nome, categoria, dano, iniciativa, fonte, tipo, tipo_dano, ocultabilidade)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('Faca', 'Adaga', '1d3', '-3', 'Módulo Básico v1.01', 'branca', 'Corte/Perfuração', 'Bolso');
      sqlite.prepare(
        `INSERT INTO weapons (nome, categoria, dano, iniciativa, fonte, tipo, alcance_medio, alcance_max)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('Arco Curto', 'Arco', '1d6', '-3', 'Módulo Básico v1.01', 'branca_distancia', '30m', '70m');
      sqlite.prepare(
        `INSERT INTO weapons (nome, categoria, dano, iniciativa, fonte, tipo, calibre, alcance_efetivo, rof, pente, ocultabilidade)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('Pistola 9mm', 'Pistola', '1d6+2', '-2', 'Guia de Armas de Fogo', 'fogo', '9mm', '25m', '1', '15', 'Casaco');

      const repo = new WeaponRepository(db);

      const brancas = await repo.findAll('branca');
      expect(brancas).toHaveLength(1);
      expect(brancas[0]!.nome).toBe('Faca');

      const fogo = await repo.findAll('fogo');
      expect(fogo).toHaveLength(1);
      expect(fogo[0]!.nome).toBe('Pistola 9mm');
    });

    it('returns weapons with correct shape including nullable fields', async () => {
      const { sqlite, db } = buildTestDb();
      sqlite.prepare(
        `INSERT INTO weapons (nome, categoria, dano, iniciativa, fonte, tipo, tipo_dano, ocultabilidade)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('Faca', 'Adaga', '1d3', '-3', 'Módulo Básico v1.01', 'branca', 'Corte/Perfuração', 'Bolso');

      const repo = new WeaponRepository(db);
      const result = await repo.findAll();
      const weapon = result[0]!;

      expect(typeof weapon.id).toBe('number');
      expect(typeof weapon.nome).toBe('string');
      expect(typeof weapon.categoria).toBe('string');
      expect(typeof weapon.dano).toBe('string');
      expect(typeof weapon.iniciativa).toBe('string');
      expect(typeof weapon.fonte).toBe('string');
      expect(typeof weapon.tipo).toBe('string');
      expect(weapon.tipoDano).toBe('Corte/Perfuração');
      expect(weapon.ocultabilidade).toBe('Bolso');
      expect(weapon.alcanceMedio).toBeNull();
      expect(weapon.alcanceMax).toBeNull();
      expect(weapon.calibre).toBeNull();
      expect(weapon.alcanceEfetivo).toBeNull();
      expect(weapon.rof).toBeNull();
      expect(weapon.pente).toBeNull();
    });
  });
});
