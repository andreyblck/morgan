import { open, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const LOCK = '.vault.lock';
const WAIT_MS = 30_000;
const POLL_MS = 100;

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * One writer per clone at a time. Several Claude Code sessions on one machine each
 * start their own server over the same clone, and git's own index.lock is not a queue.
 * A lock whose owner is dead is taken over; a live one is waited on, then refused.
 */
export async function withLock<T>(cloneDir: string, fn: () => Promise<T>): Promise<T> {
  const path = join(cloneDir, LOCK);
  const deadline = Date.now() + WAIT_MS;
  for (;;) {
    try {
      const fh = await open(path, 'wx');
      await fh.writeFile(`${process.pid} ${new Date().toISOString()}\n`);
      await fh.close();
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      const owner = Number.parseInt((await readFile(path, 'utf8').catch(() => '')).split(' ')[0] ?? '', 10);
      if (Number.isInteger(owner) && owner !== process.pid && !pidAlive(owner)) {
        await rm(path, { force: true });
        continue;
      }
      if (Date.now() > deadline) throw new Error(`lock_timeout: ${path} held by pid ${owner}`);
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
  try {
    return await fn();
  } finally {
    await rm(path, { force: true });
  }
}
