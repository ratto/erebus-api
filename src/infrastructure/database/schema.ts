import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
