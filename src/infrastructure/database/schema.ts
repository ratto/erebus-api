import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const skills = sqliteTable('skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  grupo: text('grupo'),
  atributoBase: text('atributo_base'),
  apenasComTreinamento: integer('apenas_com_treinamento', { mode: 'boolean' }).notNull().default(false),
  sinergia: text('sinergia'),
  descricao: text('descricao').notNull(),
});
