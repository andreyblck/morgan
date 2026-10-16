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
  /** Owners whose projects this vault serves (MORGAN_VAULT_OWNERS, comma-separated). `null` means
   *  default to the vault repo's own owner; a project owned by anyone else behaves as no vault. */
  owners: string[] | null;
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
    owners: (() => {
      const list = clean(env.MORGAN_VAULT_OWNERS)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      return list.length ? list : null;
    })(),
  };
}

const repoKey = (repo: string): string => createHash('sha256').update(repo).digest('hex').slice(0, 12);

/** One clone per vault repo, keyed by the repo string so two vaults never share a directory. */
export function cloneDir(cfg: Config & { repo: string }): string {
  return join(cfg.dataDir, 'vault', repoKey(cfg.repo));
}

/** Beside the clone, never inside it: git refuses to clone into a directory that already has a file. */
export function logFile(cfg: Config & { repo: string }): string {
  return join(cfg.dataDir, 'vault', `${repoKey(cfg.repo)}.log`);
}
