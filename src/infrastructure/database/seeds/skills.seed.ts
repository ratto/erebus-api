import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { skills } from '../schema.ts';

interface RawSkill {
  id: number;
  nome: string;
  grupo: string | null;
  atributoBase: string | null;
  apenasComTreinamento: boolean;
  sinergia: string | null;
  descricao: string;
}

const SOURCE_FILE = './src/infrastructure/database/seeds/skills_data.json';
const databaseUrl = process.env['DATABASE_URL'] ?? './data/erebus.db';

mkdirSync(dirname(databaseUrl), { recursive: true });

const sqlite = new Database(databaseUrl);
const db = drizzle({ client: sqlite });

const raw: RawSkill[] = JSON.parse(readFileSync(SOURCE_FILE, 'utf-8')) as RawSkill[];

// Normalize CONS → CON in atributoBase
const normalized = raw.map((skill) => ({
  nome: skill.nome,
  grupo: skill.grupo ?? null,
  atributoBase: skill.atributoBase === 'CONS' ? 'CON' : (skill.atributoBase ?? null),
  apenasComTreinamento: skill.apenasComTreinamento ? 1 : 0,
  sinergia: skill.sinergia ?? null,
  descricao: skill.descricao,
}));

// Idependent insert: skip duplicates based on nome
const inserted = db
  .insert(skills)
  .values(
    normalized.map((s) => ({
      nome: s.nome,
      grupo: s.grupo,
      atributoBase: s.atributoBase,
      apenasComTreinamento: s.apenasComTreinamento === 1,
      sinergia: s.sinergia,
      descricao: s.descricao,
    })),
  )
  .onConflictDoNothing()
  .run();

console.log(`Seed concluído. ${String(inserted.changes)} perícias inseridas (de ${String(raw.length)} no arquivo).`);
