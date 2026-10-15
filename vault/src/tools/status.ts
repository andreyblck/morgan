import { cloneDir, type Config } from '../config.js';
import { git } from '../git.js';
import { normalizeRemote, type ProjectId } from '../project.js';
import { Repo } from '../repo.js';

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
      unpushed_foreign: number;
      stale_since: string | null;
    };

export async function resolveProject(projectDir: string): Promise<{ project: ProjectId | null; reason: string | null }> {
  // The configured URL, not `remote get-url`, which applies insteadOf rewrites. A developer's
  // local url.<x>.insteadOf is a fetch convenience; the declared remote is the stable identity,
  // and two developers who disagree on rewrites must still resolve to one project.
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

export async function status(cfg: Config, repo?: Repo): Promise<StatusResult> {
  if (cfg.repo === null) {
    return { configured: false, reason: 'MORGAN_VAULT_REPO is empty', project_dir: cfg.projectDir };
  }
  const r = repo ?? new Repo(cloneDir({ ...cfg, repo: cfg.repo }), cfg.repo);
  const error = await r.ensure();
  const { project, reason } = await resolveProject(cfg.projectDir);
  let unpushed = 0;
  let foreign = 0;
  if (error === null) {
    // Status is where a crashed or offline earlier session gets put right.
    const rec = await r.reconcile();
    const pending = await r.unpushed();
    unpushed = pending.length;
    foreign = rec.foreign;
  }
  return {
    configured: true,
    ready: error === null,
    reason: error,
    repo: cfg.repo,
    clone: r.clone,
    project,
    project_reason: reason,
    project_dir: cfg.projectDir,
    unpushed,
    unpushed_foreign: foreign,
    stale_since: null,
  };
}
