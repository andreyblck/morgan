import { git } from './git.js';
import { loadVaultSettings } from './projectContext.js';
import type { Config } from './config.js';

export interface ProjectId {
  /** Normalized `host/owner/repo` — the identity recorded in `project.md`. Null when the slug
   *  came from the project-context override rather than a URL remote. */
  remote: string | null;
  /** Directory name under `projects/`: path segments joined by `--`. */
  slug: string;
}

/**
 * Turn a git remote URL into a project identity. The same repository reached over
 * https and ssh gives the same identity; a filesystem path gives none, because a
 * path names a machine, not a project.
 */
export function normalizeRemote(url: string): ProjectId | null {
  const raw = url.trim();
  if (raw === '') return null;

  let host: string;
  let path: string;

  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(raw);
  if (scheme) {
    if (scheme[1]!.toLowerCase() === 'file') return null;
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      return null;
    }
    host = u.hostname;
    path = u.pathname;
  } else {
    // scp-like: [user@]host:owner/repo. A leading slash or dot is a path.
    const scp = /^(?:[^@/]+@)?([^:/]+):(.+)$/.exec(raw);
    if (!scp || raw.startsWith('/') || raw.startsWith('.')) return null;
    host = scp[1]!;
    path = scp[2]!;
  }

  host = host.toLowerCase();
  const segments = path
    .toLowerCase()
    .replace(/\.git$/, '')
    .split('/')
    .filter((s) => s !== '' && s !== '.' && s !== '..')
    .map((s) => s.replace(/\.git$/, ''));
  if (host === '' || segments.length < 2) return null;

  const slug = segments.map((s) => s.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')).join('--');
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return { remote: `${host}/${segments.join('/')}`, slug };
}

// A git refname safe to pass as a positional argument. Rejects a leading '-' (so a branch
// named like `--upload-pack=...` can never become a git option), path traversal, and the
// characters git's own check-ref-format forbids. A hostile vault default branch is the vector.
const REF_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export class UnsafeRef extends Error {
  constructor(public readonly ref: string) {
    super(`unsafe git ref: ${JSON.stringify(ref)}`);
  }
}

export function assertRef(ref: string): string {
  if (!REF_RE.test(ref) || ref.includes('..') || ref.endsWith('.lock') || ref.endsWith('/')) throw new UnsafeRef(ref);
  return ref;
}

export function isHexSha(s: string): boolean {
  return /^[0-9a-f]{7,40}$/.test(s);
}

/** The owner segment of a normalized `host/owner/repo` remote (`acme-corp` from
 *  `github.com/acme-corp/acme-api`), or null when there isn't one. */
export function ownerOf(remote: string | null): string | null {
  if (!remote) return null;
  const parts = remote.split('/');
  return parts.length >= 3 ? (parts[1] ?? null) : null;
}

/** Owners whose projects this vault serves: the explicit `MORGAN_VAULT_OWNERS` list, or — when
 *  that's unset — the vault repo's own owner. `null` means no restriction, because the vault repo
 *  is a path with no derivable owner (the test fixtures, a local bare repo). */
export function allowedOwners(cfg: Config): string[] | null {
  if (cfg.owners) return cfg.owners;
  const own = ownerOf(cfg.repo ? (normalizeRemote(cfg.repo)?.remote ?? null) : null);
  return own ? [own] : null;
}

/** Whether a resolved project is one this vault serves. In scope when the vault has no derivable
 *  owner or the project has none (override-declared); the restriction bites only when both owners
 *  are known and the project's isn't allowed. */
export function ownerAllowed(cfg: Config, project: ProjectId): boolean {
  const owners = allowedOwners(cfg);
  if (owners === null) return true;
  const po = ownerOf(project.remote);
  if (po === null) return true;
  return owners.includes(po);
}

/** Why an out-of-scope project is treated as having no vault — shown in status and refusals. */
export function outOfScopeReason(cfg: Config, project: ProjectId): string {
  const owners = allowedOwners(cfg);
  return `this vault serves ${owners ? owners.join(', ') : 'any owner'}; project owner "${ownerOf(project.remote) ?? '(unknown)'}" is outside it — using .camp/ for this project`;
}

/**
 * The project this session is in, from the declared remote (not `remote get-url`, which applies
 * insteadOf). The one place every tool asks "which project".
 */
export async function resolveProject(projectDir: string): Promise<{ project: ProjectId | null; reason: string | null }> {
  const r = await git(['config', '--get', 'remote.origin.url'], projectDir);
  if (!r.ok) {
    return { project: null, reason: `no git remote "origin" in ${projectDir}; set vault.project in the project-context override` };
  }
  const project = normalizeRemote(r.stdout.trim());
  if (!project) {
    return {
      project: null,
      reason: `remote "origin" is a path, not a URL (${r.stdout.trim()}); set vault.project in the project-context override`,
    };
  }
  return { project, reason: null };
}

/**
 * The project slug every tool scopes to: the derived identity, or the project-context
 * override when the remote can't give one. Read and write resolve it the same way, so the
 * documented fix for `project_unknown` unblocks both.
 */
export async function resolveScopedProject(cfg: Config): Promise<{ project: ProjectId | null; reason: string | null }> {
  const { project, reason } = await resolveProject(cfg.projectDir);
  if (project) return { project, reason: null };
  const settings = await loadVaultSettings(cfg.projectDir);
  if (settings.project) return { project: { slug: settings.project, remote: null }, reason: null };
  return { project: null, reason };
}
