import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { WeaponService } from '../../src/services/weapon.service.ts';
import type { IWeaponRepository } from '../../src/repositories/weapon.repository.ts';
import type { Weapon } from '../../src/model/entities/weapon.entity.ts';

const mockWeapons: Weapon[] = [
  {
    id: 1,
    nome: 'Faca',
    categoria: 'Adaga',
    dano: '1d3',
    iniciativa: '-3',
    fonte: 'Módulo Básico v1.01',
    tipo: 'branca',
    tipoDano: 'Corte/Perfuração',
    ocultabilidade: 'Bolso',
    alcanceMedio: null,
    alcanceMax: null,
    calibre: null,
    alcanceEfetivo: null,
    rof: null,
    pente: null,
  },
  {
    id: 2,
    nome: 'Arco Curto',
    categoria: 'Arco',
    dano: '1d6',
    iniciativa: '-3',
    fonte: 'Módulo Básico v1.01',
    tipo: 'branca_distancia',
    tipoDano: null,
    ocultabilidade: null,
    alcanceMedio: '30m',
    alcanceMax: '70m',
    calibre: null,
    alcanceEfetivo: null,
    rof: null,
    pente: null,
  },
];

function buildMockRepository(weapons: Weapon[] = mockWeapons): IWeaponRepository {
  return {
    findAll: jest.fn().mockResolvedValue(weapons),
  };
}

describe('WeaponService', () => {
  describe('getAll()', () => {
    it('returns all weapons when no tipo is provided', async () => {
      const repo = buildMockRepository();
      const service = new WeaponService(repo);

      const result = await service.getAll();

      expect(repo.findAll).toBeCalledTimes(1);
      expect(repo.findAll).toBeCalledWith(undefined);
      expect(result).toEqual(mockWeapons);
    });

    it('passes tipo filter to the repository', async () => {
      const brancas = mockWeapons.filter((w) => w.tipo === 'branca');
      const repo = buildMockRepository(brancas);
      const service = new WeaponService(repo);

      const result = await service.getAll('branca');

      expect(repo.findAll).toBeCalledTimes(1);
      expect(repo.findAll).toBeCalledWith('branca');
      expect(result).toEqual(brancas);
    });

    it('returns an empty array when the repository has no weapons', async () => {
      const repo = buildMockRepository([]);
      const service = new WeaponService(repo);

      const result = await service.getAll();

      expect(repo.findAll).toBeCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});
