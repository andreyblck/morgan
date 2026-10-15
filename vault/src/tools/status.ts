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
      stale_since: string | null;
    };

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

export async function status(cfg: Config): Promise<StatusResult> {
  if (cfg.repo === null) {
    return { configured: false, reason: 'MORGAN_VAULT_REPO is empty', project_dir: cfg.projectDir };
  }
  const repo = new Repo(cloneDir({ ...cfg, repo: cfg.repo }), cfg.repo);
  const error = await repo.ensure();
  const { project, reason } = await resolveProject(cfg.projectDir);
  return {
    configured: true,
    ready: error === null,
    reason: error,
    repo: cfg.repo,
    clone: repo.clone,
    project,
    project_reason: reason,
    project_dir: cfg.projectDir,
    unpushed: error === null ? (await repo.unpushed()).length : 0,
    stale_since: null,
  };
}
