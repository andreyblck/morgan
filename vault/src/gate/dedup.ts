import { jaccard, tokens, type StoredNote } from '../findings.js';
import type { Refusal } from './limits.js';

/** Two findings whose symptom+cause share this much vocabulary are one finding written twice. */
export const DUPLICATE_THRESHOLD = 0.6;

export function findDuplicate(
  candidate: { symptom: string; cause: string },
  existing: StoredNote[],
  skipUlid: string | null,
): (Refusal & { existing: string }) | null {
  const mine = tokens(`${candidate.symptom} ${candidate.cause}`);
  for (const note of existing) {
    if (note.frontmatter.status !== 'active' || note.ulid === skipUlid) continue;
    const theirs = tokens(`${String(note.frontmatter.symptom ?? '')} ${String(note.frontmatter.cause ?? '')}`);
    const score = jaccard(mine, theirs);
    if (score >= DUPLICATE_THRESHOLD) {
      return {
        code: 'duplicate',
        detail: `${Math.round(score * 100)}% of the words match an active finding; read it and supersede it, or extend it, rather than writing it again`,
        existing: note.path,
      };
    }
  }
  return null;
}
