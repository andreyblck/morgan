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
 * and so that text can't forge the closing marker.
 */
export function envelopeBody(ulid: string, body: string): { body: string; escaped: boolean } {
  const escaped = body.includes('<<<');
  const safe = body.replace(/<<</g, '<\\<<');
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

export async function readNoteFile(abs: string): Promise<Note | { invalid: string }> {
  return parseNote(await readFile(abs, 'utf8'));
}
