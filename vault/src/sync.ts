import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { collectNotes, Index } from './index.js';
import type { Repo } from './repo.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

/**
 * Keeps the clone fresh for reads and the index in step with the clone. A pull that
 * fails (offline, remote gone) is not an error: reads go on from the clone, marked
 * with the time of the last sync that did succeed.
 */
export class Sync {
  private lastPull = 0;
  private lastGoodSync: string | null = null;
  private indexedAt: string | null = null;
  readonly index = new Index();

  constructor(
    private readonly repo: Repo,
    private readonly ttlMs: number = Number.parseInt(process.env.MORGAN_VAULT_PULL_TTL_MS ?? '', 10) >= 0
      ? Number.parseInt(process.env.MORGAN_VAULT_PULL_TTL_MS ?? '', 10)
      : DEFAULT_TTL_MS,
  ) {}

  /** ISO time the clone was last known to match the remote, or null while it is current. */
  get staleSince(): string | null {
    return this.stale ? this.lastGoodSync : null;
  }

  private stale = false;

  /** Pull if the TTL has passed, then rebuild the index if anything changed. */
  async refresh(): Promise<void> {
    await this.index.open();
    const now = Date.now();
    if (now - this.lastPull >= this.ttlMs) {
      this.lastPull = now;
      // A hostile remote branch name throws rather than reaching git; a read then serves the
      // clone as-is and marks it stale instead of failing.
      const ok = await (async () => {
        try {
          const branch = await this.repo.branch();
          return (await this.repo.remoteHasBranch(branch)) ? await this.repo.pullFfOnly(branch) : await this.repo.remoteReachable();
        } catch {
          return false;
        }
      })();
      if (ok) {
        this.lastGoodSync = new Date(now).toISOString();
        this.stale = false;
      } else {
        this.stale = true;
        if (!this.lastGoodSync) this.lastGoodSync = await this.cloneTouchedAt();
      }
    }
    const head = await this.repo.headSha();
    const key = `${head}:${await this.repo.treeFingerprint()}`;
    if (key !== this.indexedAt) {
      this.index.rebuild(await collectNotes(this.repo.clone));
      this.indexedAt = key;
    }
  }

  /** Force the index to be rebuilt on the next refresh (after our own write, for instance). */
  invalidate(): void {
    this.indexedAt = null;
  }

  private async cloneTouchedAt(): Promise<string> {
    for (const f of ['FETCH_HEAD', 'HEAD']) {
      try {
        return (await stat(join(this.repo.clone, '.git', f))).mtime.toISOString();
      } catch {
        // try the next one
      }
    }
    return new Date(0).toISOString();
  }
}
