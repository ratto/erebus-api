import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { combatSkills } from '../infrastructure/database/schema.ts';
import type { CombatSkill } from '../model/entities/combat-skill.entity.ts';
import { TYPES } from '../infrastructure/container/types.ts';

export interface ICombatSkillRepository {
  findAll(): Promise<CombatSkill[]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDrizzleDb = BetterSQLite3Database<any>;

@injectable()
export class CombatSkillRepository implements ICombatSkillRepository {
  private readonly db: AnyDrizzleDb;

  constructor(@inject(TYPES.DrizzleDb) db: AnyDrizzleDb) {
    this.db = db;
  }

  async findAll(): Promise<CombatSkill[]> {
    const rows = this.db.select().from(combatSkills).all();
    return rows.map((row) => ({
      id: row.id as number,
      nome: row.nome as string,
      tipo: row.tipo as 'melee' | 'ranged' | 'shield',
      atributoAtaque: (row.atributoAtaque as string | null) ?? null,
      atributoDefesa: (row.atributoDefesa as string | null) ?? null,
      aprimoramentoRequerido: (row.aprimoramentoRequerido as string | null) ?? null,
      descricao: row.descricao as string,
    }));
  }
}
