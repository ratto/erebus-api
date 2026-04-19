import type { DamageType } from '../enums/damage-type.enum.ts';

export type WeaponDamage = {
  dieRoll: string;
  type: DamageType;
};
