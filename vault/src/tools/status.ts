import { cloneDir, type Config } from '../config.js';
import { ownerAllowed, outOfScopeReason, type ProjectId, resolveProject, resolveScopedProject } from '../project.js';
import { Repo } from '../repo.js';

export { resolveProject, resolveScopedProject };

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
      dirty: boolean;
      unpushed: number;
      unpushed_foreign: number;
      stale_since: string | null;
    };

export async function status(cfg: Config, repo?: Repo): Promise<StatusResult> {
  if (cfg.repo === null) {
    return { configured: false, reason: 'MORGAN_VAULT_REPO is empty', project_dir: cfg.projectDir };
  }
  const { project, reason } = await resolveScopedProject(cfg);
  // A project outside this vault's owners behaves as no vault — don't even clone for it.
  if (project && !ownerAllowed(cfg, project)) {
    return { configured: false, reason: outOfScopeReason(cfg, project), project_dir: cfg.projectDir };
  }
  const r = repo ?? new Repo(cloneDir({ ...cfg, repo: cfg.repo }), cfg.repo);
  const error = await r.ensure();
  let dirty = false;
  let unpushed = 0;
  let foreign = 0;
  if (error === null) {
    // Status is where a crashed or offline earlier session gets put right.
    const rec = await r.reconcile();
    const pending = await r.unpushed();
    unpushed = pending.length;
    foreign = rec.foreign;
    dirty = await r.dirty();
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
    dirty,
    unpushed,
    unpushed_foreign: foreign,
    stale_since: null,
  };
}
