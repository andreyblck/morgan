import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from './rpc.js';
import { makeFixture, git, cloneOf } from './fixture.js';

const finding = (files: string[]) => ({
  type: 'finding',
  fields: {
    symptom: 'cart total drifts by a cent on discounted orders',
    cause: 'rounding happens before the discount is applied',
    confidence: 'Confirmed',
    verify: ['pnpm', 'test', '--', 'cart'],
    files,
  },
  body: 'Ruled out: currency conversion (reproduces in USD only).',
});

function commitFile(dir: string, path: string, content: string, msg: string): string {
  mkdirSync(join(dir, path, '..'), { recursive: true });
  writeFileSync(join(dir, path), content);
  git(['add', path], dir);
  git(['commit', '-q', '-m', msg], dir);
  return git(['rev-parse', 'HEAD'], dir);
}

// Freshness is about the team's main line, not about whichever branch this checkout is on.
// A note written on main must still be judged against main from an old feature branch.
test('freshness: a note is judged against origin/main even when the checkout is on an older branch', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const a = commitFile(fx.proj, 'src/cart/total.ts', 'export const total = 1;\n', 'add cart total');
    const w = await srv.tool('write', finding(['src/cart/total.ts']));
    assert.equal(w.ok, true, JSON.stringify(w));

    // The remote's main moves on and touches the file the note names.
    git(['update-ref', 'refs/remotes/origin/main', a], fx.proj);
    git(['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main'], fx.proj);
    const b = commitFile(fx.proj, 'src/cart/total.ts', 'export const total = 2;\n', 'fix cart total');
    git(['update-ref', 'refs/remotes/origin/main', b], fx.proj);

    // This developer is on a branch cut before the note's commit.
    git(['checkout', '-q', '-b', 'old-feature', fx.sha], fx.proj);

    const r = await srv.tool('read', { path: w.path });
    const stale = r.stale as { changed?: boolean; commits?: number; against?: string; unknown?: boolean };
    assert.equal(stale.unknown, undefined, JSON.stringify(stale));
    assert.equal(stale.changed, true);
    assert.equal(stale.commits, 1);
    assert.match(String(stale.against), /^origin\/main@[0-9a-f]{7}$/);
    assert.equal((stale as { by?: string }).by, 'history');
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

// How a real team works: the note is written on a feature branch, the branch reaches main squashed,
// so the note's own commit is never on main. Freshness falls back to time: main's commits touching
// the note's files since the note was written.
test('freshness: a note from a squash-merged branch is judged by date against main', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    git(['checkout', '-q', '-b', 'feature'], fx.proj);
    commitFile(fx.proj, 'src/cart/total.ts', 'export const total = 1;\n', 'wip on feature');
    const w = await srv.tool('write', finding(['src/cart/total.ts']));
    assert.equal(w.ok, true, JSON.stringify(w));

    // main gets the squashed result later; the feature commit itself never lands there.
    git(['checkout', '-q', 'main'], fx.proj);
    const later = new Date(Date.now() + 3600_000).toISOString();
    mkdirSync(join(fx.proj, 'src/cart'), { recursive: true });
    writeFileSync(join(fx.proj, 'src/cart/total.ts'), 'export const total = 2;\n');
    git(['add', 'src/cart/total.ts'], fx.proj);
    execFileSync('git', ['commit', '-q', '-m', 'squash: cart total fix'], { cwd: fx.proj, env: { ...process.env, GIT_AUTHOR_DATE: later, GIT_COMMITTER_DATE: later } });
    git(['update-ref', 'refs/remotes/origin/main', git(['rev-parse', 'HEAD'], fx.proj)], fx.proj);
    git(['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main'], fx.proj);

    const stale = (await srv.tool('read', { path: w.path })).stale as { changed?: boolean; commits?: number; by?: string; unknown?: boolean };
    assert.equal(stale.unknown, undefined, JSON.stringify(stale));
    assert.equal(stale.by, 'time');
    assert.equal(stale.changed, true);
    assert.equal(stale.commits, 1);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

// A checkout that last fetched main before the note was written can see nothing after the note.
// Saying "unchanged" there would be false comfort; say it can't tell, and how to fix that.
test('freshness: a main line fetched before the note was written cannot vouch for it', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const old = new Date(Date.now() - 86_400_000).toISOString();
    execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'yesterday on main'], { cwd: fx.proj, env: { ...process.env, GIT_AUTHOR_DATE: old, GIT_COMMITTER_DATE: old } });
    git(['update-ref', 'refs/remotes/origin/main', git(['rev-parse', 'HEAD'], fx.proj)], fx.proj);
    git(['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main'], fx.proj);
    git(['checkout', '-q', '-b', 'feature'], fx.proj);
    commitFile(fx.proj, 'src/cart/total.ts', 'export const total = 1;\n', 'wip on feature');
    const w = await srv.tool('write', finding(['src/cart/total.ts']));
    assert.equal(w.ok, true, JSON.stringify(w));

    const stale = (await srv.tool('read', { path: w.path })).stale as { unknown?: boolean; reason?: string };
    assert.equal(stale.unknown, true, JSON.stringify(stale));
    assert.match(String(stale.reason), /before the note was written.*git fetch/);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

// When freshness can't be judged at all, say why, so the reader knows what to do about it.
test('freshness: unknown comes with a reason the reader can act on', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    await srv.tool('status');
    // A note committed another way: a commit this checkout never fetched, and no creation date.
    const v = cloneOf(fx.repo, fx.dir);
    const path = 'projects/acme--repo/findings/01ARZ3NDEKTSV4RRFFQ69G5FAV-hand-written.md';
    mkdirSync(join(v, 'projects/acme--repo/findings'), { recursive: true });
    writeFileSync(join(v, path), ['---', 'type: finding', 'project: acme--repo', 'confidence: Confirmed', 'sha: deadbeefcafe0001', 'files: [src/a.ts]', 'verify: [pnpm, test]', '---', 'body'].join('\n'));
    git(['add', '-A'], v);
    git(['-c', 'user.name=x', '-c', 'user.email=x@x', 'commit', '-q', '-m', 'hand'], v);
    git(['push', '-q', 'origin', 'HEAD:main'], v);
    await srv.tool('search', { query: 'anything' }); // pulls

    const stale = (await srv.tool('read', { path })).stale as { unknown?: boolean; reason?: string; against?: string };
    assert.equal(stale.unknown, true, JSON.stringify(stale));
    assert.match(String(stale.reason), /git fetch/);
    assert.match(String(stale.against), /^HEAD@[0-9a-f]{7}$/);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});
