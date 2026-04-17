import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { enhancements } from '../schema.ts';

interface RawEnhancement {
  nome: string;
  descricao: string;
  tipo: 'positivo' | 'negativo';
  custo: number;
}

const SOURCE_FILE = './src/infrastructure/database/seeds/enhancements_data.json';
const databaseUrl = process.env['DATABASE_URL'] ?? './data/erebus.db';

mkdirSync(dirname(databaseUrl), { recursive: true });

const sqlite = new Database(databaseUrl);
const db = drizzle({ client: sqlite });

const raw: RawEnhancement[] = JSON.parse(readFileSync(SOURCE_FILE, 'utf-8')) as RawEnhancement[];

const inserted = db
  .insert(enhancements)
  .values(raw.map((e) => ({ nome: e.nome, descricao: e.descricao, tipo: e.tipo, custo: e.custo })))
  .onConflictDoNothing()
  .run();

console.log(`Seed concluído. ${String(inserted.changes)} aprimoramentos inseridos (de ${String(raw.length)} no arquivo).`);
