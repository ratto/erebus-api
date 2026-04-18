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

  it('returns 200 without params', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    expect(res.status).toBe(200);
  });

  it('returns { total, page, limit, data }', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns all 6 seeded enhancements by default', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    expect(res.body.total).toBe(6);
    expect(res.body.data).toHaveLength(6);
  });

  it('returns correct defaults for page and limit', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });

  it('filters by ?tipo=positivo', async () => {
    const res = await request(app).get('/api/v1/enhancements?tipo=positivo');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect((res.body.data as { tipo: string }[]).every((e) => e.tipo === 'positivo')).toBe(true);
  });

  it('filters by ?tipo=negativo', async () => {
    const res = await request(app).get('/api/v1/enhancements?tipo=negativo');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect((res.body.data as { tipo: string }[]).every((e) => e.tipo === 'negativo')).toBe(true);
  });

  it('searches by ?search=ambi (case-insensitive)', async () => {
    const res = await request(app).get('/api/v1/enhancements?search=ambi');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].nome).toBe('Ambidestria');
  });

  it('applies pagination with ?page=2&limit=2', async () => {
    const res = await request(app).get('/api/v1/enhancements?page=2&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(6);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 400 for ?tipo=invalido', async () => {
    const res = await request(app).get('/api/v1/enhancements?tipo=invalido');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation error');
  });

  it('returns 400 for non-numeric ?page', async () => {
    const res = await request(app).get('/api/v1/enhancements?page=abc');
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric ?limit', async () => {
    const res = await request(app).get('/api/v1/enhancements?limit=abc');
    expect(res.status).toBe(400);
  });

  it('returns 200 with empty data when seed not executed (banco sem dados)', async () => {
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
    expect(res.body.total).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  it('each enhancement has the correct structure', async () => {
    const res = await request(app).get('/api/v1/enhancements');
    for (const e of res.body.data as { id: unknown; nome: unknown; descricao: unknown; tipo: unknown; custo: unknown }[]) {
      expect(typeof e.id).toBe('number');
      expect(typeof e.nome).toBe('string');
      expect(typeof e.descricao).toBe('string');
      expect(['positivo', 'negativo']).toContain(e.tipo);
      expect(typeof e.custo).toBe('number');
    }
  });
});
