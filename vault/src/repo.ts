import { access, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { git } from './git.js';
import { LockTimeout, withLock } from './lock.js';
import { assertRef, UnsafeRef } from './project.js';

const TRAILER = 'Vault-Server: morgan-vault';
const PUSH_ATTEMPTS = 5;

export type RepoError = {
  ok: false;
  code: 'clone_dirty' | 'clone_needs_reconcile' | 'pull_failed' | 'committed_not_pushed' | 'lock_timeout' | 'unsafe_ref';
  detail: string;
};

const exists = (p: string) => access(p).then(() => true, () => false);
const jitter = (attempt: number) => new Promise((r) => setTimeout(r, 200 * attempt + Math.random() * 800));

/** The server's view of its clone of the vault. Every git call goes through `git()`. */
export class Repo {
  constructor(
    public readonly clone: string,
    private readonly url: string,
    /** Where retries and recoveries get written down. Never a note body. */
    private readonly note: (line: string) => void = () => undefined,
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

  /**
   * The default branch. Validated before it ever reaches a git argument: the value comes from
   * the vault remote's HEAD, and a branch named like `--upload-pack=...` would otherwise turn a
   * routine pull into code execution. An unsafe name throws rather than operating on it.
   */
  async branch(): Promise<string> {
    const r = await git(['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'], this.clone);
    if (r.ok) return assertRef(r.stdout.trim().replace(/^origin\//, ''));
    const local = await git(['symbolic-ref', '--quiet', '--short', 'HEAD'], this.clone);
    return assertRef(local.ok ? local.stdout.trim() : 'main');
  }

  private knownRemoteBranches = new Set<string>();

  /** A round-trip to the remote, so once a branch is known to exist the answer is kept. */
  async remoteHasBranch(branch: string): Promise<boolean> {
    if (this.knownRemoteBranches.has(branch)) return true;
    const r = await git(['ls-remote', '--heads', 'origin', branch], this.clone);
    const has = r.ok && r.stdout.trim() !== '';
    if (has) this.knownRemoteBranches.add(branch);
    return has;
  }

  async remoteReachable(): Promise<boolean> {
    return (await git(['ls-remote', '--exit-code', '--heads', 'origin'], this.clone)).code !== 128;
  }

  async hasHead(): Promise<boolean> {
    return (await git(['rev-parse', '--verify', '--quiet', 'HEAD'], this.clone)).ok;
  }

  async headSha(): Promise<string | null> {
    const r = await git(['rev-parse', '--verify', '--quiet', 'HEAD'], this.clone);
    return r.ok ? r.stdout.trim() : null;
  }

  /** Cheap change detector for the index: the tree hash of HEAD plus any staged edits. */
  async treeFingerprint(): Promise<string> {
    const r = await git(['write-tree'], this.clone);
    return r.ok ? r.stdout.trim() : '';
  }

  async midRebase(): Promise<boolean> {
    return (await exists(join(this.clone, '.git', 'rebase-merge'))) || (await exists(join(this.clone, '.git', 'rebase-apply')));
  }

  async abortRebase(): Promise<void> {
    await git(['rebase', '--abort'], this.clone);
    this.note('rebase aborted');
  }

  /** Tracked files changed and not committed. Untracked files (the lock) don't count. */
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

  /** For reads: take what the remote has, never rewrite local commits. */
  async pullFfOnly(branch: string): Promise<boolean> {
    return (await git(['pull', '--ff-only', '--quiet', 'origin', branch], this.clone)).ok;
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
   * Bring a clone that a crash or a failed push left behind back to a known state:
   * no rebase in progress, and the server's own unpushed commits pushed. Foreign
   * commits are left alone and reported; they are never pushed. Never resets.
   */
  async reconcile(): Promise<{ ours: number; foreign: number; pushed: boolean }> {
    return withLock(this.clone, async () => {
      if (await this.midRebase()) await this.abortRebase();
      const pending = await this.unpushed();
      const ours = pending.filter((c) => c.ours).length;
      const foreign = pending.length - ours;
      let pushed = false;
      if (ours > 0 && foreign === 0) {
        pushed = await this.pushWithRetry(await this.branch());
        this.note(pushed ? `reconcile: pushed ${ours} earlier commit(s)` : `reconcile: ${ours} earlier commit(s) still unpushed`);
      }
      return { ours, foreign, pushed };
    });
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
    try {
      return await withLock(this.clone, () => this.cycle(opts));
    } catch (e) {
      if (e instanceof LockTimeout) return { ok: false, code: 'lock_timeout', detail: e.message };
      if (e instanceof UnsafeRef) return { ok: false, code: 'unsafe_ref', detail: e.message };
      throw e;
    }
  }

  private async cycle(opts: { paths: string[]; message: string; author: { name: string; email: string }; write: () => Promise<void> }): Promise<{ ok: true } | RepoError> {
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
      await this.restorePaths(opts.paths);
      return { ok: false, code: 'pull_failed', detail: `git add: ${add.stderr.trim()}` };
    }
    const commit = await git(
      ['-c', `user.name=${opts.author.name}`, '-c', `user.email=${opts.author.email}`, 'commit', '--quiet', '--only', '-m', `${opts.message}\n\n${TRAILER}/0.2.0`, '--', ...opts.paths],
      this.clone,
    );
    if (!commit.ok) {
      await git(['reset', '--quiet', '--', ...opts.paths], this.clone);
      await this.restorePaths(opts.paths);
      return { ok: false, code: 'pull_failed', detail: `git commit: ${commit.stderr.trim()}` };
    }

    if (await this.pushWithRetry(branch)) return { ok: true };
    return { ok: false, code: 'committed_not_pushed', detail: `committed locally; the push was rejected ${PUSH_ATTEMPTS} times` };
  }

  /**
   * Undo a failed write without leaving the clone dirty. A path that exists in HEAD is a
   * tracked file (a superseded note being flipped) — restore it; one that doesn't is a fresh
   * file — remove it. Deleting a tracked file instead would make the clone permanently dirty,
   * and reconcile never resets.
   */
  private async restorePaths(paths: string[]): Promise<void> {
    for (const p of paths) {
      if ((await git(['cat-file', '-e', `HEAD:${p}`], this.clone)).ok) {
        await git(['checkout', '--', p], this.clone);
      } else {
        await rm(join(this.clone, p), { force: true });
      }
    }
  }

  private async pushWithRetry(branch: string): Promise<boolean> {
    for (let attempt = 1; attempt <= PUSH_ATTEMPTS; attempt++) {
      if (await this.push(branch)) return true;
      if (attempt === PUSH_ATTEMPTS) break;
      this.note(`push rejected, retry ${attempt}/${PUSH_ATTEMPTS - 1} after rebase`);
      await jitter(attempt);
      if (!(await this.pullRebase(branch))) {
        // A rebase that conflicts will conflict again; pushing on top of it is noise.
        this.note('rebase failed; leaving the commit local');
        return false;
      }
    }
    return false;
  }
}
