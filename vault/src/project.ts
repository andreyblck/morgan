export interface ProjectId {
  /** Normalized `host/owner/repo` — the identity recorded in `project.md`. */
  remote: string;
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
