import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { collectNotes, Index } from './index.js';
import type { Repo } from './repo.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

/** Where answers come from, for status and search: the remote branch the clone follows, the
 *  commit that was indexed, when the last pull was tried and when one last succeeded. */
export interface SyncInfo {
  source: string | null;
  head: string | null;
  last_pull: string | null;
  last_good_sync: string | null;
  stale_since: string | null;
  notes_indexed: number;
}

/**
 * Keeps the clone fresh for reads and the index in step with the clone. A pull that
 * fails (offline, remote gone) is not an error: reads go on from the clone, marked
 * with the time of the last sync that did succeed.
 */
export class Sync {
  private lastPull = 0;
  private lastPullAt: string | null = null;
  private lastGoodSync: string | null = null;
  private indexedAt: string | null = null;
  private branchName: string | null = null;
  private indexedHead: string | null = null;
  private indexedCount = 0;
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

  get info(): SyncInfo {
    return {
      source: this.branchName ? `origin/${this.branchName}` : null,
      head: this.indexedHead ? this.indexedHead.slice(0, 12) : null,
      last_pull: this.lastPullAt,
      last_good_sync: this.lastGoodSync,
      stale_since: this.staleSince,
      notes_indexed: this.indexedCount,
    };
  }

  /**
   * Pull if the TTL has passed, then rebuild the index if anything changed. `force` pulls anyway
   * (status does, so it never shows a clone search has moved past) without starting the TTL
   * window: the first search after a status still pulls.
   */
  async refresh(opts: { force?: boolean } = {}): Promise<void> {
    await this.index.open();
    const now = Date.now();
    const due = now - this.lastPull >= this.ttlMs;
    if (due || opts.force) {
      if (!opts.force) this.lastPull = now;
      this.lastPullAt = new Date(now).toISOString();
      // A hostile remote branch name throws rather than reaching git; a read then serves the
      // clone as-is and marks it stale instead of failing.
      const ok = await (async () => {
        try {
          const branch = await this.repo.branch();
          this.branchName = branch;
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
      const notes = await collectNotes(this.repo.clone);
      this.index.rebuild(notes);
      this.indexedAt = key;
      this.indexedCount = notes.length;
      this.indexedHead = head;
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
