import 'reflect-metadata';
import { describe, expect, it, jest, beforeAll, afterAll, afterEach } from '@jest/globals';
import http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import { LogsService } from '../../src/services/logs.service.ts';
import { LogsController } from '../../src/controllers/logs.controller.ts';
import { DiceService } from '../../src/services/dice.service.ts';
import { DiceController } from '../../src/controllers/dice.controller.ts';
import type { ICoreAdapter } from '../../src/adapters/core.adapter.ts';
import { DiceType } from '../../src/model/enums/dice-type.enum.ts';
import { eventBus, EventNames } from '../../src/infrastructure/event-bus.ts';
import type { DiceRolledPayload } from '../../src/infrastructure/event-bus.ts';

// Constrói o app de teste com stack completa mas sem DI container e sem binário real.
// O CoreAdapter é substituído por um mock que retorna dados fixos.
function buildTestApp() {
  const mockAdapter: ICoreAdapter = {
    rollDice: jest.fn<() => Promise<{ results: number[]; total: number }>>().mockImplementation(
      async (_diceType: DiceType, count: number) => {
        const results = Array.from({ length: count }, () => 3);
        return { results, total: results.reduce((a, b) => a + b, 0) };
      },
    ),
  };

  const logsService = new LogsService();
  const logsController = new LogsController(logsService);
  const diceService = new DiceService(mockAdapter);
  const diceController = new DiceController(diceService);

  const app = express();
  app.use(express.json());
  app.get('/api/v1/logs/stream', (req, res) => logsController.stream(req, res));
  app.post('/api/v1/dice/roll', (req, res) => diceController.roll(req, res));

  return app;
}

describe('GET /api/v1/logs/stream', () => {
  let server: http.Server;
  let port: number;

  beforeAll((done) => {
    const app = buildTestApp();
    server = http.createServer(app);
    server.listen(0, () => {
      port = (server.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  afterEach(() => {
    // Limpa listeners que possam ter sido adicionados pelos testes
    eventBus.removeAllListeners(EventNames.DICE_ROLLED);
  });

  // ── Teste 3 ──────────────────────────────────────────────────────────────────

  it('responde com Content-Type text/event-stream', (done) => {
    const req = http.request(
      { port, path: '/api/v1/logs/stream', method: 'GET' },
      (res) => {
        expect(res.headers['content-type']).toContain('text/event-stream');
        // Fecha a conexão — o servidor emitirá ECONNRESET; ignoramos no handler abaixo
        req.destroy();
        done();
      },
    );
    // ECONNRESET é esperado após req.destroy() — não falha o teste
    req.on('error', () => {});
    req.end();
  });

  // ── Teste 4 ──────────────────────────────────────────────────────────────────

  it('emite evento dice.rolled no EventBus após POST /api/v1/dice/roll', (done) => {
    // Registra listener diretamente no EventBus antes do POST
    eventBus.once(EventNames.DICE_ROLLED, (payload: unknown) => {
      const p = payload as DiceRolledPayload;
      try {
        expect(p.diceType).toBe(DiceType.d6);
        expect(p.count).toBe(1);
        expect(Array.isArray(p.results)).toBe(true);
        expect(typeof p.total).toBe('number');
        done();
      } catch (err) {
        done(err);
      }
    });

    const body = JSON.stringify({ diceType: DiceType.d6, count: 1 });
    const postReq = http.request(
      {
        port,
        path: '/api/v1/dice/roll',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume(); // drena a resposta para fechar o socket corretamente
      },
    );
    postReq.on('error', done);
    postReq.write(body);
    postReq.end();
  });

  // ── Teste 5 ──────────────────────────────────────────────────────────────────

  it('remove listener do EventBus ao fechar conexão SSE', (done) => {
    const beforeCount = eventBus.listenerCount(EventNames.DICE_ROLLED);

    const req = http.request(
      { port, path: '/api/v1/logs/stream', method: 'GET' },
      (_res) => {
        // Headers recebidos — o LogsController já chamou logsService.subscribe(res),
        // que registrou o listener no EventBus.
        setImmediate(() => {
          const duringCount = eventBus.listenerCount(EventNames.DICE_ROLLED);
          try {
            expect(duringCount).toBe(beforeCount + 1);
          } catch (err) {
            done(err);
            return;
          }

          // Fecha a conexão do lado cliente — dispara req.on('close') no servidor
          req.destroy();

          // Aguarda o cleanup assíncrono do servidor (Express propaga 'close' ao req)
          setTimeout(() => {
            const afterCount = eventBus.listenerCount(EventNames.DICE_ROLLED);
            try {
              expect(afterCount).toBe(beforeCount);
              done();
            } catch (err) {
              done(err);
            }
          }, 150);
        });
      },
    );
    req.on('error', () => {}); // ignorar ECONNRESET após destroy
    req.end();
  });
});
