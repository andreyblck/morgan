import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readNoteFile, type Frontmatter } from './notes.js';
import { ULID_RE } from './ulid.js';

export interface StoredNote {
  /** Path relative to the clone root. */
  path: string;
  ulid: string;
  frontmatter: Frontmatter;
  body: string;
}

/** Every parseable note of one kind in one project. Notes that don't parse are skipped here. */
export async function listNotes(clone: string, projectSlug: string, dir: 'trails' | 'findings'): Promise<StoredNote[]> {
  const rel = `projects/${projectSlug}/${dir}`;
  let names: string[];
  try {
    names = await readdir(join(clone, rel));
  } catch {
    return [];
  }
  const out: StoredNote[] = [];
  for (const name of names.sort()) {
    if (!name.endsWith('.md')) continue;
    const ulid = name.slice(0, 26);
    if (!ULID_RE.test(ulid)) continue;
    const note = await readNoteFile(join(clone, rel, name));
    if ('invalid' in note) continue;
    out.push({ path: `${rel}/${name}`, ulid, frontmatter: note.frontmatter, body: note.body });
  }
  return out;
}

/** Word tokens, lower-cased, two characters or more. Order and punctuation don't count. */
export function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 2),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
