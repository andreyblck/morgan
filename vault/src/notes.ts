import { lstat, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type Frontmatter = Record<string, unknown>;

export interface Note {
  frontmatter: Frontmatter;
  body: string;
}

const MAX_NOTE_BYTES = 64 * 1024;

export function serializeNote(frontmatter: Frontmatter, body: string): string {
  const fm = stringifyYaml(frontmatter, { lineWidth: 0 }).trimEnd();
  return `---\n${fm}\n---\n${body.replace(/\s+$/, '')}\n`;
}

/** Strict parse: a note that doesn't parse is reported invalid, never guessed at. */
export function parseNote(text: string): Note | { invalid: string } {
  if (Buffer.byteLength(text) > MAX_NOTE_BYTES) return { invalid: `note larger than ${MAX_NOTE_BYTES} bytes` };
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!m) return { invalid: 'no frontmatter block' };
  let fm: unknown;
  try {
    fm = parseYaml(m[1]!, { uniqueKeys: true, maxAliasCount: 0, schema: 'core' });
  } catch (e) {
    return { invalid: `frontmatter: ${(e as Error).message.split('\n')[0]}` };
  }
  if (typeof fm !== 'object' || fm === null || Array.isArray(fm)) return { invalid: 'frontmatter is not a mapping' };
  return { frontmatter: fm as Frontmatter, body: m[2]! };
}

export const marker = {
  begin: (ulid: string) => `<<<vault-note ${ulid}>>>`,
  end: '<<<end-vault-note>>>',
};

/**
 * Wrap a body so the reader can see where another session's text starts and stops,
 * and so that text can't forge the closing marker. A run of two or more `<` is broken
 * with backslashes between every `<` — idempotently, because once broken no run of two
 * remains, so re-escaping changes nothing and no `<<<` can survive however many `<` the
 * body stacks.
 */
export function envelopeBody(ulid: string, body: string): { body: string; escaped: boolean } {
  const escaped = /<{2,}/.test(body);
  const safe = body.replace(/<{2,}/g, (run) => run.split('').join('\\'));
  return { body: `${marker.begin(ulid)}\n${safe}\n${marker.end}`, escaped };
}

export class PathRefused extends Error {
  constructor(public readonly why: string) {
    super(why);
  }
}

/**
 * The only way a relative note path becomes an absolute one. Everything the server
 * reads or writes passes through here: inside `<clone>/projects/`, markdown, not a link.
 */
export async function resolveNotePath(clone: string, rel: string, opts: { mustExist: boolean }): Promise<string> {
  if (isAbsolute(rel) || rel.includes('\0')) throw new PathRefused('absolute path');
  if (!rel.endsWith('.md')) throw new PathRefused('not a markdown file');
  // Note paths are relative to the clone root (`projects/<slug>/…`), and must stay under projects/.
  const cloneReal = await realpath(clone);
  const root = join(cloneReal, 'projects');
  const abs = resolve(cloneReal, rel);
  if (!abs.startsWith(root + sep)) throw new PathRefused('outside projects/');
  const parentReal = await realpath(join(abs, '..')).catch(() => null);
  if (parentReal === null) {
    if (opts.mustExist) throw new PathRefused('no such directory');
    return abs;
  }
  if (!(parentReal + sep).startsWith(root + sep) && parentReal !== root) throw new PathRefused('directory resolves outside projects/');
  const st = await lstat(abs).catch(() => null);
  if (st === null) {
    if (opts.mustExist) throw new PathRefused('not found');
    return abs;
  }
  if (st.isSymbolicLink()) throw new PathRefused('symbolic link');
  if (!st.isFile()) throw new PathRefused('not a file');
  return abs;
}

export const MAX_NOTE_FILE_BYTES = MAX_NOTE_BYTES;

/**
 * Read a note only if it is a small regular file. The indexer walks every note in the
 * clone, so one oversized or symlinked file committed by anyone must not be pulled into
 * memory or followed off the tree. Returns null to mean "skip this file".
 */
export async function readNoteFile(abs: string): Promise<Note | { invalid: string } | null> {
  const st = await lstat(abs).catch(() => null);
  if (st === null || !st.isFile()) return null;
  if (st.size > MAX_NOTE_FILE_BYTES) return { invalid: `note larger than ${MAX_NOTE_FILE_BYTES} bytes` };
  return parseNote(await readFile(abs, 'utf8'));
}
