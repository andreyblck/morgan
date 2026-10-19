import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { listNotes, type StoredNote } from './findings.js';
import { KINDS } from './schema/index.js';

export interface IndexedNote {
  path: string;
  type: string;
  project: string;
  status: string;
  author: string;
  created: string;
  sha: string;
  title: string;
  cause: string;
  files: string[];
  body: string;
}

export interface Hit {
  path: string;
  type: string;
  project: string;
  status: string;
  author: string | null;
  created: string | null;
  sha: string | null;
  title: string;
  files: string[];
  score: number;
  /** Search only: how many of the query's words and "phrases" this note holds, out of `terms`. */
  matched?: number;
  terms?: number;
}

/**
 * Per-column bm25 weights, in table order: the eight UNINDEXED columns, then title (a finding's
 * symptom or a trail's goal), cause, files, body. Measured on a real vault of ~1,800 notes: finding
 * a note from words of its symptom went from 70% to 93% top-1, and from words of its cause from
 * 80% to 85%, against unweighted bm25.
 */
const BM25 = 'bm25(notes, 0, 0, 0, 0, 0, 0, 0, 0, 10.0, 3.0, 4.0, 1.0)';
/** How many bm25 candidates the coverage pass re-ranks before the limit is applied. */
const CANDIDATES = 200;

const words = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);

/**
 * A query's units: "quoted phrases" (those words, adjacent, in that order) and loose words. A
 * quoted single word is just a word. Units are deduplicated; words under two characters dropped.
 */
export function parseQuery(text: string): { phrases: string[]; words: string[] } {
  const phrases: string[] = [];
  const rest = text.replace(/"([^"]*)"/g, (_, inner: string) => {
    const w = words(inner);
    if (w.length > 1) phrases.push(w.join(' '));
    return w.length === 1 ? ` ${w[0]} ` : ' ';
  });
  return { phrases: [...new Set(phrases)], words: [...new Set(words(rest))] };
}

export interface Query {
  text: string;
  project: string | null;
  type?: string | undefined;
  status?: string | undefined;
  limit: number;
}

type Db = {
  exec(sql: string): void;
  prepare(sql: string): { run(...args: unknown[]): unknown; all(...args: unknown[]): unknown[] };
  close(): void;
};

/**
 * Full-text index over the notes, rebuilt from the files whenever the clone changes.
 * In memory on purpose: nothing on disk can go stale, and a few thousand notes rebuild
 * in milliseconds. Needs node:sqlite (Node ≥ 22.5); without it, search says so.
 */
export class Index {
  private db: Db | null = null;
  private unavailable: string | null = null;

  async open(): Promise<void> {
    if (this.db || this.unavailable) return;
    try {
      const sqlite = (await import('node:sqlite')) as { DatabaseSync: new (p: string) => Db };
      this.db = new sqlite.DatabaseSync(':memory:');
      this.db.exec(
        `CREATE VIRTUAL TABLE notes USING fts5(
           path UNINDEXED, type UNINDEXED, project UNINDEXED, status UNINDEXED,
           author UNINDEXED, created UNINDEXED, sha UNINDEXED, files_json UNINDEXED,
           title, cause, files, body, tokenize='unicode61')`,
      );
    } catch (e) {
      this.unavailable = `node:sqlite is not available (${(e as Error).message}); search needs Node >= 22.5`;
    }
  }

  get error(): string | null {
    return this.unavailable;
  }

