/**
 * Provenance level of a catalogue record (LLD §6.2). Level 4 deliberately does
 * not exist: the database CHECK constraint bars it, so it can never be read.
 */
export const SourceLevel = {
  /** Canonical: the Daemon System Basic Module itself. */
  Canonical: 1,
  /** Official: another officially published source. */
  Official: 2,
  /** Curated community material. */
  Community: 3,
} as const;

/** Union of the accepted provenance levels. */
export type SourceLevel = (typeof SourceLevel)[keyof typeof SourceLevel];
