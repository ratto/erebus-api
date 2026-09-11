import type { SourceLevel } from '../enums/source-level.enum';

/**
 * Provenance every catalogue entity carries (LLD §6.2). No endpoint may return a
 * rule record without it, so the fields live in one shared shape that each entity
 * extends rather than being restated per entity.
 */
export interface Provenance {
  /** 1 canonical, 2 official, 3 curated community. */
  sourceLevel: SourceLevel;
  /** Citation: file and field, manual section, netbook or URL. */
  source: string;
  /** Edition the citation refers to, when the source declares one. */
  editionOrVersion: string | null;
}
