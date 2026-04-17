import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { eq, like, and, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { enhancements } from '../infrastructure/database/schema.ts';
import type { Enhancement } from '../model/entities/enhancement.entity.ts';
import { TYPES } from '../infrastructure/container/types.ts';

export interface EnhancementQuery {
  tipo?: 'positivo' | 'negativo';
  search?: string;
  page: number;
  limit: number;
}

export interface EnhancementPage {
  data: Enhancement[];
  total: number;
  page: number;
  limit: number;
}

export interface IEnhancementRepository {
  findAll(query: EnhancementQuery): Promise<EnhancementPage>;
}

type AnyDrizzleDb = BetterSQLite3Database<any>;

@injectable()
export class EnhancementRepository implements IEnhancementRepository {
  private readonly db: AnyDrizzleDb;

  constructor(@inject(TYPES.DrizzleDb) db: AnyDrizzleDb) {
    this.db = db;
  }

  async findAll(query: EnhancementQuery): Promise<EnhancementPage> {
    const { tipo, search, page, limit } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (tipo) conditions.push(eq(enhancements.tipo, tipo));
    if (search) conditions.push(like(sql`lower(${enhancements.nome})`, `%${search.toLowerCase()}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = where
      ? this.db.select().from(enhancements).where(where).limit(limit).offset(offset).all()
      : this.db.select().from(enhancements).limit(limit).offset(offset).all();

    const countRows = where
      ? this.db.select({ count: sql<number>`count(*)` }).from(enhancements).where(where).all()
      : this.db.select({ count: sql<number>`count(*)` }).from(enhancements).all();

    const total = (countRows[0]?.count as number) ?? 0;

    const data: Enhancement[] = rows.map((row) => ({
      id: row.id as number,
      nome: row.nome as string,
      descricao: row.descricao as string,
      tipo: row.tipo as 'positivo' | 'negativo',
      custo: row.custo as number,
    }));

    return { data, total, page, limit };
  }
}
