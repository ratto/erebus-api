import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { CharacterService } from '../../src/services/character.service.ts';
import type { ICoreAdapter } from '../../src/adapters/core.adapter.ts';
import type { Character, CharacterValidationResult } from '../../src/model/entities/character.entity.ts';

// ─── Test Doubles ─────────────────────────────────────────────────────────────

function buildValidCharacter(): Character {
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
      { id: 12, nome: 'Espada',    pontos: 30 },
      { id: 30, nome: 'Cavalgar',  pontos: 20 },
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

function buildMockAdapter(result: CharacterValidationResult): ICoreAdapter {
  return {
    rollDice: jest.fn(),
    validateCharacter: jest.fn<() => Promise<CharacterValidationResult>>().mockResolvedValue(result),
  } as unknown as ICoreAdapter;
}

// ─── CharacterService ─────────────────────────────────────────────────────────

describe('CharacterService', () => {
  describe('validate()', () => {
    it('delega a chamada ao CoreAdapter com o personagem correto', async () => {
      const mockResult = buildValidResult();
      const adapter = buildMockAdapter(mockResult);
      const service = new CharacterService(adapter);
      const character = buildValidCharacter();

      await service.validate(character);

      expect(adapter.validateCharacter).toHaveBeenCalledWith(character);
      expect(adapter.validateCharacter).toHaveBeenCalledTimes(1);
    });

    it('retorna o resultado do CoreAdapter sem modificacao (valid=true)', async () => {
      const mockResult = buildValidResult();
      const adapter = buildMockAdapter(mockResult);
      const service = new CharacterService(adapter);

      const result = await service.validate(buildValidCharacter());

      expect(result).toEqual(mockResult);
    });

    it('retorna o resultado do CoreAdapter sem modificacao (valid=false)', async () => {
      const mockResult: CharacterValidationResult = {
        valid: false,
        computed: {
          pv: 12, iniciativa: 12,
          skillBudget: 385, skillBudgetUsed: 50,
          attributeBudget: 111, attributeBudgetUsed: 113,
          enhancementBudget: 6, enhancementBudgetUsed: 6,
        },
        errors: [{ code: 'ATTRIBUTE_BUDGET', message: 'Sum of attributes must equal 111 (got 113)' }],
      };
      const adapter = buildMockAdapter(mockResult);
      const service = new CharacterService(adapter);

      const result = await service.validate(buildValidCharacter());

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('ATTRIBUTE_BUDGET');
    });

    it('propaga excecao do CoreAdapter (ex: engine crash)', async () => {
      const adapter = {
        rollDice: jest.fn(),
        validateCharacter: jest.fn<() => Promise<CharacterValidationResult>>().mockRejectedValue(
          new Error('Core process exited with code 1'),
        ),
      } as unknown as ICoreAdapter;
      const service = new CharacterService(adapter);

      await expect(service.validate(buildValidCharacter())).rejects.toThrow('Core process exited');
    });
  });
});
