import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, like, and, sql } from 'drizzle-orm';
import {
  protectiveEquipment,
  protectiveEquipmentPt,
  protectiveIndex,
} from '../infrastructure/database/schema.ts';
import type { ProtectiveEquipment, ProtectiveIndexEntry } from '../model/entities/protective-equipment.entity.ts';
import type { DamageType } from '../model/enums/damage-type.enum.ts';
import { TYPES } from '../infrastructure/container/types.ts';

type AnyDrizzleDb = BetterSQLite3Database<any>;

export interface SearchParams {
  name?:       string;
  damageType?: keyof typeof DamageType;
  minIp?:      number;
}

export interface IProtectiveEquipmentRepository {
  findAll(locale: string): Promise<ProtectiveEquipment[]>;
  search(params: SearchParams, locale: string): Promise<ProtectiveEquipment[]>;
}

@injectable()
export class ProtectiveEquipmentRepository implements IProtectiveEquipmentRepository {
  private readonly db: AnyDrizzleDb;

  constructor(@inject(TYPES.DrizzleDb) db: AnyDrizzleDb) {
    this.db = db;
  }

  async findAll(locale: string): Promise<ProtectiveEquipment[]> {
    return this.queryEquipment(locale, {});
  }

  async search(params: SearchParams, locale: string): Promise<ProtectiveEquipment[]> {
    return this.queryEquipment(locale, params);
  }

  private queryEquipment(locale: string, params: SearchParams): ProtectiveEquipment[] {
    const isPtBR = locale === 'pt-BR';

    // Build equipment_ids filter when damageType is provided
    let filteredIds: number[] | null = null;
    if (params.damageType) {
      const minIp = params.minIp ?? 1;
      const rows = this.db
        .select({ equipmentId: protectiveIndex.equipmentId })
        .from(protectiveIndex)
        .where(
          and(
            eq(protectiveIndex.damageType, params.damageType),
            sql`${protectiveIndex.ipValue} >= ${minIp}`,
          ),
        )
        .all();
      filteredIds = rows.map((r) => r.equipmentId as number);

      // If no matches, return early
      if (filteredIds.length === 0) return [];
    }

    // Fetch all equipment rows (with optional name filter)
    let equipmentRows = this.db
      .select()
      .from(protectiveEquipment)
      .all();

    // Apply id filter if we have damageType constraint
    if (filteredIds !== null) {
      const idSet = new Set(filteredIds);
      equipmentRows = equipmentRows.filter((r) => idSet.has(r.id as number));
    }

    // Apply name filter
    if (params.name) {
      const nameLower = params.name.toLowerCase();
      if (isPtBR) {
        // We'll filter after join with pt translation
      } else {
        equipmentRows = equipmentRows.filter((r) =>
          (r.name as string).toLowerCase().includes(nameLower),
        );
      }
    }

    if (equipmentRows.length === 0) return [];

    const ids = equipmentRows.map((r) => r.id as number);

    // Fetch pt translations for all ids
    const ptRows = isPtBR
      ? this.db.select().from(protectiveEquipmentPt).all().filter((r) => ids.includes(r.equipmentId as number))
      : [];

    const ptMap = new Map<number, { name: string; description: string; source: string }>();
    for (const row of ptRows) {
      ptMap.set(row.equipmentId as number, {
        name:        row.name as string,
        description: row.description as string,
        source:      row.source as string,
      });
    }

    // Fetch all protective_index rows for these equipment ids
    const indexRows = this.db
      .select()
      .from(protectiveIndex)
      .all()
      .filter((r) => ids.includes(r.equipmentId as number));

    const indexMap = new Map<number, ProtectiveIndexEntry[]>();
    for (const row of indexRows) {
      const eid = row.equipmentId as number;
      if (!indexMap.has(eid)) indexMap.set(eid, []);
      indexMap.get(eid)!.push({
        damageType: row.damageType as keyof typeof DamageType,
        ipValue:    row.ipValue as number,
      });
    }

    const result: ProtectiveEquipment[] = equipmentRows.map((row) => {
      const id        = row.id as number;
      const ptEntry   = ptMap.get(id);
      const ipEntries = indexMap.get(id) ?? [];

      const resolvedName        = isPtBR && ptEntry ? ptEntry.name        : row.name as string;
      const resolvedDescription = isPtBR && ptEntry ? ptEntry.description : row.description as string;
      const resolvedSource      = isPtBR && ptEntry ? ptEntry.source      : row.source as string;

      return {
        id,
        name:            resolvedName,
        cost:            (row.cost as string | null) ?? null,
        availability:    (row.availability as string | null) ?? null,
        weightKg:        (row.weightKg as number | null) ?? null,
        dexPenalty:      row.dexPenalty as number,
        agiPenalty:      row.agiPenalty as number,
        description:     resolvedDescription,
        source:          resolvedSource,
        protectiveIndex: ipEntries,
      };
    });

    // Apply pt-BR name filter after resolving translations
    if (params.name && isPtBR) {
      const nameLower = params.name.toLowerCase();
      return result.filter((e) => e.name.toLowerCase().includes(nameLower));
    }

    return result;
  }
}
