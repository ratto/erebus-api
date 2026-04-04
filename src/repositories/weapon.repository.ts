import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { weapons } from '../infrastructure/database/schema.ts';
import type { Weapon } from '../model/entities/weapon.entity.ts';
import { TYPES } from '../infrastructure/container/types.ts';

export interface IWeaponRepository {
  findAll(tipo?: string): Promise<Weapon[]>;
}

type AnyDrizzleDb = BetterSQLite3Database<any>;

@injectable()
export class WeaponRepository implements IWeaponRepository {
  private readonly db: AnyDrizzleDb;

  constructor(@inject(TYPES.DrizzleDb) db: AnyDrizzleDb) {
    this.db = db;
  }

  async findAll(tipo?: string): Promise<Weapon[]> {
    const rows = tipo
      ? this.db.select().from(weapons).where(eq(weapons.tipo, tipo)).all()
      : this.db.select().from(weapons).all();

    return rows.map((row) => ({
      id: row.id as number,
      nome: row.nome as string,
      categoria: row.categoria as string,
      dano: row.dano as string,
      iniciativa: row.iniciativa as string,
      fonte: row.fonte as string,
      tipo: row.tipo as string,
      tipoDano: (row.tipoDano as string | null) ?? null,
      ocultabilidade: (row.ocultabilidade as string | null) ?? null,
      alcanceMedio: (row.alcanceMedio as string | null) ?? null,
      alcanceMax: (row.alcanceMax as string | null) ?? null,
      calibre: (row.calibre as string | null) ?? null,
      alcanceEfetivo: (row.alcanceEfetivo as string | null) ?? null,
      rof: (row.rof as string | null) ?? null,
      pente: (row.pente as string | null) ?? null,
    }));
  }
}
