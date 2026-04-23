import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { EnhancementService } from '../../src/services/enhancement.service.ts';
import type { IEnhancementRepository } from '../../src/repositories/enhancement.repository.ts';
import type { Enhancement } from '../../src/model/entities/enhancement.entity.ts';

const mockData: Enhancement[] = [
  { id: 1, nome: 'Ambidestria', descricao: 'Usa ambas as mãos.', tipo: 'positivo', custo: 5 },
  { id: 2, nome: 'Coragem', descricao: 'Resistência ao medo.', tipo: 'positivo', custo: 2 },
  { id: 3, nome: 'Aleijado', descricao: 'Deficiência física.', tipo: 'negativo', custo: -3 },
];

function buildMockRepository(data: Enhancement[]): IEnhancementRepository {
  return { findAll: jest.fn().mockResolvedValue(data) };
}

describe('EnhancementService', () => {
  describe('getAll()', () => {
    it('returns all enhancements from repository', async () => {
      const repo = buildMockRepository(mockData);
      const service = new EnhancementService(repo);

      const result = await service.getAll();

      expect(repo.findAll).toBeCalledTimes(1);
      expect(result).toEqual(mockData);
    });

    it('returns empty array when repository has no enhancements', async () => {
      const repo = buildMockRepository([]);
      const service = new EnhancementService(repo);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });

    it('returns the exact data from repository without modification', async () => {
      const repo = buildMockRepository(mockData);
      const service = new EnhancementService(repo);

      const result = await service.getAll();

      expect(result).toHaveLength(3);
      expect(result[0]!.nome).toBe('Ambidestria');
      expect(result[2]!.tipo).toBe('negativo');
    });
  });
});