  rebuild(notes: IndexedNote[]): void {
    if (!this.db) return;
    this.db.exec('DELETE FROM notes');
    const ins = this.db.prepare(
      'INSERT INTO notes (path, type, project, status, author, created, sha, files_json, title, cause, files, body) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    );
    for (const n of notes) {
      ins.run(n.path, n.type, n.project, n.status, n.author, n.created, n.sha, JSON.stringify(n.files), n.title, n.cause, n.files.join(' '), n.body);
    }
  }

  /**
   * The FTS units of a query: a quoted phrase with its last word as a prefix ("cart total" finds
   * "cart totals"), loose words exact. Measured on a real vault: a prefix on every word cost three
   * points of top-1 precision; on the phrase's last word, none.
   */
  static units(text: string): string[] {
    const { phrases, words: loose } = parseQuery(text);
    return [...phrases.map((p) => `"${p}"*`), ...loose.map((w) => `"${w}"`)];
  }

  /** Every unit of the query joined by OR: partial matches rank below full ones instead of vanishing. */
  static matchExpr(text: string): string | null {
    const units = Index.units(text);
    return units.length ? units.join(' OR ') : null;
  }

  /**
   * bm25 over weighted columns picks the candidates; then a note holding more of the query's units
   * ranks above one holding fewer, so a note that repeats one word can't bury one that has them all.
   * Which units a note holds is asked of FTS itself, so it agrees with how the search matched.
   */
  query(q: Query): Hit[] {
    const db = this.db;
    if (!db) return [];
    const units = Index.units(q.text);
    if (units.length === 0) return [];
    const where = ['notes MATCH ?'];
    const args: unknown[] = [units.join(' OR ')];
    if (q.project !== null) {
      where.push('project = ?');
      args.push(q.project);
    }
    if (q.type) {
      where.push('type = ?');
      args.push(q.type);
    }
    if (q.status) {
      where.push('status = ?');
      args.push(q.status);
    } else {
      where.push("status != 'superseded'");
    }
    args.push(Math.max(CANDIDATES, q.limit * 4));
    const rows = db
      .prepare(`SELECT path, type, project, status, author, created, sha, files_json, title, ${BM25} AS score FROM notes WHERE ${where.join(' AND ')} ORDER BY score LIMIT ?`)
      .all(...args) as Array<Record<string, unknown>>;
    const holders = units.map((u) => new Set((db.prepare('SELECT path FROM notes WHERE notes MATCH ?').all(u) as Array<{ path: string }>).map((r) => r.path)));
    const ranked = rows.map((r) => ({ r, matched: holders.filter((h) => h.has(String(r.path))).length }));
    ranked.sort(
      (a, b) => b.matched - a.matched || Number(a.r.score) - Number(b.r.score) || String(b.r.created).localeCompare(String(a.r.created)),
    );
    return ranked.slice(0, q.limit).map(({ r, matched }) => ({ ...toHit(r), matched, terms: units.length }));
  }

  recent(opts: { since: string; project: string | null; type?: string | undefined; status?: string | undefined; limit: number }): Hit[] {
    if (!this.db) return [];
    const where = ['created >= ?'];
    const args: unknown[] = [opts.since];
    if (opts.status) {
      where.push('status = ?');
      args.push(opts.status);
    } else {
      where.push("status != 'superseded'");
    }
    if (opts.project !== null) {
      where.push('project = ?');
      args.push(opts.project);
    }
    if (opts.type) {
      where.push('type = ?');
      args.push(opts.type);
    }
    args.push(opts.limit);
    const rows = this.db
      .prepare(`SELECT path, type, project, status, author, created, sha, files_json, title, 0 AS score FROM notes WHERE ${where.join(' AND ')} ORDER BY created DESC LIMIT ?`)
      .all(...args) as Array<Record<string, unknown>>;
    return rows.map(toHit);
  }
}

function toHit(r: Record<string, unknown>): Hit {
  return {
    path: String(r.path),
    type: String(r.type),
    project: String(r.project),
    status: String(r.status),
    author: r.author ? String(r.author) : null,
    created: r.created ? String(r.created) : null,
    sha: r.sha ? String(r.sha) : null,
    title: String(r.title),
    files: JSON.parse(String(r.files_json ?? '[]')) as string[],
    score: Number(r.score),
  };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export function toIndexed(n: StoredNote): IndexedNote {
  const fm = n.frontmatter;
  const type = str(fm.type);
  return {
    path: n.path,
    type,
    project: str(fm.project),
    status: str(fm.status) || (type === 'trail' ? 'open' : 'active'),
    author: str(fm.author),
    created: str(fm.created),
    sha: str(fm.sha),
    title: type === 'trail' ? str(fm.goal) : str(fm.symptom),
    cause: str(fm.cause),
    files: Array.isArray(fm.files) ? fm.files.map(String) : [],
    body: n.body,
  };
}

/** All notes of all projects in the clone, for the index. */
export async function collectNotes(clone: string): Promise<IndexedNote[]> {
  let slugs: string[];
  try {
    slugs = await readdir(join(clone, 'projects'));
  } catch {
    return [];
  }
  // Every type's directory, derived from KINDS, so a new note type is indexed without touching this.
  const dirs = [...new Set(Object.values(KINDS).map((k) => k.dir))];
  const out: IndexedNote[] = [];
  for (const slug of slugs) {
    for (const dir of dirs) {
      for (const n of await listNotes(clone, slug, dir)) out.push(toIndexed(n));
    }
  }
  return out;
}
