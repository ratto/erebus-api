import { describe, expect, it } from '@jest/globals';
import { DamageType, VALID_DAMAGE_TYPES } from '../../src/model/enums/damage-type.enum.ts';

describe('DamageType enum', () => {
  it('define os 7 tipos de dano esperados com nomes corretos', () => {
    expect(DamageType.KINETIC).toBeDefined();
    expect(DamageType.BALLISTIC).toBeDefined();
    expect(DamageType.FIRE).toBeDefined();
    expect(DamageType.COLD).toBeDefined();
    expect(DamageType.GAS).toBeDefined();
    expect(DamageType.ACID).toBeDefined();
    expect(DamageType.VACUUM).toBeDefined();
  });

  it('mapeia cada nome ao valor numerico estavel esperado', () => {
    expect(DamageType.KINETIC).toBe(0);
    expect(DamageType.BALLISTIC).toBe(1);
    expect(DamageType.FIRE).toBe(2);
    expect(DamageType.COLD).toBe(3);
    expect(DamageType.GAS).toBe(4);
    expect(DamageType.ACID).toBe(5);
    expect(DamageType.VACUUM).toBe(6);
  });

  it('expoe exatamente 7 valores numericos distintos', () => {
    expect(VALID_DAMAGE_TYPES).toHaveLength(7);
    const uniques = new Set(VALID_DAMAGE_TYPES);
    expect(uniques.size).toBe(7);
  });

  it('permite reverse-mapping (numero -> nome) como numeric enum TypeScript', () => {
    expect(DamageType[0]).toBe('KINETIC');
    expect(DamageType[1]).toBe('BALLISTIC');
    expect(DamageType[2]).toBe('FIRE');
    expect(DamageType[3]).toBe('COLD');
    expect(DamageType[4]).toBe('GAS');
    expect(DamageType[5]).toBe('ACID');
    expect(DamageType[6]).toBe('VACUUM');
  });
});
