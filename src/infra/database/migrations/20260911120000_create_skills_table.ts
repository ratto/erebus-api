import type { Knex } from 'knex';

/**
 * Creates the `skills` table: the self-referencing group → subgroup hierarchy of
 * the Daemon System skills catalogue.
 *
 * The body below is a literal transcription of the DDL in LLD §6.3 (v1.2), which
 * stays the normative source for column names, types, nullability, indexes and
 * CHECK constraints (ADR-003 §1). A migration that diverges from it is a defect.
 * @param knex Writable Knex instance supplied by the migration runner.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('skills', (table) => {
    table.increments('id').primary();
    table.text('name').notNullable();
    table.integer('parent_skill_id').nullable().references('id').inTable('skills');
    table.boolean('has_subgroups').notNullable().defaultTo(false);
    table.text('base_attribute').nullable(); // 'AGI'|'CAR'|'CON'|'DEX'|'FR'|'INT'|'PER'|'WILL'
    table.text('initial_value_type').nullable(); // 'instinctive'|'technical'|'related'
    table.text('category').nullable(); // N3 classification; only meaningful for 'Condução'
    table.text('description').nullable(); // one-sentence canonical description
    table.text('prerequisite').nullable();
    table.text('damage').nullable(); // unarmed combat skills
    table.text('notes').nullable();
    table.integer('source_level').notNullable();
    table.text('source').notNullable();
    table.text('edition_or_version').nullable();

    table.unique(['parent_skill_id', 'name']); // names repeat ACROSS groups
    table.index(['parent_skill_id']);
    table.index(['name']);
    table.check('source_level IN (1,2,3)');
  });
}

/**
 * Drops the `skills` table.
 *
 * Rolling back is not a production operation here — the artefact is rebuilt, not
 * migrated in place (ADR-003 §5) — but `down` is written so the migration stays
 * self-describing and usable locally.
 * @param knex Writable Knex instance supplied by the migration runner.
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('skills');
}
