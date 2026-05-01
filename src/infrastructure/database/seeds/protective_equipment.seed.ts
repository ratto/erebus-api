import 'dotenv/config';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { protectiveEquipment, protectiveEquipmentPt, protectiveIndex } from '../schema.ts';

interface RawEquipment {
  name:         string;
  cost:         string | null;
  availability: string | null;
  weightKg:     number | null;
  dexPenalty:   number;
  agiPenalty:   number;
  description:  string;
  source:       string;
}

interface RawEquipmentPt {
  equipmentName: string;
  name:          string;
  description:   string;
  source:        string;
}

interface RawProtectiveIndex {
  equipmentName: string;
  damageType:    string;
  ipValue:       number;
}

const BASE_DIR    = './src/infrastructure/database/seeds';
const databaseUrl = process.env['DATABASE_URL'] ?? './data/erebus.db';

mkdirSync(dirname(databaseUrl), { recursive: true });

const sqlite = new Database(databaseUrl);
sqlite.pragma('foreign_keys = ON');
const db = drizzle({ client: sqlite });

// ---- 1. Read JSON files ----
const equipmentData  = JSON.parse(readFileSync(`${BASE_DIR}/protective_equipment_data.json`,    'utf-8')) as RawEquipment[];
const equipmentPtData = JSON.parse(readFileSync(`${BASE_DIR}/protective_equipment_pt_data.json`, 'utf-8')) as RawEquipmentPt[];
const indexData       = JSON.parse(readFileSync(`${BASE_DIR}/protective_index_data.json`,        'utf-8')) as RawProtectiveIndex[];

// ---- 2. Insert into protective_equipment ----
const equipmentInserted = db
  .insert(protectiveEquipment)
  .values(
    equipmentData.map((e) => ({
      name:         e.name,
      cost:         e.cost ?? null,
      availability: e.availability ?? null,
      weightKg:     e.weightKg ?? null,
      dexPenalty:   e.dexPenalty,
      agiPenalty:   e.agiPenalty,
      description:  e.description,
      source:       e.source,
    })),
  )
  .onConflictDoNothing({ target: protectiveEquipment.name })
  .run();

// ---- 3. Build name → id map ----
const nameToId = new Map<string, number>();
const rows = sqlite.prepare('SELECT id, name FROM protective_equipment').all() as { id: number; name: string }[];
for (const row of rows) {
  nameToId.set(row.name, row.id);
}

// ---- 4. Insert into protective_equipment_pt ----
const ptValues = equipmentPtData
  .map((pt) => {
    const equipmentId = nameToId.get(pt.equipmentName);
    if (equipmentId === undefined) {
      console.log(`[WARN] pt translation — equipment not found: "${pt.equipmentName}". Skipping.`);
      return null;
    }
    return {
      equipmentId,
      name:        pt.name,
      description: pt.description,
      source:      pt.source,
    };
  })
  .filter((v): v is NonNullable<typeof v> => v !== null);

const ptInserted = ptValues.length > 0
  ? db
      .insert(protectiveEquipmentPt)
      .values(ptValues)
      .onConflictDoNothing({ target: protectiveEquipmentPt.equipmentId })
      .run()
  : { changes: 0 };

// ---- 5. Insert into protective_index ----
const indexValues = indexData
  .map((entry) => {
    const equipmentId = nameToId.get(entry.equipmentName);
    if (equipmentId === undefined) {
      console.log(`[WARN] index — equipment not found: "${entry.equipmentName}". Skipping.`);
      return null;
    }
    return {
      equipmentId,
      damageType: entry.damageType,
      ipValue:    entry.ipValue,
    };
  })
  .filter((v): v is NonNullable<typeof v> => v !== null);

const indexInserted = indexValues.length > 0
  ? db
      .insert(protectiveIndex)
      .values(indexValues)
      .onConflictDoNothing({ target: [protectiveIndex.equipmentId, protectiveIndex.damageType] })
      .run()
  : { changes: 0 };

// ---- 6. Report ----
console.log(`[seed:protective-equipment] Equipment    : ${String(equipmentInserted.changes)} inserted / ${String(equipmentData.length - equipmentInserted.changes)} skipped`);
console.log(`[seed:protective-equipment] Equipment PT : ${String(ptInserted.changes)} inserted / ${String(ptValues.length - ptInserted.changes)} skipped`);
console.log(`[seed:protective-equipment] Index entries: ${String(indexInserted.changes)} inserted / ${String(indexValues.length - indexInserted.changes)} skipped`);
