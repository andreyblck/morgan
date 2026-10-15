import { access, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { git } from './git.js';
import { withLock } from './lock.js';

const TRAILER = 'Vault-Server: morgan-vault';
const PUSH_ATTEMPTS = 3;

export type RepoError = { ok: false; code: 'clone_dirty' | 'clone_needs_reconcile' | 'pull_failed' | 'committed_not_pushed'; detail: string };

const exists = (p: string) => access(p).then(() => true, () => false);
const jitter = () => new Promise((r) => setTimeout(r, 500 + Math.random() * 1500));

/** The server's view of its clone of the vault. Every git call goes through `git()`. */
export class Repo {
  constructor(
    public readonly clone: string,
    private readonly url: string,
  ) {}

  /** Clone on first use. Returns the error text when that can't be done. */
  async ensure(): Promise<string | null> {
    if (await exists(join(this.clone, '.git'))) return null;
    await mkdir(dirname(this.clone), { recursive: true });
    return withLock(dirname(this.clone), async () => {
      if (await exists(join(this.clone, '.git'))) return null;
      const r = await git(['clone', '--quiet', '--', this.url, this.clone], dirname(this.clone));
      return r.ok ? null : `clone failed: ${r.stderr.trim() || `git exited ${r.code}`}`;
    });
  }

  async branch(): Promise<string> {
    const r = await git(['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'], this.clone);
    if (r.ok) return r.stdout.trim().replace(/^origin\//, '');
    const local = await git(['symbolic-ref', '--quiet', '--short', 'HEAD'], this.clone);
    return local.ok ? local.stdout.trim() : 'main';
  }

  async remoteHasBranch(branch: string): Promise<boolean> {
    const r = await git(['ls-remote', '--heads', 'origin', branch], this.clone);
    return r.ok && r.stdout.trim() !== '';
  }

  async hasHead(): Promise<boolean> {
    return (await git(['rev-parse', '--verify', '--quiet', 'HEAD'], this.clone)).ok;
  }

  async midRebase(): Promise<boolean> {
    return (await exists(join(this.clone, '.git', 'rebase-merge'))) || (await exists(join(this.clone, '.git', 'rebase-apply')));
  }

  async abortRebase(): Promise<void> {
    await git(['rebase', '--abort'], this.clone);
  }

  /** Tracked files changed and not committed. Untracked files (the lock, the log) don't count. */
  async dirty(): Promise<boolean> {
    const r = await git(['status', '--porcelain', '--untracked-files=no'], this.clone);
    return r.stdout.trim() !== '';
  }

  /** Local commits the remote doesn't have, with whether each one was made by this server. */
  async unpushed(): Promise<Array<{ sha: string; ours: boolean }>> {
    if (!(await this.hasHead())) return [];
    const r = await git(['log', '--format=%H%x00%B%x1e', 'HEAD', '--not', '--remotes=origin'], this.clone);
    if (!r.ok || r.stdout.trim() === '') return [];
    return r.stdout
      .split('\x1e')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((rec) => {
        const [sha, body] = rec.split('\x00');
        return { sha: sha ?? '', ours: (body ?? '').includes(TRAILER) };
      });
  }

  async pullRebase(branch: string): Promise<boolean> {
    if (!(await this.remoteHasBranch(branch))) return true;
    const r = await git(['pull', '--rebase', '--quiet', 'origin', branch], this.clone);
    if (!r.ok && (await this.midRebase())) await this.abortRebase();
    return r.ok;
  }

  async push(branch: string): Promise<boolean> {
    return (await git(['push', '--quiet', 'origin', `HEAD:refs/heads/${branch}`], this.clone)).ok;
  }

  /**
   * The write cycle. `write` puts files into the clone after it is up to date; `paths`
   * are the only files that get staged. A clone with hand-made changes or foreign commits
   * is refused rather than shipped, because the gate only ran on what the server wrote.
   */
  async commitAndPush(opts: {
    paths: string[];
    message: string;
    author: { name: string; email: string };
    write: () => Promise<void>;
  }): Promise<{ ok: true } | RepoError> {
    return withLock(this.clone, async () => {
      const branch = await this.branch();
      if (await this.midRebase()) await this.abortRebase();
      if (await this.dirty()) return { ok: false, code: 'clone_dirty', detail: 'tracked files changed in the clone by something other than the server' };

      const pending = await this.unpushed();
      const foreign = pending.filter((c) => !c.ours);
      if (foreign.length) {
        return { ok: false, code: 'clone_dirty', detail: `commits not made by the server: ${foreign.map((c) => c.sha.slice(0, 7)).join(', ')}` };
      }
      if (pending.length && !(await this.pushWithRetry(branch))) {
        return { ok: false, code: 'clone_needs_reconcile', detail: `${pending.length} earlier commit(s) could not be pushed` };
      }

      if (!(await this.pullRebase(branch))) return { ok: false, code: 'pull_failed', detail: 'could not bring the clone up to date' };

      await opts.write();
      const add = await git(['add', '--', ...opts.paths], this.clone);
      if (!add.ok) {
        await git(['checkout', '--', ...opts.paths], this.clone).catch(() => undefined);
        return { ok: false, code: 'pull_failed', detail: `git add: ${add.stderr.trim()}` };
      }
      const commit = await git(
        ['-c', `user.name=${opts.author.name}`, '-c', `user.email=${opts.author.email}`, 'commit', '--quiet', '--only', '-m', `${opts.message}\n\n${TRAILER}/0.2.0`, '--', ...opts.paths],
        this.clone,
      );
      if (!commit.ok) {
        await git(['reset', '--quiet', '--', ...opts.paths], this.clone);
        for (const p of opts.paths) await rm(join(this.clone, p), { force: true });
        return { ok: false, code: 'pull_failed', detail: `git commit: ${commit.stderr.trim()}` };
      }

      if (await this.pushWithRetry(branch)) return { ok: true };
      return { ok: false, code: 'committed_not_pushed', detail: 'committed locally; the push was rejected three times' };
    });
  }

  private async pushWithRetry(branch: string): Promise<boolean> {
    for (let attempt = 1; attempt <= PUSH_ATTEMPTS; attempt++) {
      if (await this.push(branch)) return true;
      if (attempt === PUSH_ATTEMPTS) break;
      await jitter();
      await this.pullRebase(branch);
    }
    return false;
  }
}
