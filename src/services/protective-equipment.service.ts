import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../infrastructure/container/types.ts';
import type { IProtectiveEquipmentRepository, SearchParams } from '../repositories/protective-equipment.repository.ts';
import type { ProtectiveEquipment, ProtectiveIndexEntry } from '../model/entities/protective-equipment.entity.ts';
import { DamageType } from '../model/enums/damage-type.enum.ts';

const ORDERED_DAMAGE_TYPE_KEYS = (
  Object.entries(DamageType)
    .filter(([, v]) => typeof v === 'number')
    .sort((a, b) => (a[1] as number) - (b[1] as number))
    .map(([k]) => k) as Array<keyof typeof DamageType>
);

export interface ProtectiveEquipmentResult {
  locale:              string;
  protectiveEquipment: ProtectiveEquipment[];
}

export interface IProtectiveEquipmentService {
  getAll(acceptLanguage: string | undefined): Promise<ProtectiveEquipmentResult>;
  search(params: SearchParams, acceptLanguage: string | undefined): Promise<ProtectiveEquipmentResult>;
  resolveLocale(acceptLanguage: string | undefined): string;
  fillMissingIpEntries(item: ProtectiveEquipment): ProtectiveEquipment;
}

@injectable()
export class ProtectiveEquipmentService implements IProtectiveEquipmentService {
  constructor(
    @inject(TYPES.IProtectiveEquipmentRepository)
    private readonly repository: IProtectiveEquipmentRepository,
  ) {}

  /**
   * Parses the Accept-Language header and resolves to 'pt-BR' or 'en-US'.
   * Supports headers like: 'pt-BR', 'pt-br', 'pt_BR', 'pt-BR,en;q=0.9'.
   * Anything not matching pt-BR falls back to 'en-US'.
   */
  resolveLocale(acceptLanguage: string | undefined): string {
    if (!acceptLanguage) return 'en-US';

    // Take first token from composite header (e.g., 'pt-BR,en;q=0.9' → 'pt-BR')
    const firstToken = acceptLanguage.split(',')[0]?.trim() ?? '';

    if (/^pt[-_]BR$/i.test(firstToken)) return 'pt-BR';
    return 'en-US';
  }

  /**
   * Ensures every item has exactly 8 ProtectiveIndexEntry entries (one per DamageType),
   * filling missing types with ipValue: 0. Entries are ordered by DamageType numeric value.
   */
  fillMissingIpEntries(item: ProtectiveEquipment): ProtectiveEquipment {
    const existingMap = new Map<string, number>();
    for (const entry of item.protectiveIndex) {
      existingMap.set(entry.damageType, entry.ipValue);
    }

    const filledIndex: ProtectiveIndexEntry[] = ORDERED_DAMAGE_TYPE_KEYS.map((key) => ({
      damageType: key,
      ipValue:    existingMap.get(key) ?? 0,
    }));

    return { ...item, protectiveIndex: filledIndex };
  }

  async getAll(acceptLanguage: string | undefined): Promise<ProtectiveEquipmentResult> {
    const locale = this.resolveLocale(acceptLanguage);
    const items  = await this.repository.findAll(locale);
    return {
      locale,
      protectiveEquipment: items.map((item) => this.fillMissingIpEntries(item)),
    };
  }

  async search(params: SearchParams, acceptLanguage: string | undefined): Promise<ProtectiveEquipmentResult> {
    const locale = this.resolveLocale(acceptLanguage);
    const items  = await this.repository.search(params, locale);
    return {
      locale,
      protectiveEquipment: items.map((item) => this.fillMissingIpEntries(item)),
    };
  }
}
