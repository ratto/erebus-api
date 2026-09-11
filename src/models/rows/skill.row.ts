/**
 * Raw `skills` row as Knex returns it: snake_case, and SQLite's `0 | 1` in place
 * of a boolean. A row MUST NOT escape `src/repositories/**` (LLD §4.2).
 */
export interface SkillRow {
  id: number;
  name: string;
  parent_skill_id: number | null;
  has_subgroups: 0 | 1;
  base_attribute: string | null;
  initial_value_type: string | null;
  category: string | null;
  description: string | null;
  prerequisite: string | null;
  damage: string | null;
  notes: string | null;
  source_level: number;
  source: string;
  edition_or_version: string | null;
}

/**
 * Projection of the repository's self-join onto the parent skill, adding the two
 * parent columns the detail and the inherited-attribute rule need
 * (CONTRACT.md §3.2). Repository-only, exactly like {@link SkillRow}.
 */
export interface SkillJoinedRow extends SkillRow {
  parent_name: string | null;
  parent_base_attribute: string | null;
}
