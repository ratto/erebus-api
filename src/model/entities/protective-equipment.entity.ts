import type { DamageType } from '../enums/damage-type.enum.ts';

export interface ProtectiveIndexEntry {
  damageType: keyof typeof DamageType; // 'KINETIC' | 'BALLISTIC' | ... — string label
  ipValue: number;                     // sempre >= 0
}

export interface ProtectiveEquipment {
  id:              number;
  name:            string;
  cost:            string | null;
  availability:    string | null;
  weightKg:        number | null;
  dexPenalty:      number; // valor positivo; subtraído do atributo
  agiPenalty:      number; // valor positivo; subtraído do atributo
  description:     string;
  source:          string;
  protectiveIndex: ProtectiveIndexEntry[]; // sempre 8 entries (todos os tipos), ordenado por DamageType
}
