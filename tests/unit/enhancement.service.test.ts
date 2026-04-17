import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { EnhancementService } from '../../src/services/enhancement.service.ts';
import type { IEnhancementRepository, EnhancementPage, EnhancementQuery } from '../../src/repositories/enhancement.repository.ts';
import type { Enhancement } from '../../src/model/entities/enhancement.entity.ts';

const mockData: Enhancement[] = [
  { id: 1, nome: 'Ambidestria', descricao: 'Usa ambas as mãos.', tipo: 'positivo', custo: 5 },
  { id: 2, nome: 'Coragem', descricao: 'Resistência ao medo.', tipo: 'positivo', custo: 2 },
  { id: 3, nome: 'Aleijado', descricao: 'Deficiência física.', tipo: 'negativo', custo: -3 },
];

function buildMockRepository(page: EnhancementPage): IEnhancementRepository {
  return { findAll: jest.fn().mockResolvedValue(page) };
}

const defaultQuery: EnhancementQuery = { page: 1, limit: 20 };

describe('EnhancementService', () => {
  describe('list()', () => {
    it('returns paged result from repository', async () => {
      const expected: EnhancementPage = { data: mockData, total: 3, page: 1, limit: 20 };
      const repo = buildMockRepository(expected);
      const service = new EnhancementService(repo);

      const result = await service.list(defaultQuery);

      expect(repo.findAll).toBeCalledTimes(1);
      expect(repo.findAll).toBeCalledWith(defaultQuery);
      expect(result).toEqual(expected);
    });

    it('returns empty data when repository has no enhancements', async () => {
      const expected: EnhancementPage = { data: [], total: 0, page: 1, limit: 20 };
      const repo = buildMockRepository(expected);
      const service = new EnhancementService(repo);

      const result = await service.list(defaultQuery);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('passes tipo filter to repository', async () => {
      const positivos = mockData.filter((e) => e.tipo === 'positivo');
      const expected: EnhancementPage = { data: positivos, total: 2, page: 1, limit: 20 };
      const repo = buildMockRepository(expected);
      const service = new EnhancementService(repo);
      const query: EnhancementQuery = { tipo: 'positivo', page: 1, limit: 20 };

      const result = await service.list(query);

      expect(repo.findAll).toBeCalledWith(query);
      expect(result.data).toHaveLength(2);
    });

    it('passes search filter to repository', async () => {
      const filtered = mockData.filter((e) => e.nome.toLowerCase().includes('ambi'));
      const expected: EnhancementPage = { data: filtered, total: 1, page: 1, limit: 20 };
      const repo = buildMockRepository(expected);
      const service = new EnhancementService(repo);
      const query: EnhancementQuery = { search: 'ambi', page: 1, limit: 20 };

      const result = await service.list(query);

      expect(repo.findAll).toBeCalledWith(query);
      expect(result.data).toHaveLength(1);
    });

    it('passes pagination params to repository', async () => {
      const expected: EnhancementPage = { data: [mockData[2]!], total: 3, page: 2, limit: 2 };
      const repo = buildMockRepository(expected);
      const service = new EnhancementService(repo);
      const query: EnhancementQuery = { page: 2, limit: 2 };

      const result = await service.list(query);

      expect(repo.findAll).toBeCalledWith(query);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });
  });
});
