import 'reflect-metadata';
import request from 'supertest';
import { jest } from '@jest/globals';
import { Container } from 'inversify';
import express from 'express';
import { TYPES } from '../../src/infrastructure/container/types.ts';
import { DiceController } from '../../src/controllers/dice.controller.ts';
import { DiceService } from '../../src/services/dice.service.ts';
import type { ICoreAdapter } from '../../src/adapters/core.adapter.ts';
import { DiceType } from '../../src/model/enums/dice-type.enum.ts';

// ── Mock do CoreAdapter para isolar do binário C++ ──────────────────────────

const mockCoreAdapter: ICoreAdapter = {
  rollDice: jest.fn(),
};

function buildApp(): express.Express {
  const container = new Container();
  container.bind<ICoreAdapter>(TYPES.ICoreAdapter).toConstantValue(mockCoreAdapter);
  container.bind<DiceService>(TYPES.DiceService).to(DiceService).inTransientScope();
  container.bind<DiceController>(TYPES.DiceController).to(DiceController).inTransientScope();

  const app = express();
  app.use(express.json());

  const diceController = container.get<DiceController>(TYPES.DiceController);
  app.post('/api/v1/dice/roll', (req, res) => diceController.roll(req, res));

  return app;
}

// ── Testes ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/dice/roll', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it('CA-4 happy path — d6×3 retorna results e total', async () => {
    (mockCoreAdapter.rollDice as jest.MockedFunction<typeof mockCoreAdapter.rollDice>)
      .mockResolvedValueOnce({ results: [4, 2, 6], total: 12 });

    const res = await request(app)
      .post('/api/v1/dice/roll')
      .send({ diceType: 'd6', count: 3 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [4, 2, 6], total: 12 });
    expect(mockCoreAdapter.rollDice).toHaveBeenCalledWith(DiceType.d6, 3);
  });

  it('CA-5 — diceType inválido retorna 400 com mensagem', async () => {
    const res = await request(app)
      .post('/api/v1/dice/roll')
      .send({ diceType: 'd20', count: 1 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('diceType');
  });

  it('CA-6 — count=0 retorna 400', async () => {
    const res = await request(app)
      .post('/api/v1/dice/roll')
      .send({ diceType: 'd6', count: 0 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('count');
  });

  it('CA-6 — count negativo retorna 400', async () => {
    const res = await request(app)
      .post('/api/v1/dice/roll')
      .send({ diceType: 'd6', count: -3 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('count');
  });
});
