import 'reflect-metadata';
import { describe, expect, it, beforeAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { CoreAdapter } from '../../src/adapters/core.adapter.ts';
import { CharacterService } from '../../src/services/character.service.ts';
import { CharacterController } from '../../src/controllers/character.controller.ts';

// Caminho do binario do engine (relativo ao erebus-engine, compilado na branch feat/007)
const ENGINE_PATH = path.resolve(
  process.env['EREBUS_CORE_PATH'] ??
  path.join(process.cwd(), '../erebus-engine/build/erebus'),
);

function buildTestApp() {
  const adapter    = new CoreAdapter();
  const service    = new CharacterService(adapter);
  const controller = new CharacterController(service);

  const app = express();
  app.use(express.json());
  app.post('/api/v1/characters/validate', (req, res) => controller.validate(req, res));
  return app;
}

function buildValidBody() {
  return {
    name: 'Thomas Ferguson',
    age: 30,
    level: 1,
    attributes: { FR: 11, DEX: 14, AGI: 12, CON: 10, INT: 17, WILL: 15, CAR: 16, PER: 16 },
    enhancements: [
      { id: 1, nome: 'Ambidestria',   custo: 5 },
      { id: 2, nome: 'Visao Noturna', custo: 1 },
    ],
    skills: [
      { id: 12, nome: 'Espada',   pontos: 30 },
      { id: 30, nome: 'Cavalgar', pontos: 20 },
    ],
  };
}

describe('POST /api/v1/characters/validate', () => {
  let engineAvailable = false;

  beforeAll(() => {
    engineAvailable = fs.existsSync(ENGINE_PATH);
    if (!engineAvailable) {
      process.env['EREBUS_CORE_PATH'] = ENGINE_PATH;
    } else {
      process.env['EREBUS_CORE_PATH'] = ENGINE_PATH;
    }
  });

  it('(a) ficha valida → HTTP 200 com valid=true e campos computed', async () => {
    if (!engineAvailable) {
      console.warn(`[SKIP] Engine binary not found at ${ENGINE_PATH}`);
      return;
    }

    const app = buildTestApp();
    const res = await request(app)
      .post('/api/v1/characters/validate')
      .send(buildValidBody());

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.computed).toBeDefined();
    expect(res.body.computed.pv).toBe(12);
    expect(res.body.computed.iniciativa).toBe(12);
    expect(res.body.errors).toEqual([]);
  });

  it('(b) atributo fora do range [5,20] → HTTP 400 (Zod)', async () => {
    const app = buildTestApp();
    const body = buildValidBody();
    body.attributes.FR = 4;

    const res = await request(app)
      .post('/api/v1/characters/validate')
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('(c) soma atributos=113 → HTTP 422 com ATTRIBUTE_BUDGET', async () => {
    if (!engineAvailable) {
      console.warn(`[SKIP] Engine binary not found at ${ENGINE_PATH}`);
      return;
    }

    const app = buildTestApp();
    const body = buildValidBody();
    body.attributes.FR = 13; // soma = 113

    const res = await request(app)
      .post('/api/v1/characters/validate')
      .send(body);

    expect(res.status).toBe(422);
    expect(res.body.valid).toBe(false);
    const codes = (res.body.errors as Array<{ code: string }>).map((e) => e.code);
    expect(codes).toContain('ATTRIBUTE_BUDGET');
  });

  it('(d) saldo PA != 0 → HTTP 422 com ENHANCEMENT_BUDGET', async () => {
    if (!engineAvailable) {
      console.warn(`[SKIP] Engine binary not found at ${ENGINE_PATH}`);
      return;
    }

    const app = buildTestApp();
    const body = buildValidBody();
    // Apenas 5 PA gastos (saldo=1 != 0)
    body.enhancements = [{ id: 1, nome: 'Ambidestria', custo: 5 }];

    const res = await request(app)
      .post('/api/v1/characters/validate')
      .send(body);

    expect(res.status).toBe(422);
    const codes = (res.body.errors as Array<{ code: string }>).map((e) => e.code);
    expect(codes).toContain('ENHANCEMENT_BUDGET');
  });

  it('(e) pericia com pontos=9 → HTTP 400 (Zod)', async () => {
    const app = buildTestApp();
    const body = buildValidBody();
    body.skills = [{ id: 12, nome: 'Espada', pontos: 9 }];

    const res = await request(app)
      .post('/api/v1/characters/validate')
      .send(body);

    expect(res.status).toBe(400);
  });

  it('(f) pericia com pontos=51 → HTTP 400 (Zod)', async () => {
    const app = buildTestApp();
    const body = buildValidBody();
    body.skills = [{ id: 12, nome: 'Espada', pontos: 51 }];

    const res = await request(app)
      .post('/api/v1/characters/validate')
      .send(body);

    expect(res.status).toBe(400);
  });
});
