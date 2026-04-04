import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { weapons } from '../schema.ts';

interface RawWeapon {
  nome: string;
  categoria: string;
  dano: string;
  iniciativa: string;
  fonte: string;
  tipo: string;
  tipoDano: string | null;
  ocultabilidade: string | null;
  alcanceMedio: string | null;
  alcanceMax: string | null;
  calibre: string | null;
  alcanceEfetivo: string | null;
  rof: string | null;
  pente: string | null;
}

const SOURCE_FILE = './src/infrastructure/database/seeds/weapons_data.json';
const databaseUrl = process.env['DATABASE_URL'] ?? './data/erebus.db';

mkdirSync(dirname(databaseUrl), { recursive: true });

const sqlite = new Database(databaseUrl);
const db = drizzle({ client: sqlite });

const raw: RawWeapon[] = JSON.parse(readFileSync(SOURCE_FILE, 'utf-8')) as RawWeapon[];

const inserted = db
  .insert(weapons)
  .values(
    raw.map((w) => ({
      nome: w.nome,
      categoria: w.categoria,
      dano: w.dano,
      iniciativa: w.iniciativa,
      fonte: w.fonte,
      tipo: w.tipo,
      tipoDano: w.tipoDano ?? null,
      ocultabilidade: w.ocultabilidade ?? null,
      alcanceMedio: w.alcanceMedio ?? null,
      alcanceMax: w.alcanceMax ?? null,
      calibre: w.calibre ?? null,
      alcanceEfetivo: w.alcanceEfetivo ?? null,
      rof: w.rof ?? null,
      pente: w.pente ?? null,
    })),
  )
  .onConflictDoNothing()
  .run();

console.log(`Seed concluído. ${String(inserted.changes)} armas inseridas (de ${String(raw.length)} no arquivo).`);
