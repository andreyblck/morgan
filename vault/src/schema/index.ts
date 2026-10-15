import type { ZodType } from 'zod';
import { findingFields } from './finding.js';
import { SERVER_FIELDS, TRAIL_SECTIONS, trailFields } from './trail.js';

export type NoteType = 'trail' | 'finding';
export const NOTE_TYPES = ['trail', 'finding'] as const;

export interface NoteKind {
  dir: 'trails' | 'findings';
  fields: ZodType;
  /** Fields the server owns for this type, on top of the common ones. */
  serverFields: readonly string[];
  /** Headings the body must carry, if any. */
  sections: readonly string[];
  /** Which field the file's slug is taken from. */
  slugFrom: string;
}

export const KINDS: Record<NoteType, NoteKind> = {
  trail: { dir: 'trails', fields: trailFields, serverFields: SERVER_FIELDS, sections: TRAIL_SECTIONS, slugFrom: 'goal' },
  finding: { dir: 'findings', fields: findingFields, serverFields: [...SERVER_FIELDS, 'status', 'superseded_by'], sections: [], slugFrom: 'symptom' },
};
