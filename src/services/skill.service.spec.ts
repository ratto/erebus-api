import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../errors/not-found.error';
import { BaseAttribute, InitialValueType } from '../models/enums/base-attribute.enum';
import { SourceLevel } from '../models/enums/source-level.enum';

import { SkillService } from './skill.service';

import type { Skill } from '../models/entities/skill.entity';
import type { ISkillRepository } from '../repositories/interfaces/skill.repository.interface';

const buildSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: 12,
  name: 'Condução',
  parentSkillId: null,
  parentSkillName: null,
  parentBaseAttribute: null,
  hasSubgroups: false,
  baseAttribute: BaseAttribute.Agility,
  initialValueType: InitialValueType.Instinctive,
  category: null,
  description: 'Perícia de grupo para operar veículos.',
  prerequisite: null,
  damage: null,
  notes: null,
  sourceLevel: SourceLevel.Canonical,
  source: 'pericias.json → lista · manual l.809',
  editionOrVersion: 'Manual Básico 1.04 (dez/2022)',
  ...overrides,
});

describe('SkillService', () => {
  let repository: ISkillRepository;
  let service: SkillService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findChildren: vi.fn(),
    };
    service = new SkillService(repository);
  });

  describe('list', () => {
    it('delegates the filter to the repository unchanged', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);

      await service.list({ name: 'condu', sourceLevel: 1, baseAttribute: 'AGI', rootOnly: true });

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(repository.findAll).toHaveBeenCalledWith({
        name: 'condu',
        sourceLevel: 1,
        baseAttribute: 'AGI',
        rootOnly: true,
      });
    });

    it('returns an empty array when nothing matches', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);

      await expect(service.list({})).resolves.toEqual([]);
    });

    it('projects every entity onto the response shape, preserving provenance', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([buildSkill()]);

      await expect(service.list({})).resolves.toEqual([
        {
          id: 12,
          name: 'Condução',
          parentSkillId: null,
          parentSkillName: null,
          hasSubgroups: false,
          baseAttribute: 'AGI',
          effectiveBaseAttribute: 'AGI',
          category: null,
          description: 'Perícia de grupo para operar veículos.',
          initialValueType: 'instinctive',
          prerequisite: null,
          damage: null,
          notes: null,
          sourceLevel: 1,
          source: 'pericias.json → lista · manual l.809',
          editionOrVersion: 'Manual Básico 1.04 (dez/2022)',
        },
      ]);
    });

    it('resolves the effective attribute from the group when the skill declares none', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([
        buildSkill({
          id: 41,
          name: 'Automóvel',
          parentSkillId: 12,
          parentSkillName: 'Condução',
          parentBaseAttribute: BaseAttribute.Agility,
          baseAttribute: null,
        }),
      ]);

      const [dto] = await service.list({});

      expect(dto?.baseAttribute).toBeNull();
      expect(dto?.effectiveBaseAttribute).toBe('AGI');
    });

    it('keeps the effective attribute null when neither level declares one', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([
        buildSkill({ name: 'Explosivos', baseAttribute: null, parentBaseAttribute: null }),
      ]);

      const [dto] = await service.list({});

      expect(dto?.effectiveBaseAttribute).toBeNull();
    });

    it('prefers the skill own attribute over the group one', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([
        buildSkill({
          baseAttribute: BaseAttribute.Dexterity,
          parentBaseAttribute: BaseAttribute.Agility,
        }),
      ]);

      const [dto] = await service.list({});

      expect(dto?.effectiveBaseAttribute).toBe('DEX');
    });

    it('never exposes the internal parent base attribute', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([buildSkill()]);

      const [dto] = await service.list({});

      expect(dto).not.toHaveProperty('parentBaseAttribute');
    });
  });

  describe('getById', () => {
    it('asks the repository for that identifier', async () => {
      vi.mocked(repository.findById).mockResolvedValue(buildSkill({ id: 42 }));

      await service.getById(42);

      expect(repository.findById).toHaveBeenCalledWith(42);
    });

    it('throws NotFoundError when the repository returns null', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('names the missing resource in the error detail', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow('Skill with id 999 was not found.');
    });

    it('loads the children of a group and exposes them as subgroups', async () => {
      vi.mocked(repository.findById).mockResolvedValue(buildSkill({ hasSubgroups: true }));
      vi.mocked(repository.findChildren).mockResolvedValue([
        buildSkill({
          id: 41,
          name: 'Automóvel',
          parentSkillId: 12,
          parentSkillName: 'Condução',
          parentBaseAttribute: BaseAttribute.Agility,
          baseAttribute: null,
          category: 'condução',
        }),
      ]);

      const detail = await service.getById(12);

      expect(repository.findChildren).toHaveBeenCalledWith(12);
      expect(detail.subgroups).toHaveLength(1);
      expect(detail.subgroups[0]).toMatchObject({
        id: 41,
        name: 'Automóvel',
        category: 'condução',
        effectiveBaseAttribute: 'AGI',
        sourceLevel: 1,
      });
    });

    it('does not query for children of a leaf, answering with an empty array', async () => {
      vi.mocked(repository.findById).mockResolvedValue(buildSkill({ hasSubgroups: false }));

      const detail = await service.getById(12);

      expect(repository.findChildren).not.toHaveBeenCalled();
      expect(detail.subgroups).toEqual([]);
    });

    it('keeps the detail element shape identical to a list element', async () => {
      vi.mocked(repository.findById).mockResolvedValue(buildSkill());
      vi.mocked(repository.findAll).mockResolvedValue([buildSkill()]);

      const [listed] = await service.list({});
      const { subgroups: _subgroups, ...detail } = await service.getById(12);

      expect(detail).toEqual(listed);
    });
  });
});
