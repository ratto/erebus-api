import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const enhancements = sqliteTable('enhancements', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  nome:      text('nome').notNull(),
  descricao: text('descricao').notNull(),
  tipo:      text('tipo').notNull(),
  custo:     integer('custo').notNull(),
});

export const skills = sqliteTable('skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  grupo: text('grupo'),
  atributoBase: text('atributo_base'),
  apenasComTreinamento: integer('apenas_com_treinamento', { mode: 'boolean' }).notNull().default(false),
  sinergia: text('sinergia'),
  descricao: text('descricao').notNull(),
});

export const protectiveEquipment = sqliteTable('protective_equipment', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  name:         text('name').notNull().unique(),
  cost:         text('cost'),
  availability: text('availability'),
  weightKg:     real('weight_kg'),
  dexPenalty:   integer('dex_penalty').notNull().default(0),
  agiPenalty:   integer('agi_penalty').notNull().default(0),
  description:  text('description').notNull(),
  source:       text('source').notNull(),
});

export const protectiveEquipmentPt = sqliteTable('protective_equipment_pt', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  equipmentId: integer('equipment_id').notNull().unique()
                 .references(() => protectiveEquipment.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  description: text('description').notNull(),
  source:      text('source').notNull(),
});

export const protectiveIndex = sqliteTable(
  'protective_index',
  {
    id:          integer('id').primaryKey({ autoIncrement: true }),
    equipmentId: integer('equipment_id').notNull()
                   .references(() => protectiveEquipment.id, { onDelete: 'cascade' }),
    damageType:  text('damage_type').notNull(),
    ipValue:     integer('ip_value').notNull(),
  },
  (t) => ({
    uniqPerType: uniqueIndex('idx_protective_index_unique').on(t.equipmentId, t.damageType),
  }),
);

export const combatSkills = sqliteTable('combat_skills', {
  id:                     integer('id').primaryKey({ autoIncrement: true }),
  nome:                   text('nome').notNull(),
  tipo:                   text('tipo').notNull(),          // 'melee' | 'ranged' | 'shield'
  atributoAtaque:         text('atributo_ataque'),         // null para shield
  atributoDefesa:         text('atributo_defesa'),         // null para ranged
  aprimoramentoRequerido: text('aprimoramento_requerido'), // ex: 'Armas de Fogo' | null
  descricao:              text('descricao').notNull(),
});


export const weapons = sqliteTable('weapons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  categoria: text('categoria').notNull(),
  dano: text('dano').notNull(),
  iniciativa: text('iniciativa').notNull(),
  fonte: text('fonte').notNull(),
  tipo: text('tipo').notNull(),
  tipoDano: text('tipo_dano'),
  ocultabilidade: text('ocultabilidade'),
  alcanceMedio: text('alcance_medio'),
  alcanceMax: text('alcance_max'),
  calibre: text('calibre'),
  alcanceEfetivo: text('alcance_efetivo'),
  rof: text('rof'),
  pente: text('pente'),
});
