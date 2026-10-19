import { z } from 'zod';
import { cloneDir, type Config } from '../config.js';
import { git } from '../git.js';
import { envelopeBody, marker, PathRefused, readNoteFile, resolveNotePath } from '../notes.js';
import { isHexSha, ownerAllowed, outOfScopeReason, resolveScopedProject } from '../project.js';
import { loadVaultSettings } from '../projectContext.js';
import { Repo } from '../repo.js';
import { argvElement } from '../schema/finding.js';
import { ULID_RE } from '../ulid.js';

export const readInput = { path: z.string().min(1).max(500) };

/**
 * `against` names the line the note was judged against and its commit, e.g. `origin/main@1a2b3c4`.
 * `by` says how: `history` counts commits after the note's own commit, exact; `time` counts commits
 * on the line since the note was written, for a note whose commit never reached it as-is.
 */
export type Stale =
  | { changed: boolean; commits: number; against: string; by: 'history' | 'time' }
  | { unknown: true; against: string | null; reason: string };

/** A server-written `created`: ISO 8601 UTC. Checked before it becomes a git argument. */
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

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

const ORIGIN_REF = /^refs\/remotes\/origin\/[A-Za-z0-9._/-]+$/;

/**
 * The line a note's freshness is judged against: the team's main line as this checkout last
 * fetched it (origin/HEAD, else origin/main, else origin/master), and only when there is none,
 * this checkout's HEAD. A developer on an old feature branch still gets an answer about main.
 * Resolved to a commit id here, so a ref name never reaches git as an argument afterwards.
 */
async function freshnessBase(projectDir: string): Promise<{ label: string; sha: string } | null> {
  const refs: string[] = [];
  const sym = await git(['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'], projectDir);
  if (sym.ok && ORIGIN_REF.test(sym.stdout.trim())) refs.push(sym.stdout.trim());
  refs.push('refs/remotes/origin/main', 'refs/remotes/origin/master');
  for (const ref of refs) {
    const r = await git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], projectDir);
    if (r.ok && isHexSha(r.stdout.trim())) return { label: ref.slice('refs/remotes/'.length), sha: r.stdout.trim() };
  }
  const head = await git(['rev-parse', '--verify', '--quiet', 'HEAD^{commit}'], projectDir);
  return head.ok && isHexSha(head.stdout.trim()) ? { label: 'HEAD', sha: head.stdout.trim() } : null;
}

/**
 * Has the code a note points at moved since the note was written? Counted in the project checkout
 * over the files the note names, against the team's main line. Exact when the note's commit is on
 * that line. Otherwise — and on a real team that is the usual case: notes are written on feature
 * branches and detached worktrees whose commits reach main squashed or rebased, never as-is — by
 * date: the line's commits touching those files since the note was written. When neither can be
 * answered, the reason says what to do about it.
 */
export async function staleness(projectDir: string, sha: string | null, files: string[] | null, created: string | null = null): Promise<Stale | null> {
  if (!files || files.length === 0) return null;
  const base = await freshnessBase(projectDir);
  if (!base) return { unknown: true, against: null, reason: 'this checkout has no commits to compare against' };
  const against = `${base.label}@${base.sha.slice(0, 7)}`;
  const count = async (range: string[]): Promise<number | null> => {
    const log = await git(['log', '--format=%H', ...range, '--', ...files], projectDir);
    return log.ok ? log.stdout.split('\n').filter(Boolean).length : null;
  };
  // The sha comes from a note's frontmatter — attacker-controllable. Never let it reach git as
  // anything but a hex object name.
  const local = sha !== null && isHexSha(sha) && (await git(['cat-file', '-e', `${sha}^{commit}`], projectDir)).ok;
  if (local && (await git(['merge-base', '--is-ancestor', sha, base.sha], projectDir)).ok) {
    const commits = await count([`${sha}..${base.sha}`]);
    if (commits !== null) return { changed: commits > 0, commits, against, by: 'history' };
  }
  if (created && ISO_UTC.test(created)) {
    const since = created.replace(/\.\d+Z$/, 'Z');
    // A main line last fetched before the note was written can't see anything after it: "unchanged"
    // there would be false comfort. Compared at whole seconds, the precision commit dates have.
    const tip = await git(['log', '-1', '--format=%cI', base.sha], projectDir);
    if (tip.ok && Date.parse(tip.stdout.trim()) < Date.parse(since)) {
      return { unknown: true, against, reason: `${against} is from ${tip.stdout.trim().slice(0, 10)}, before the note was written (${since.slice(0, 10)}) — git fetch, then read it again` };
    }
    const commits = await count([`--since=${since}`, base.sha]);
    if (commits !== null) return { changed: commits > 0, commits, against, by: 'time' };
  }
  const short = sha && isHexSha(sha) ? sha.slice(0, 7) : null;
  if (short && !local) return { unknown: true, against, reason: `the note's commit ${short} isn't in this checkout and the note has no creation date — git fetch, then read it again` };
  return { unknown: true, against, reason: `the note's commit isn't in ${base.label} and the note has no creation date to judge it by` };
}

export async function readNote(cfg: Config, path: string): Promise<ReadResult> {
  if (cfg.repo === null) return { ok: false, code: 'not_configured', detail: 'MORGAN_VAULT_REPO is empty' };

  // A project outside this vault's owners behaves as no vault — gate before cloning.
  const { project } = await resolveScopedProject(cfg);
  if (project && !ownerAllowed(cfg, project)) return { ok: false, code: 'not_configured', detail: outOfScopeReason(cfg, project) };

  const repo = new Repo(cloneDir({ ...cfg, repo: cfg.repo }), cfg.repo);
  const cloneError = await repo.ensure();
  if (cloneError) return { ok: false, code: 'not_ready', detail: cloneError };

  // Scope read to the current project unless the project allows crossing, so a guessed path in
  // another project is no more readable than search would make it.
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
    stale: type === 'finding' ? await staleness(cfg.projectDir, str(note.frontmatter.sha), strList(note.frontmatter.files), str(note.frontmatter.created)) : null,
    verify,
    verify_policy: verify ? 'show_to_user_never_autorun' : null,
    ...(verifyRejected ? { verify_rejected: true as const } : {}),
    markers: { begin: marker.begin(ulid ?? 'unknown'), end: marker.end },
    markers_escaped: env.escaped,
  };
}
