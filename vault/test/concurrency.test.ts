import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startServer, type Server } from './rpc.js';
import { makeFixture, cloneOf, git, TRAIL_BODY } from './fixture.js';

const trail = (goal: string) => ({ type: 'trail', fields: { goal, files: [] }, body: TRAIL_BODY });

test('SC8: two servers on one clone and two more clones, ten writes each, all land', async () => {
  const fx = makeFixture();
  const env = (data: string) => ({ MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data(data) });
  // Forty writes contend for one remote; the last in the queue waits for the others.
  const slow = { cwd: fx.proj, timeoutMs: 180_000 };
  const servers: Server[] = await Promise.all([
    startServer({ env: env('home-a'), ...slow }),
    startServer({ env: env('home-a'), ...slow }), // same clone as the first
    startServer({ env: env('home-b'), ...slow }),
    startServer({ env: env('home-c'), ...slow }),
  ]);
  try {
    for (const s of servers) await s.tool('status');
    // Each server writes ten notes one after another, the way a session would; the four
    // servers run at the same time, the way four developers would.
    const perServer = await Promise.all(
      servers.map(async (s, si) => {
        const out: Array<Record<string, unknown>> = [];
        for (let i = 0; i < 10; i++) out.push(await s.tool('write', trail(`server ${si} write ${i}`)));
        return out;
      }),
    );
    const results = perServer.flat();
    const codes = results.map((r) => (r.ok ? 'ok' : String(r.code)));
    assert.ok(codes.every((c) => c === 'ok' || c === 'committed_not_pushed'), codes.join(','));

    // A later call on each server pushes what a failed push left behind.
    for (const s of servers) {
      const st = await s.tool('status');
      assert.equal(st.unpushed, 0, JSON.stringify(st));
      assert.equal(git(['status', '--porcelain', '--untracked-files=no'], String(st.clone)), '');
    }

    const v = cloneOf(fx.repo, fx.dir);
    assert.equal(readdirSync(join(v, 'projects/acme--repo/trails')).length, 40);
    assert.equal(git(['rev-list', '--count', 'HEAD'], v), '40');
    git(['fsck', '--no-progress'], v);

    const logs = readdirSync(join(fx.data('home-a'), 'vault')).filter((n) => n.endsWith('.log'));
    assert.equal(logs.length, 1);
    const log = readFileSync(join(fx.data('home-a'), 'vault', logs[0]!), 'utf8');
    assert.ok(!/force/.test(log), 'no force in the log');
    assert.match(log, /write ok/);
  } finally {
    for (const s of servers) await s.close();
    fx.cleanup();
  }
});

test('a lock held by a live process is waited on, then refused with lock_timeout', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data(), MORGAN_VAULT_LOCK_WAIT_MS: '600' }, cwd: fx.proj });
  try {
    const clone = String((await srv.tool('status')).clone);
    writeFileSync(join(clone, '.vault.lock'), `${process.pid} ${new Date().toISOString()}\n`);
    const t0 = Date.now();
    const r = await srv.tool('write', trail('blocked'));
    assert.equal(r.ok, false);
    assert.equal(r.code, 'lock_timeout');
    assert.ok(Date.now() - t0 >= 500, 'it waited');
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('a lock left by a dead process is taken over', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const clone = String((await srv.tool('status')).clone);
    writeFileSync(join(clone, '.vault.lock'), `999999 ${new Date().toISOString()}\n`);
    const r = await srv.tool('write', trail('after a crash'));
    assert.equal(r.ok, true, JSON.stringify(r));
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('startup reconciles: the server\'s own unpushed commit is pushed, a hand-made one is reported', async () => {
  const fx = makeFixture();
  const first = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  const clone = String((await first.tool('status')).clone);
  await first.tool('write', trail('seed'));
  await first.close();

  // A commit the server made but could not push (the trailer marks it as ours).
  mkdirSync(join(clone, 'projects/acme--repo/trails'), { recursive: true });
  writeFileSync(join(clone, 'projects/acme--repo/trails/01ARZ3NDEKTSV4RRFFQ69G5FAV-left-behind.md'), '---\ntype: trail\n---\n## Goal\n');
  git(['add', '-A'], clone);
  git(['-c', 'user.name=x', '-c', 'user.email=x@x', 'commit', '-q', '-m', 'vault: trail\n\nVault-Server: morgan-vault/0.2.0'], clone);

  const second = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const st = await second.tool('status');
    assert.equal(st.unpushed, 0, JSON.stringify(st));
    assert.equal(git(['rev-list', '--count', 'HEAD'], cloneOf(fx.repo, fx.dir)), '2');

    // A hand-made commit is never pushed; status reports it and writes refuse.
    writeFileSync(join(clone, 'projects/acme--repo/trails/by-hand.md'), 'x\n');
    git(['add', '-A'], clone);
    git(['-c', 'user.name=x', '-c', 'user.email=x@x', 'commit', '-q', '-m', 'bypass'], clone);
    const st2 = await second.tool('status');
    assert.equal(st2.unpushed, 1);
    assert.equal(st2.unpushed_foreign, 1);
    const w = await second.tool('write', trail('refused'));
    assert.equal(w.code, 'clone_dirty');
    assert.equal(git(['rev-list', '--count', 'HEAD'], cloneOf(fx.repo, fx.dir)), '2');
  } finally {
    await second.close();
    fx.cleanup();
  }
});
