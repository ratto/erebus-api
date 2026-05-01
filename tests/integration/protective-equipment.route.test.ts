import 'reflect-metadata';
import { describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { ProtectiveEquipmentRepository } from '../../src/repositories/protective-equipment.repository.ts';
import { ProtectiveEquipmentService } from '../../src/services/protective-equipment.service.ts';
import { ProtectiveEquipmentController } from '../../src/controllers/protective-equipment.controller.ts';
import type { ProtectiveEquipment } from '../../src/model/entities/protective-equipment.entity.ts';

// ---- Schema redeclaration for tests (avoids importing global schema with other tables) ----
const protectiveEquipmentTable = sqliteTable('protective_equipment', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  name:         text('name').notNull().unique(),
  cost:         text('cost'),
  availability: text('availability'),
  weightKg:     real('weight_kg'),
  dexPenalty:   integer('dex_penalty').notNull().default(0),
  agiPenalty:   integer('agi_penalty').notNull().default(0),
  description:  text('description').notNull(),
  source:       text('source').notNull(),
});

const protectiveEquipmentPtTable = sqliteTable('protective_equipment_pt', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  equipmentId: integer('equipment_id').notNull().unique()
                 .references(() => protectiveEquipmentTable.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  description: text('description').notNull(),
  source:      text('source').notNull(),
});

const protectiveIndexTable = sqliteTable(
  'protective_index',
  {
    id:          integer('id').primaryKey({ autoIncrement: true }),
    equipmentId: integer('equipment_id').notNull()
                   .references(() => protectiveEquipmentTable.id, { onDelete: 'cascade' }),
    damageType:  text('damage_type').notNull(),
    ipValue:     integer('ip_value').notNull(),
  },
  (t) => ({
    uniqPerType: uniqueIndex('idx_protective_index_unique').on(t.equipmentId, t.damageType),
  }),
);

function buildTestApp(withData = true) {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
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

  const db = drizzle({ client: sqlite });

  if (withData) {
    db.insert(protectiveEquipmentTable).values([
      {
        name: 'Chainmail',
        dexPenalty: 3, agiPenalty: 2,
        description: 'Interlocked metal rings covering torso, shoulders and arms.',
        source: 'TREVAS, 3rd ed.',
      },
      {
        name: 'Kevlar Vest (8 layers)',
        dexPenalty: 2, agiPenalty: 1,
        description: 'Reinforced ballistic vest with 8 Kevlar layers.',
        source: 'TREVAS, 3rd ed.',
      },
      {
        name: 'Ballistic Vest with Ceramic Plates',
        dexPenalty: 4, agiPenalty: 3,
        description: 'Kevlar vest reinforced with rigid ceramic or steel plates.',
        source: 'TREVAS, 3rd ed.',
      },
    ]).run();

    const chainmailId = (sqlite.prepare(`SELECT id FROM protective_equipment WHERE name = 'Chainmail'`).get() as { id: number }).id;
    const kevlarId    = (sqlite.prepare(`SELECT id FROM protective_equipment WHERE name = 'Kevlar Vest (8 layers)'`).get() as { id: number }).id;
    const ceramicId   = (sqlite.prepare(`SELECT id FROM protective_equipment WHERE name = 'Ballistic Vest with Ceramic Plates'`).get() as { id: number }).id;

    db.insert(protectiveEquipmentPtTable).values([
      { equipmentId: chainmailId, name: 'Cota de Malha', description: 'Anéis metálicos entrelaçados.', source: 'TREVAS, 3ª ed.' },
      { equipmentId: kevlarId,    name: 'Colete de Kevlar (8 camadas)', description: 'Colete balístico reforçado.', source: 'TREVAS, 3ª ed.' },
      { equipmentId: ceramicId,   name: 'Colete Balístico com Placas de Cerâmica', description: 'Colete Kevlar com placas cerâmicas.', source: 'TREVAS, 3ª ed.' },
    ]).run();

    db.insert(protectiveIndexTable).values([
      { equipmentId: chainmailId, damageType: 'KINETIC',   ipValue: 6 },
      { equipmentId: chainmailId, damageType: 'BALLISTIC', ipValue: 2 },
      { equipmentId: kevlarId,    damageType: 'KINETIC',   ipValue: 2 },
      { equipmentId: kevlarId,    damageType: 'BALLISTIC', ipValue: 6 },
      { equipmentId: ceramicId,   damageType: 'KINETIC',   ipValue: 4 },
      { equipmentId: ceramicId,   damageType: 'BALLISTIC', ipValue: 12 },
    ]).run();
  }

  const repo       = new ProtectiveEquipmentRepository(db);
  const service    = new ProtectiveEquipmentService(repo);
  const controller = new ProtectiveEquipmentController(service);

  const app = express();
  app.use(express.json());
  app.get('/api/v1/protective-equipment', (req, res) => controller.list(req, res));
  app.get('/api/v1/protective-equipment/search', (req, res) => controller.search(req, res));

  return app;
}

