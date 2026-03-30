import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { SkillService } from '../../src/services/skill.service.ts';
import type { ISkillRepository } from '../../src/repositories/skill.repository.ts';
import type { Skill } from '../../src/model/entities/skill.entity.ts';

const mockSkills: Skill[] = [
  {
    id: 1,
    nome: 'Espada',
    grupo: 'Combate',
    atributoBase: 'DEX',
    apenasComTreinamento: true,
    sinergia: null,
    descricao: 'Uso de espadas',
  },
  {
    id: 2,
    nome: 'Magia',
    grupo: 'Arcano',
    atributoBase: 'INT',
    apenasComTreinamento: true,
    sinergia: 'Conhecimento Arcano (Arcano)',
    descricao: 'Lançar feitiços',
  },
];

function buildMockRepository(skills: Skill[] = mockSkills): ISkillRepository {
  return {
    findAll: jest.fn().mockResolvedValue(skills),
  };
}

describe('SkillService', () => {
  describe('getAll()', () => {
    it('returns the skills provided by the repository', async () => {
      const repo = buildMockRepository();
      const service = new SkillService(repo);

      const result = await service.getAll();

      expect(repo.findAll).toBeCalledTimes(1);
      expect(result).toEqual(mockSkills);
    });

    it('returns an empty array when the repository has no skills', async () => {
      const repo = buildMockRepository([]);
      const service = new SkillService(repo);

      const result = await service.getAll();

      expect(repo.findAll).toBeCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});
