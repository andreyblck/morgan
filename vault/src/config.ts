import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface Config {
  /** Git URL or path of the team vault. `null` means the plugin was installed without one. */
  repo: string | null;
  /** Where clones, the index and the log live. Survives plugin updates. */
  dataDir: string;
  /** The project this session runs in — decides which `projects/<slug>/` is in scope. */
  projectDir: string;
}

const clean = (v: string | undefined): string => (v ?? '').trim();

export function loadConfig(env: NodeJS.ProcessEnv = process.env, cwd: string = process.cwd()): Config {
  return {
    repo: clean(env.MORGAN_VAULT_REPO) || null,
    dataDir:
      clean(env.MORGAN_VAULT_DATA) ||
      clean(env.CLAUDE_PLUGIN_DATA) ||
      join(homedir(), '.claude', 'plugins', 'data', 'morgan-vault'),
    projectDir: clean(env.CLAUDE_PROJECT_DIR) || cwd,
  };
}

/** One clone per vault repo, keyed by the repo string so two vaults never share a directory. */
export function cloneDir(cfg: Config & { repo: string }): string {
  const key = createHash('sha256').update(cfg.repo).digest('hex').slice(0, 12);
  return join(cfg.dataDir, 'vault', key);
}