describe('GET /api/v1/protective-equipment', () => {
  const app = buildTestApp();

  it('returns 200 with locale en-US when no Accept-Language header', async () => {
    const res = await request(app).get('/api/v1/protective-equipment');

    expect(res.status).toBe(200);
    expect(res.body.locale).toBe('en-US');
  });

  it('returns 200 with locale pt-BR when Accept-Language: pt-BR', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment')
      .set('Accept-Language', 'pt-BR');

    expect(res.status).toBe(200);
    expect(res.body.locale).toBe('pt-BR');
  });

  it('returns pt-BR names when Accept-Language: pt-BR', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment')
      .set('Accept-Language', 'pt-BR');

    const items = res.body.protectiveEquipment as ProtectiveEquipment[];
    const chainmail = items.find((e) => e.name === 'Cota de Malha');
    expect(chainmail).toBeDefined();
  });

  it('resolves pt-BR from composite Accept-Language header', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment')
      .set('Accept-Language', 'pt-BR,en;q=0.9');

    expect(res.body.locale).toBe('pt-BR');
  });

  it('each item has exactly 8 protectiveIndex entries', async () => {
    const res = await request(app).get('/api/v1/protective-equipment');

    const items = res.body.protectiveEquipment as ProtectiveEquipment[];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.protectiveIndex).toHaveLength(8);
    }
  });

  it('returns 200 with empty protectiveEquipment array when db is empty', async () => {
    const emptyApp = buildTestApp(false);
    const res = await request(emptyApp).get('/api/v1/protective-equipment');

    expect(res.status).toBe(200);
    expect(res.body.protectiveEquipment).toEqual([]);
  });
});

describe('GET /api/v1/protective-equipment/search', () => {
  const app = buildTestApp();

  it('filters by name (case-insensitive, en-US)', async () => {
    const res = await request(app).get('/api/v1/protective-equipment/search?name=kevlar');

    expect(res.status).toBe(200);
    const items = res.body.protectiveEquipment as ProtectiveEquipment[];
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const item of items) {
      expect(item.name.toLowerCase()).toContain('kevlar');
    }
  });

  it('filters by name in pt-BR', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment/search?name=cota')
      .set('Accept-Language', 'pt-BR');

    expect(res.status).toBe(200);
    const items = res.body.protectiveEquipment as ProtectiveEquipment[];
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0]!.name.toLowerCase()).toContain('cota');
  });

  it('filters by damageType=BALLISTIC with minIp=10 returns only high-ballistic items', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment/search?damageType=BALLISTIC&minIp=10');

    expect(res.status).toBe(200);
    const items = res.body.protectiveEquipment as ProtectiveEquipment[];
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const item of items) {
      const ballistic = item.protectiveIndex.find((e) => e.damageType === 'BALLISTIC');
      expect(ballistic!.ipValue).toBeGreaterThanOrEqual(10);
    }
  });

  it('returns 400 for invalid damageType', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment/search?damageType=FOGO');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.fieldErrors).toHaveProperty('damageType');
  });

  it('returns 400 for negative minIp', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment/search?minIp=-1');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('ignores minIp when damageType is not provided (returns all)', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment/search?minIp=100');

    expect(res.status).toBe(200);
    // All items returned since minIp without damageType is ignored
    const items = res.body.protectiveEquipment as ProtectiveEquipment[];
    expect(items.length).toBe(3);
  });

  it('returns 200 with empty array when search matches nothing', async () => {
    const res = await request(app)
      .get('/api/v1/protective-equipment/search?name=XYZNONEXISTENT');

    expect(res.status).toBe(200);
    expect(res.body.protectiveEquipment).toEqual([]);
  });
});
