import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { WeaponRepository } from '../../src/repositories/weapon.repository.ts';
import { WeaponService } from '../../src/services/weapon.service.ts';
import { WeaponController } from '../../src/controllers/weapon.controller.ts';
import type { Weapon } from '../../src/model/entities/weapon.entity.ts';

const weaponsTable = sqliteTable('weapons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  categoria: text('categoria').notNull(),
  dano: text('dano').notNull(),
  iniciativa: text('iniciativa').notNull(),
  fonte: text('fonte').notNull(),
  tipo: text('tipo').notNull(),
  tipoDano: text('tipo_dano'),
  ocultabilidade: text('ocultabilidade'),
  alcanceMedio: text('alcance_medio'),
  alcanceMax: text('alcance_max'),
  calibre: text('calibre'),
  alcanceEfetivo: text('alcance_efetivo'),
  rof: text('rof'),
  pente: text('pente'),
});

function buildTestApp() {
  const sqlite = new Database(':memory:');
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
  const db = drizzle({ client: sqlite });

  db.insert(weaponsTable).values([
    {
      nome: 'Faca',
      categoria: 'Adaga',
      dano: '1d3',
      iniciativa: '-3',
      fonte: 'Módulo Básico v1.01',
      tipo: 'branca',
      tipoDano: 'Corte/Perfuração',
      ocultabilidade: 'Bolso',
    },
    {
      nome: 'Arco Curto',
      categoria: 'Arco',
      dano: '1d6',
      iniciativa: '-3',
      fonte: 'Módulo Básico v1.01',
      tipo: 'branca_distancia',
      alcanceMedio: '30m',
      alcanceMax: '70m',
    },
    {
      nome: 'Pistola 9mm',
      categoria: 'Pistola',
      dano: '1d6+2',
      iniciativa: '-2',
      fonte: 'Guia de Armas de Fogo',
      tipo: 'fogo',
      calibre: '9mm Parabellum',
      alcanceEfetivo: '25m',
      rof: '1',
      pente: '15',
      ocultabilidade: 'Casaco',
    },
  ]).run();

  const repo = new WeaponRepository(db);
  const service = new WeaponService(repo);
  const controller = new WeaponController(service);

  const app = express();
  app.use(express.json());
  app.get('/api/v1/weapons', (req, res) => controller.list(req, res));

  return app;
}

describe('GET /api/v1/weapons', () => {
  const app = buildTestApp();

  it('returns 200', async () => {
    const res = await request(app).get('/api/v1/weapons');
    expect(res.status).toBe(200);
  });

  it('returns a body with a "weapons" key containing all weapons', async () => {
    const res = await request(app).get('/api/v1/weapons');
    expect(res.body).toHaveProperty('weapons');
    expect((res.body.weapons as unknown[]).length).toBe(3);
  });

  it('filters by tipo=branca', async () => {
    const res = await request(app).get('/api/v1/weapons?tipo=branca');
    expect(res.status).toBe(200);
    const weapons = res.body.weapons as Weapon[];
    expect(weapons).toHaveLength(1);
    expect(weapons[0]!.nome).toBe('Faca');
  });

  it('filters by tipo=branca_distancia', async () => {
    const res = await request(app).get('/api/v1/weapons?tipo=branca_distancia');
    expect(res.status).toBe(200);
    const weapons = res.body.weapons as Weapon[];
    expect(weapons).toHaveLength(1);
    expect(weapons[0]!.nome).toBe('Arco Curto');
  });

  it('filters by tipo=fogo', async () => {
    const res = await request(app).get('/api/v1/weapons?tipo=fogo');
    expect(res.status).toBe(200);
    const weapons = res.body.weapons as Weapon[];
    expect(weapons).toHaveLength(1);
    expect(weapons[0]!.nome).toBe('Pistola 9mm');
  });

  it('returns 400 for invalid tipo', async () => {
    const res = await request(app).get('/api/v1/weapons?tipo=invalido');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('each weapon has all required fields', async () => {
    const res = await request(app).get('/api/v1/weapons');
    const weapons = res.body.weapons as Weapon[];
    for (const weapon of weapons) {
      expect(typeof weapon.id).toBe('number');
      expect(typeof weapon.nome).toBe('string');
      expect(typeof weapon.categoria).toBe('string');
      expect(typeof weapon.dano).toBe('string');
      expect(typeof weapon.iniciativa).toBe('string');
      expect(typeof weapon.fonte).toBe('string');
      expect(typeof weapon.tipo).toBe('string');
      expect('tipoDano' in weapon).toBe(true);
      expect('ocultabilidade' in weapon).toBe(true);
      expect('alcanceMedio' in weapon).toBe(true);
      expect('alcanceMax' in weapon).toBe(true);
      expect('calibre' in weapon).toBe(true);
      expect('alcanceEfetivo' in weapon).toBe(true);
      expect('rof' in weapon).toBe(true);
      expect('pente' in weapon).toBe(true);
    }
  });

  it('returns 200 with empty array when no weapons match the filter', async () => {
    const emptyApp = (() => {
      const sqlite = new Database(':memory:');
      sqlite.exec(`CREATE TABLE IF NOT EXISTS weapons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL, categoria TEXT NOT NULL, dano TEXT NOT NULL,
        iniciativa TEXT NOT NULL, fonte TEXT NOT NULL, tipo TEXT NOT NULL,
        tipo_dano TEXT, ocultabilidade TEXT, alcance_medio TEXT, alcance_max TEXT,
        calibre TEXT, alcance_efetivo TEXT, rof TEXT, pente TEXT
      )`);
      const db = drizzle({ client: sqlite });
      const repo = new WeaponRepository(db);
      const service = new WeaponService(repo);
      const controller = new WeaponController(service);
      const app = express();
      app.use(express.json());
      app.get('/api/v1/weapons', (req, res) => controller.list(req, res));
      return app;
    })();

    const res = await request(emptyApp).get('/api/v1/weapons');
    expect(res.status).toBe(200);
    expect(res.body.weapons).toEqual([]);
  });
});
