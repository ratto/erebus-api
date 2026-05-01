import 'reflect-metadata';
import { describe, it, expect, jest } from '@jest/globals';
import { ProtectiveEquipmentService } from '../../src/services/protective-equipment.service.ts';
import type { IProtectiveEquipmentRepository } from '../../src/repositories/protective-equipment.repository.ts';
import type { ProtectiveEquipment } from '../../src/model/entities/protective-equipment.entity.ts';
import { DamageType } from '../../src/model/enums/damage-type.enum.ts';

const ALL_DAMAGE_TYPE_KEYS = Object.keys(DamageType).filter(
  (k) => isNaN(Number(k)),
) as Array<keyof typeof DamageType>;

function makeChainmail(overrides: Partial<ProtectiveEquipment> = {}): ProtectiveEquipment {
  return {
    id: 1,
    name: 'Chainmail',
    cost: null,
    availability: null,
    weightKg: null,
    dexPenalty: 3,
    agiPenalty: 2,
    description: 'Interlocked metal rings.',
    source: 'TREVAS, 3rd ed.',
    protectiveIndex: [
      { damageType: 'KINETIC',   ipValue: 6 },
      { damageType: 'BALLISTIC', ipValue: 2 },
    ],
    ...overrides,
  };
}

function makeRepo(items: ProtectiveEquipment[]): IProtectiveEquipmentRepository {
  return {
    findAll: jest.fn().mockResolvedValue(items) as IProtectiveEquipmentRepository['findAll'],
    search:  jest.fn().mockResolvedValue(items) as IProtectiveEquipmentRepository['search'],
  };
}

describe('ProtectiveEquipmentService', () => {
  describe('resolveLocale()', () => {
    const repo = makeRepo([]);
    const service = new ProtectiveEquipmentService(repo);

    it('resolves "pt-BR" to pt-BR', () => {
      expect(service.resolveLocale('pt-BR')).toBe('pt-BR');
    });

    it('resolves "pt-br" (lowercase) to pt-BR', () => {
      expect(service.resolveLocale('pt-br')).toBe('pt-BR');
    });

    it('resolves "pt_BR" (underscore) to pt-BR', () => {
      expect(service.resolveLocale('pt_BR')).toBe('pt-BR');
    });

    it('resolves composite header "pt-BR,en;q=0.9" to pt-BR', () => {
      expect(service.resolveLocale('pt-BR,en;q=0.9')).toBe('pt-BR');
    });

    it('resolves "en-US" to en-US', () => {
      expect(service.resolveLocale('en-US')).toBe('en-US');
    });

    it('resolves undefined/empty to en-US', () => {
      expect(service.resolveLocale(undefined)).toBe('en-US');
      expect(service.resolveLocale('')).toBe('en-US');
    });

    it('resolves unknown language to en-US', () => {
      expect(service.resolveLocale('fr-FR')).toBe('en-US');
    });
  });

  describe('fillMissingIpEntries()', () => {
    it('fills all 8 damage types when protectiveIndex has partial entries', () => {
      const repo = makeRepo([]);
      const service = new ProtectiveEquipmentService(repo);

      const item = makeChainmail();
      const filled = service.fillMissingIpEntries(item);

      expect(filled.protectiveIndex).toHaveLength(8);
      for (const key of ALL_DAMAGE_TYPE_KEYS) {
        const entry = filled.protectiveIndex.find((e) => e.damageType === key);
        expect(entry).toBeDefined();
        expect(typeof entry!.ipValue).toBe('number');
        expect(entry!.ipValue).toBeGreaterThanOrEqual(0);
      }
    });

    it('preserves existing ip values and fills missing ones with zero', () => {
      const repo = makeRepo([]);
      const service = new ProtectiveEquipmentService(repo);

      const item = makeChainmail();
      const filled = service.fillMissingIpEntries(item);

      const kinetic   = filled.protectiveIndex.find((e) => e.damageType === 'KINETIC');
      const ballistic = filled.protectiveIndex.find((e) => e.damageType === 'BALLISTIC');
      const fire      = filled.protectiveIndex.find((e) => e.damageType === 'FIRE');

      expect(kinetic!.ipValue).toBe(6);
      expect(ballistic!.ipValue).toBe(2);
      expect(fire!.ipValue).toBe(0);
    });

    it('orders entries by DamageType numeric value (KINETIC first, ELECTRIC last)', () => {
      const repo = makeRepo([]);
      const service = new ProtectiveEquipmentService(repo);

      const item = makeChainmail({
        protectiveIndex: [
          { damageType: 'ELECTRIC', ipValue: 5 },
          { damageType: 'KINETIC',  ipValue: 6 },
        ],
      });
      const filled = service.fillMissingIpEntries(item);

      const keys = filled.protectiveIndex.map((e) => e.damageType);
      expect(keys[0]).toBe('KINETIC');
      expect(keys[keys.length - 1]).toBe('ELECTRIC');
    });
  });

  describe('getAll()', () => {
    it('calls repository.findAll with resolved locale', async () => {
      const item = makeChainmail();
      const repo = makeRepo([item]);
      const service = new ProtectiveEquipmentService(repo);

      const result = await service.getAll('pt-BR');

      expect(repo.findAll).toHaveBeenCalledWith('pt-BR');
      expect(result.locale).toBe('pt-BR');
    });

    it('returns protectiveEquipment array with all 8 ip entries per item', async () => {
      const item = makeChainmail();
      const repo = makeRepo([item]);
      const service = new ProtectiveEquipmentService(repo);

      const result = await service.getAll('en-US');

      expect(result.protectiveEquipment).toHaveLength(1);
      expect(result.protectiveEquipment[0]!.protectiveIndex).toHaveLength(8);
    });
  });

  describe('search()', () => {
    it('calls repository.search with resolved locale and params', async () => {
      const item = makeChainmail();
      const repo = makeRepo([item]);
      const service = new ProtectiveEquipmentService(repo);

      const result = await service.search({ damageType: 'BALLISTIC', minIp: 2 }, 'en-US');

      expect(repo.search).toHaveBeenCalledWith({ damageType: 'BALLISTIC', minIp: 2 }, 'en-US');
      expect(result.locale).toBe('en-US');
    });

    it('fills ip entries in search results', async () => {
      const item = makeChainmail();
      const repo = makeRepo([item]);
      const service = new ProtectiveEquipmentService(repo);

      const result = await service.search({}, 'en-US');

      expect(result.protectiveEquipment[0]!.protectiveIndex).toHaveLength(8);
    });
  });
});
