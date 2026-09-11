/**
 * Attribute that governs a skill roll (LLD §6.3). Keys are the English attribute
 * names; values are the canonical Portuguese codes used by the Daemon System, so
 * they stay exactly as the catalogue stores them.
 */
export const BaseAttribute = {
  /** Agilidade. */
  Agility: 'AGI',
  /** Carisma. */
  Charisma: 'CAR',
  /** Constituição. */
  Constitution: 'CON',
  /** Destreza. */
  Dexterity: 'DEX',
  /** Força. */
  Strength: 'FR',
  /** Inteligência. */
  Intelligence: 'INT',
  /** Percepção. */
  Perception: 'PER',
  /** Vontade (Willpower). */
  Willpower: 'WILL',
} as const;

/** Union of the canonical base attribute codes. */
export type BaseAttribute = (typeof BaseAttribute)[keyof typeof BaseAttribute];

/** Every accepted base attribute code, for schema and documentation use. */
export const BASE_ATTRIBUTE_VALUES = Object.values(BaseAttribute);

/**
 * How a skill's initial percentage is determined (LLD §6.3).
 *
 * `'related'` is documented by the schema but unreachable in the Level 1
 * catalogue; its definitive status is LLD §15 open item 10.
 */
export const InitialValueType = {
  /** Instintiva: starts from the governing attribute. */
  Instinctive: 'instinctive',
  /** Técnica: highly technical, starts at 0%. */
  Technical: 'technical',
  /** Derived from a related skill. */
  Related: 'related',
} as const;

/** Union of the accepted initial value classifications. */
export type InitialValueType = (typeof InitialValueType)[keyof typeof InitialValueType];
