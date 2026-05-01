import 'reflect-metadata';
import { describe, it, expect } from '@jest/globals';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { ProtectiveEquipmentRepository } from '../../src/repositories/protective-equipment.repository.ts';

function buildTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle({ client: sqlite });

  sqlite.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS protective_equipment (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL UNIQUE,
      cost         TEXT,
      availability TEXT,
      weight_kg    REAL,
      dex_penalty  INTEGER NOT NULL DEFAULT 0,
      agi_penalty  INTEGER NOT NULL DEFAULT 0,
      description  TEXT NOT NULL,
      source       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS protective_equipment_pt (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL UNIQUE REFERENCES protective_equipment(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      description  TEXT NOT NULL,
      source       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS protective_index (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL REFERENCES protective_equipment(id) ON DELETE CASCADE,
      damage_type  TEXT NOT NULL,
      ip_value     INTEGER NOT NULL,
      UNIQUE(equipment_id, damage_type)
    );
  `);

  return { sqlite, db };
}

function seedEquipment(sqlite: Database.Database) {
  sqlite.prepare(`
    INSERT INTO protective_equipment (name, dex_penalty, agi_penalty, description, source)
    VALUES (?, ?, ?, ?, ?)
  `).run('Chainmail', 3, 2, 'Interlocked metal rings.', 'TREVAS, 3rd ed.');

  sqlite.prepare(`
    INSERT INTO protective_equipment (name, dex_penalty, agi_penalty, description, source)
    VALUES (?, ?, ?, ?, ?)
  `).run('Kevlar Vest (8 layers)', 2, 1, 'Reinforced ballistic vest.', 'TREVAS, 3rd ed.');

  const chainmailId = (sqlite.prepare(`SELECT id FROM protective_equipment WHERE name = ?`).get('Chainmail') as { id: number }).id;
  const kevlarId    = (sqlite.prepare(`SELECT id FROM protective_equipment WHERE name = ?`).get('Kevlar Vest (8 layers)') as { id: number }).id;

  sqlite.prepare(`INSERT INTO protective_equipment_pt (equipment_id, name, description, source) VALUES (?, ?, ?, ?)`).run(
    chainmailId, 'Cota de Malha', 'Anéis metálicos entrelaçados.', 'TREVAS, 3ª ed.',
  );
  sqlite.prepare(`INSERT INTO protective_equipment_pt (equipment_id, name, description, source) VALUES (?, ?, ?, ?)`).run(
    kevlarId, 'Colete de Kevlar (8 camadas)', 'Colete balístico reforçado.', 'TREVAS, 3ª ed.',
  );

  sqlite.prepare(`INSERT INTO protective_index (equipment_id, damage_type, ip_value) VALUES (?, ?, ?)`).run(chainmailId, 'KINETIC', 6);
  sqlite.prepare(`INSERT INTO protective_index (equipment_id, damage_type, ip_value) VALUES (?, ?, ?)`).run(chainmailId, 'BALLISTIC', 2);

  sqlite.prepare(`INSERT INTO protective_index (equipment_id, damage_type, ip_value) VALUES (?, ?, ?)`).run(kevlarId, 'KINETIC', 2);
  sqlite.prepare(`INSERT INTO protective_index (equipment_id, damage_type, ip_value) VALUES (?, ?, ?)`).run(kevlarId, 'BALLISTIC', 6);

  return { chainmailId, kevlarId };
}

describe('ProtectiveEquipmentRepository', () => {
  describe('findAll()', () => {
    it('returns empty array when there are no records', async () => {
      const { db } = buildTestDb();
      const repo = new ProtectiveEquipmentRepository(db);

      const result = await repo.findAll('en-US');

      expect(result).toEqual([]);
    });

    it('returns all equipment in en-US with only stored ip entries', async () => {
      const { sqlite, db } = buildTestDb();
      seedEquipment(sqlite);
      const repo = new ProtectiveEquipmentRepository(db);

      const result = await repo.findAll('en-US');

      expect(result).toHaveLength(2);
      const chainmail = result.find((e) => e.name === 'Chainmail');
      expect(chainmail).toBeDefined();
      expect(chainmail!.dexPenalty).toBe(3);
      expect(chainmail!.agiPenalty).toBe(2);
      expect(chainmail!.protectiveIndex.length).toBeGreaterThanOrEqual(1);
    });

    it('returns equipment with pt-BR names when locale is pt-BR', async () => {
      const { sqlite, db } = buildTestDb();
      seedEquipment(sqlite);
      const repo = new ProtectiveEquipmentRepository(db);

      const result = await repo.findAll('pt-BR');

      const chainmail = result.find((e) => e.name === 'Cota de Malha');
      expect(chainmail).toBeDefined();
      expect(chainmail!.description).toBe('Anéis metálicos entrelaçados.');
    });

    it('falls back to en-US per item when pt-BR translation is missing', async () => {
      const { sqlite, db } = buildTestDb();
      // Insert equipment without pt-BR translation
      sqlite.prepare(`
        INSERT INTO protective_equipment (name, dex_penalty, agi_penalty, description, source)
        VALUES (?, ?, ?, ?, ?)
      `).run('Rubber Suit', 1, 1, 'Insulating vulcanized rubber garment.', 'TREVAS, 3rd ed.');

      const repo = new ProtectiveEquipmentRepository(db);
      const result = await repo.findAll('pt-BR');

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Rubber Suit'); // fallback to en-US
      expect(result[0]!.description).toBe('Insulating vulcanized rubber garment.');
    });
  });

  describe('search()', () => {
    it('filters by name (case-insensitive partial match)', async () => {
      const { sqlite, db } = buildTestDb();
      seedEquipment(sqlite);
      const repo = new ProtectiveEquipmentRepository(db);

      const result = await repo.search({ name: 'kevlar' }, 'en-US');

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Kevlar Vest (8 layers)');
    });

    it('filters by damageType returning only items with ip > 0 for that type', async () => {
      const { sqlite, db } = buildTestDb();
      seedEquipment(sqlite);
      const repo = new ProtectiveEquipmentRepository(db);

      // Both Chainmail and Kevlar have BALLISTIC > 0
      const result = await repo.search({ damageType: 'BALLISTIC', minIp: 1 }, 'en-US');

      expect(result.length).toBe(2);
    });

    it('filters by damageType with minIp threshold', async () => {
      const { sqlite, db } = buildTestDb();
      seedEquipment(sqlite);
      const repo = new ProtectiveEquipmentRepository(db);

      // Only Kevlar has BALLISTIC >= 6
      const result = await repo.search({ damageType: 'BALLISTIC', minIp: 6 }, 'en-US');

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Kevlar Vest (8 layers)');
    });

    it('returns all items when no filters provided', async () => {
      const { sqlite, db } = buildTestDb();
      seedEquipment(sqlite);
      const repo = new ProtectiveEquipmentRepository(db);

      const result = await repo.search({}, 'en-US');

      expect(result).toHaveLength(2);
    });

    it('ignores minIp when damageType is not provided', async () => {
      const { sqlite, db } = buildTestDb();
      seedEquipment(sqlite);
      const repo = new ProtectiveEquipmentRepository(db);

      // minIp without damageType — should return all
      const result = await repo.search({ minIp: 10 }, 'en-US');

      expect(result).toHaveLength(2);
    });
  });
});
