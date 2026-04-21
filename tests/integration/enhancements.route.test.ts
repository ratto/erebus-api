import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { enhancements as enhancementsTable } from '../../src/infrastructure/database/schema.ts';
import { EnhancementRepository } from '../../src/repositories/enhancement.repository.ts';
import { EnhancementService } from '../../src/services/enhancement.service.ts';
import { EnhancementController } from '../../src/controllers/enhancement.controller.ts';
import type { Enhancement } from '../../src/model/entities/enhancement.entity.ts';

function buildTestApp() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS enhancements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      tipo TEXT NOT NULL,
      custo INTEGER NOT NULL
    )
  `);
  const db = drizzle({ client: sqlite });

  db.insert(enhancementsTable).values([
    { nome: 'Ambidestria', descricao: 'Usa ambas as mãos.', tipo: 'positivo', custo: 5 },
    { nome: 'Coragem', descricao: 'Resistência ao medo.', tipo: 'positivo', custo: 2 },
    { nome: 'Reflexos Rápidos', descricao: 'Reflexos excepcionais.', tipo: 'positivo', custo: 3 },
    { nome: 'Aleijado', descricao: 'Deficiência física.', tipo: 'negativo', custo: -3 },
    { nome: 'Cegueira', descricao: 'Não enxerga.', tipo: 'negativo', custo: -6 },
    { nome: 'Surdez', descricao: 'Não ouve.', tipo: 'negativo', custo: -3 },
  ]).run();

  const repo = new EnhancementRepository(db);
  const service = new EnhancementService(repo);
  const controller = new EnhancementController(service);

  const app = express();
  app.use(express.json());
  app.get('/api/v1/enhancements', (req, res) => controller.list(req, res));

  return app;
}

describe('GET /api/v1/enhancements', () => {
  const app = buildTestApp();

  it('returns 200', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    expect(res.status).toBe(200);
  });

  it('returns a direct array of enhancements', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns all 6 seeded enhancements', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    expect((res.body as Enhancement[]).length).toBe(6);
  });

  it('each enhancement has the correct structure', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    for (const e of res.body as Enhancement[]) {
      expect(typeof e.id).toBe('number');
      expect(typeof e.nome).toBe('string');
      expect(typeof e.descricao).toBe('string');
      expect(['positivo', 'negativo']).toContain(e.tipo);
      expect(typeof e.custo).toBe('number');
    }
  });

  it('returns 200 with empty array when there are no enhancements', async () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`CREATE TABLE IF NOT EXISTS enhancements (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, descricao TEXT NOT NULL, tipo TEXT NOT NULL, custo INTEGER NOT NULL)`);
    const emptyDb = drizzle({ client: sqlite });
    const repo = new EnhancementRepository(emptyDb);
    const service = new EnhancementService(repo);
    const controller = new EnhancementController(service);
    const emptyApp = express();
    emptyApp.use(express.json());
    emptyApp.get('/api/v1/enhancements', (req, res) => controller.list(req, res));

    const res = await request(emptyApp).get('/api/v1/enhancements');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
