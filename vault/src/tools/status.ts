import { access, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { cloneDir, type Config } from '../config.js';
import { git } from '../git.js';
import { withLock } from '../lock.js';
import { normalizeRemote, type ProjectId } from '../project.js';

export type StatusResult =
  | { configured: false; reason: string; project_dir: string }
  | {
      configured: true;
      ready: boolean;
      reason: string | null;
      repo: string;
      clone: string;
      project: ProjectId | null;
      project_reason: string | null;
      project_dir: string;
      unpushed: number;
      stale_since: string | null;
    };

const exists = (p: string) => access(p).then(() => true, () => false);

/** Clone on first use. Returns the error text when the clone can't be made. */
export async function ensureClone(cfg: Config & { repo: string }): Promise<{ clone: string; error: string | null }> {
  const clone = cloneDir(cfg);
  if (await exists(join(clone, '.git'))) return { clone, error: null };
  await mkdir(dirname(clone), { recursive: true });
  // The lock lives inside the clone, so the parent directory is the lock scope here.
  const res = await withLock(dirname(clone), async () => {
    if (await exists(join(clone, '.git'))) return null;
    const r = await git(['clone', '--quiet', '--', cfg.repo, clone], dirname(clone));
    return r.ok ? null : `clone failed: ${r.stderr.trim() || `git exited ${r.code}`}`;
  });
  return { clone, error: res };
}

export async function resolveProject(projectDir: string): Promise<{ project: ProjectId | null; reason: string | null }> {
  const r = await git(['remote', 'get-url', 'origin'], projectDir);
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

async function unpushedCount(clone: string): Promise<number> {
  const head = await git(['rev-parse', '--verify', '--quiet', 'HEAD'], clone);
  if (!head.ok) return 0;
  const r = await git(['rev-list', '--count', 'HEAD', '--not', '--remotes=origin'], clone);
  return r.ok ? Number.parseInt(r.stdout.trim(), 10) || 0 : 0;
}

export async function status(cfg: Config): Promise<StatusResult> {
  if (cfg.repo === null) {
    return { configured: false, reason: 'MORGAN_VAULT_REPO is empty', project_dir: cfg.projectDir };
  }
  const repoCfg = { ...cfg, repo: cfg.repo };
  const { clone, error } = await ensureClone(repoCfg);
  const { project, reason } = await resolveProject(cfg.projectDir);
  return {
    configured: true,
    ready: error === null,
    reason: error,
    repo: cfg.repo,
    clone,
    project,
    project_reason: reason,
    project_dir: cfg.projectDir,
    unpushed: error === null ? await unpushedCount(clone) : 0,
    stale_since: null,
  };
}
