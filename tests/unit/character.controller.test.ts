import 'reflect-metadata';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Request, Response } from 'express';
import { CharacterController } from '../../src/controllers/character.controller.ts';
import type { ICharacterService } from '../../src/services/character.service.ts';
import type { CharacterValidationResult } from '../../src/model/entities/character.entity.ts';

// ─── Test Doubles ─────────────────────────────────────────────────────────────

function buildMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn<(code: number) => Response>().mockReturnValue(res as Response);
  res.json   = jest.fn<(body: unknown) => Response>().mockReturnValue(res as Response);
  return res as Response;
}

function buildValidRequestBody() {
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

function buildValidResult(): CharacterValidationResult {
  return {
    valid: true,
    computed: {
      pv: 12, iniciativa: 12,
      skillBudget: 385, skillBudgetUsed: 50,
      attributeBudget: 111, attributeBudgetUsed: 111,
      enhancementBudget: 6, enhancementBudgetUsed: 6,
    },
    errors: [],
  };
}

function buildMockService(result: CharacterValidationResult): ICharacterService {
  return {
    validate: jest.fn<() => Promise<CharacterValidationResult>>().mockResolvedValue(result),
  };
}

// ─── CharacterController ──────────────────────────────────────────────────────

describe('CharacterController', () => {
  let res: Response;

  beforeEach(() => {
    res = buildMockResponse();
  });

  describe('validate() — Zod schema', () => {
    it('retorna 400 se name estiver ausente', async () => {
      const service = buildMockService(buildValidResult());
      const controller = new CharacterController(service);
      const body = buildValidRequestBody();
      delete (body as Record<string, unknown>)['name'];

      const req = { body } as Request;
      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 se atributo FR for menor que 5', async () => {
      const service = buildMockService(buildValidResult());
      const controller = new CharacterController(service);
      const body = buildValidRequestBody();
      body.attributes.FR = 4;

      const req = { body } as Request;
      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 se atributo AGI for maior que 20', async () => {
      const service = buildMockService(buildValidResult());
      const controller = new CharacterController(service);
      const body = buildValidRequestBody();
      body.attributes.AGI = 21;

      const req = { body } as Request;
      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 se pericia tiver pontos < 10', async () => {
      const service = buildMockService(buildValidResult());
      const controller = new CharacterController(service);
      const body = buildValidRequestBody();
      body.skills = [{ id: 12, nome: 'Espada', pontos: 9 }];

      const req = { body } as Request;
      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 se pericia tiver pontos > 50', async () => {
      const service = buildMockService(buildValidResult());
      const controller = new CharacterController(service);
      const body = buildValidRequestBody();
      body.skills = [{ id: 12, nome: 'Espada', pontos: 51 }];

      const req = { body } as Request;
      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 se age for menor que 6', async () => {
      const service = buildMockService(buildValidResult());
      const controller = new CharacterController(service);
      const body = buildValidRequestBody();
      body.age = 5;

      const req = { body } as Request;
      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 se level for maior que 15', async () => {
      const service = buildMockService(buildValidResult());
      const controller = new CharacterController(service);
      const body = buildValidRequestBody();
      body.level = 16;

      const req = { body } as Request;
      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validate() — mapeamento de status HTTP', () => {
    it('retorna 200 quando engine retorna valid=true', async () => {
      const service = buildMockService(buildValidResult());
      const controller = new CharacterController(service);
      const req = { body: buildValidRequestBody() } as Request;

      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 200 com valid, character e computed no body', async () => {
      const mockResult = buildValidResult();
      const service = buildMockService(mockResult);
      const controller = new CharacterController(service);
      const req = { body: buildValidRequestBody() } as Request;

      await controller.validate(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: true,
          computed: mockResult.computed,
          errors: [],
        }),
      );
    });

    it('retorna 422 quando engine retorna valid=false', async () => {
      const invalidResult: CharacterValidationResult = {
        valid: false,
        computed: {
          pv: 12, iniciativa: 12,
          skillBudget: 385, skillBudgetUsed: 50,
          attributeBudget: 111, attributeBudgetUsed: 113,
          enhancementBudget: 6, enhancementBudgetUsed: 6,
        },
        errors: [{ code: 'ATTRIBUTE_BUDGET', message: 'Sum of attributes must equal 111 (got 113)' }],
      };
      const service = buildMockService(invalidResult);
      const controller = new CharacterController(service);
      const req = { body: buildValidRequestBody() } as Request;

      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 500 quando o service lanca excecao (engine crash)', async () => {
      const crashService: ICharacterService = {
        validate: jest.fn<() => Promise<CharacterValidationResult>>().mockRejectedValue(
          new Error('Core process exited with code 1'),
        ),
      };
      const controller = new CharacterController(crashService);
      const req = { body: buildValidRequestBody() } as Request;

      await controller.validate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
