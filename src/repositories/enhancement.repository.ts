import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { enhancements } from '../infrastructure/database/schema.ts';
import type { Enhancement } from '../model/entities/enhancement.entity.ts';
import { TYPES } from '../infrastructure/container/types.ts';

export interface IEnhancementRepository {
  findAll(): Promise<Enhancement[]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDrizzleDb = BetterSQLite3Database<any>;

@injectable()
export class EnhancementRepository implements IEnhancementRepository {
  private readonly db: AnyDrizzleDb;

  constructor(@inject(TYPES.DrizzleDb) db: AnyDrizzleDb) {
    this.db = db;
  }

  async findAll(): Promise<Enhancement[]> {
    const rows = this.db.select().from(enhancements).all();
    return rows.map((row) => ({
      id: row.id as number,
      nome: row.nome as string,
      tipo: row.tipo as 'positivo' | 'negativo',
      custo: row.custo as number,
      descricao: row.descricao as string,
    }));
  }
}
