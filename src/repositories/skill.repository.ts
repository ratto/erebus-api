import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { skills } from '../infrastructure/database/schema.ts';
import type { Skill } from '../model/entities/skill.entity.ts';
import { TYPES } from '../infrastructure/container/types.ts';

export interface ISkillRepository {
  findAll(): Promise<Skill[]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDrizzleDb = BetterSQLite3Database<any>;

@injectable()
export class SkillRepository implements ISkillRepository {
  private readonly db: AnyDrizzleDb;

  constructor(@inject(TYPES.DrizzleDb) db: AnyDrizzleDb) {
    this.db = db;
  }

  async findAll(): Promise<Skill[]> {
    const rows = this.db.select().from(skills).all();
    return rows.map((row) => ({
      id: row.id as number,
      nome: row.nome as string,
      grupo: (row.grupo as string | null) ?? null,
      atributoBase: (row.atributoBase as string | null) ?? null,
      apenasComTreinamento: (row.apenasComTreinamento as boolean | null) ?? false,
      sinergia: (row.sinergia as string | null) ?? null,
      descricao: row.descricao as string,
    }));
  }
}
