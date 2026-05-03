import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { combatSkills } from '../schema.ts';

interface RawCombatSkill {
  nome: string;
  tipo: string;
  atributoAtaque: string | null;
  atributoDefesa: string | null;
  aprimoramentoRequerido: string | null;
  descricao: string;
}

const SOURCE_FILE = './src/infrastructure/database/seeds/combat_skills_data.json';
const databaseUrl = process.env['DATABASE_URL'] ?? './data/erebus.db';

mkdirSync(dirname(databaseUrl), { recursive: true });

const sqlite = new Database(databaseUrl);
const db = drizzle({ client: sqlite });

const raw: RawCombatSkill[] = JSON.parse(
  readFileSync(SOURCE_FILE, 'utf-8'),
) as RawCombatSkill[];

const inserted = db
  .insert(combatSkills)
  .values(
    raw.map((s) => ({
      nome: s.nome,
      tipo: s.tipo,
      atributoAtaque: s.atributoAtaque ?? null,
      atributoDefesa: s.atributoDefesa ?? null,
      aprimoramentoRequerido: s.aprimoramentoRequerido ?? null,
      descricao: s.descricao,
    })),
  )
  .onConflictDoNothing()
  .run();

console.log(
  `Seed concluído. ${String(inserted.changes)} perícias de combate inseridas (de ${String(raw.length)} no arquivo).`,
);
