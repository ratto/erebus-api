import { describe, expect, it } from '@jest/globals';
import {
  DamageType,
  VALID_DAMAGE_TYPES,
  damageTypeToString,
  damageTypeFromString,
} from '../../src/model/enums/damage-type.enum.ts';

describe('DamageType enum', () => {
  it('define os 8 tipos de dano esperados com nomes corretos', () => {
    expect(DamageType.KINETIC).toBeDefined();
    expect(DamageType.BALLISTIC).toBeDefined();
    expect(DamageType.FIRE).toBeDefined();
    expect(DamageType.COLD).toBeDefined();
    expect(DamageType.GAS).toBeDefined();
    expect(DamageType.ACID).toBeDefined();
    expect(DamageType.VACUUM).toBeDefined();
    expect(DamageType.ELECTRIC).toBeDefined();
  });

  it('mapeia cada nome ao valor numerico estavel esperado', () => {
    expect(DamageType.KINETIC).toBe(0);
    expect(DamageType.BALLISTIC).toBe(1);
    expect(DamageType.FIRE).toBe(2);
    expect(DamageType.COLD).toBe(3);
    expect(DamageType.GAS).toBe(4);
    expect(DamageType.ACID).toBe(5);
    expect(DamageType.VACUUM).toBe(6);
    expect(DamageType.ELECTRIC).toBe(7);
  });

  it('expoe exatamente 8 valores numericos distintos', () => {
    expect(VALID_DAMAGE_TYPES).toHaveLength(8);
    const uniques = new Set(VALID_DAMAGE_TYPES);
    expect(uniques.size).toBe(8);
  });

  it('permite reverse-mapping (numero -> nome) como numeric enum TypeScript', () => {
    expect(DamageType[0]).toBe('KINETIC');
    expect(DamageType[1]).toBe('BALLISTIC');
    expect(DamageType[2]).toBe('FIRE');
    expect(DamageType[3]).toBe('COLD');
    expect(DamageType[4]).toBe('GAS');
    expect(DamageType[5]).toBe('ACID');
    expect(DamageType[6]).toBe('VACUUM');
    expect(DamageType[7]).toBe('ELECTRIC');
  });

  describe('damageTypeToString()', () => {
    it('retorna a chave string para cada valor do enum', () => {
      expect(damageTypeToString(DamageType.KINETIC)).toBe('KINETIC');
      expect(damageTypeToString(DamageType.BALLISTIC)).toBe('BALLISTIC');
      expect(damageTypeToString(DamageType.FIRE)).toBe('FIRE');
      expect(damageTypeToString(DamageType.COLD)).toBe('COLD');
      expect(damageTypeToString(DamageType.GAS)).toBe('GAS');
      expect(damageTypeToString(DamageType.ACID)).toBe('ACID');
      expect(damageTypeToString(DamageType.VACUUM)).toBe('VACUUM');
      expect(damageTypeToString(DamageType.ELECTRIC)).toBe('ELECTRIC');
    });

    it('lanca erro para valor desconhecido', () => {
      expect(() => damageTypeToString(99 as DamageType)).toThrow('Unknown DamageType value: 99');
    });
  });

  describe('damageTypeFromString()', () => {
    it('retorna o valor do enum para cada chave string valida', () => {
      expect(damageTypeFromString('KINETIC')).toBe(DamageType.KINETIC);
      expect(damageTypeFromString('BALLISTIC')).toBe(DamageType.BALLISTIC);
      expect(damageTypeFromString('FIRE')).toBe(DamageType.FIRE);
      expect(damageTypeFromString('COLD')).toBe(DamageType.COLD);
      expect(damageTypeFromString('GAS')).toBe(DamageType.GAS);
      expect(damageTypeFromString('ACID')).toBe(DamageType.ACID);
      expect(damageTypeFromString('VACUUM')).toBe(DamageType.VACUUM);
      expect(damageTypeFromString('ELECTRIC')).toBe(DamageType.ELECTRIC);
    });

    it('lanca erro para chave desconhecida', () => {
      expect(() => damageTypeFromString('FOGO')).toThrow('Unknown DamageType key: FOGO');
    });
  });
});
