import { z } from 'zod';
import { cloneDir, type Config } from '../config.js';
import { git } from '../git.js';
import { envelopeBody, marker, PathRefused, readNoteFile, resolveNotePath } from '../notes.js';
import { isHexSha, resolveScopedProject } from '../project.js';
import { loadVaultSettings } from '../projectContext.js';
import { Repo } from '../repo.js';
import { argvElement } from '../schema/finding.js';
import { ULID_RE } from '../ulid.js';

export const readInput = { path: z.string().min(1).max(500) };

export type Stale = { changed: boolean; commits: number } | { unknown: true };

export type ReadResult =
  | {
      ok: true;
      path: string;
      ulid: string | null;
      type: string | null;
      frontmatter: Record<string, unknown>;
      body: string;
      provenance: { author: string | null; author_verified: false; sha: string | null; branch: string | null; created: string | null };
      read_confidence: 'Inferred';
      stale: Stale | null;
      verify: string[] | null;
      verify_policy: 'show_to_user_never_autorun' | null;
      verify_rejected?: true;
      markers: { begin: string; end: string };
      markers_escaped: boolean;
    }
  | { ok: false; code: 'not_configured' | 'not_ready' | 'path_refused' | 'not_found' | 'invalid' | 'project_unknown'; detail: string };

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const strList = (v: unknown): string[] | null => (Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null);

/**
 * Has the code a note points at moved since the note was written? Counted in the project
 * checkout, from the note's sha to HEAD, over the files it names. A sha that isn't an
 * ancestor of HEAD can't be compared, and says so rather than guessing.
 */
export async function staleness(projectDir: string, sha: string | null, files: string[] | null): Promise<Stale | null> {
  if (!sha || !files || files.length === 0) return null;
  // The sha comes from a note's frontmatter — attacker-controllable. Never let it reach git as
  // anything but a hex object name.
  if (!isHexSha(sha)) return { unknown: true };
  const ancestor = await git(['merge-base', '--is-ancestor', sha, 'HEAD'], projectDir);
  if (!ancestor.ok) return { unknown: true };
  const log = await git(['log', '--format=%H', `${sha}..HEAD`, '--', ...files], projectDir);
  if (!log.ok) return { unknown: true };
  const commits = log.stdout.split('\n').filter(Boolean).length;
  return { changed: commits > 0, commits };
}

export async function readNote(cfg: Config, path: string): Promise<ReadResult> {
  if (cfg.repo === null) return { ok: false, code: 'not_configured', detail: 'MORGAN_VAULT_REPO is empty' };
  const repo = new Repo(cloneDir({ ...cfg, repo: cfg.repo }), cfg.repo);
  const cloneError = await repo.ensure();
  if (cloneError) return { ok: false, code: 'not_ready', detail: cloneError };

  // Scope read to the current project unless the project allows crossing, so a guessed path in
  // another project is no more readable than search would make it.
  const { project } = await resolveScopedProject(cfg);
  const { cross_project } = await loadVaultSettings(cfg.projectDir);
  if (project && !cross_project && !path.startsWith(`projects/${project.slug}/`)) {
    return { ok: false, code: 'path_refused', detail: `outside the current project (${project.slug}); set cross_project to read another` };
  }

  let abs: string;
  try {
    abs = await resolveNotePath(repo.clone, path, { mustExist: true });
  } catch (e) {
    if (e instanceof PathRefused) {
      return e.why === 'not found' ? { ok: false, code: 'not_found', detail: path } : { ok: false, code: 'path_refused', detail: e.why };
    }
    throw e;
  }

  const note = await readNoteFile(abs);
  if (note === null) return { ok: false, code: 'invalid', detail: 'not a readable note file' };
  if ('invalid' in note) return { ok: false, code: 'invalid', detail: note.invalid };

  const base = path.slice(path.lastIndexOf('/') + 1);
  const id = base.slice(0, 26);
  const ulid = ULID_RE.test(id) ? id : null;
  const env = envelopeBody(ulid ?? 'unknown', note.body);
  const type = str(note.frontmatter.type);
  // The argv filter is a write-time guard; a note committed another way (direct commit, an older
  // server, a hand-edit) can carry a verify it never saw. Re-check here and withhold a
  // shell-bearing one rather than surfacing it as runnable argv.
  const rawVerify = type === 'finding' ? strList(note.frontmatter.verify) : null;
  const verifyRejected = rawVerify !== null && !rawVerify.every((e) => argvElement.safeParse(e).success);
  const verify = verifyRejected ? null : rawVerify;
  return {
    ok: true,
    path,
    ulid,
    type,
    frontmatter: note.frontmatter,
    body: env.body,
    provenance: {
      author: str(note.frontmatter.author),
      author_verified: false,
      sha: str(note.frontmatter.sha),
      branch: str(note.frontmatter.branch),
      created: str(note.frontmatter.created),
    },
    read_confidence: 'Inferred',
    stale: type === 'finding' ? await staleness(cfg.projectDir, str(note.frontmatter.sha), strList(note.frontmatter.files)) : null,
    verify,
    verify_policy: verify ? 'show_to_user_never_autorun' : null,
    ...(verifyRejected ? { verify_rejected: true as const } : {}),
    markers: { begin: marker.begin(ulid ?? 'unknown'), end: marker.end },
    markers_escaped: env.escaped,
  };
}
