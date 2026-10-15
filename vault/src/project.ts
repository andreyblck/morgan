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
